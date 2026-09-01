import {
  Injectable,
  Logger,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'crypto';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../common/redis/redis.service';

export const AUTH_TOKEN_CACHE_TTL_SECONDS = 60;
export const USER_TOKENS_INDEX_TTL_SECONDS = 3600; // 1 hour index retention

export interface AuthenticateOptions {
  optional?: boolean;
}

@Injectable()
export class AuthTokenService {
  private readonly logger = new Logger(AuthTokenService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Extracts the Bearer token from the Authorization header of an incoming HTTP request.
   */
  extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers?.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : undefined;
  }

  /**
   * Hashes a raw bearer token with SHA-256 for secure, fixed-length cache key indexing.
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getTokenCacheKey(tokenHash: string): string {
    return `auth:token:${tokenHash}`;
  }

  getUserTokensKey(userId: string): string {
    return `auth:user-tokens:${userId}`;
  }

  /**
   * Verifies a bearer token via Redis fast-path cache or Supabase Auth network call.
   * On cache miss, verifies with Supabase, populates Redis cache, and indexes the token for the user.
   */
  async verifyToken(token: string): Promise<User | null> {
    const tokenHash = this.hashToken(token);
    const cacheKey = this.getTokenCacheKey(tokenHash);

    // 1. High-throughput fast path: Redis / Memory cache
    const cachedUser = await this.redisService.getJson<User>(cacheKey);
    if (cachedUser) {
      // Banned sessions must not pass through the cache (audit 1.6).
      if (this.isBanned(cachedUser)) {
        await this.redisService.del(cacheKey);
        return null;
      }
      return cachedUser;
    }

    // 2. Cache miss -> Validate via Supabase network API
    try {
      const supabase = this.supabaseService.getClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        // Supabase rejected the token (expired, revoked, banned) — purge any
        // stale cache entry so subsequent requests fail fast and stay correct.
        await this.redisService.del(cacheKey);
        return null;
      }

      // 3. Cache valid user session
      await this.redisService.setJson(
        cacheKey,
        user,
        AUTH_TOKEN_CACHE_TTL_SECONDS,
      );

      // 4. Index active token under user ID to allow user-wide session invalidation
      await this.indexUserToken(user.id, tokenHash);

      return user;
    } catch (err) {
      this.logger.warn(
        `Supabase token verification failed: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Supabase sets `banned_until` on banned users; a past timestamp means the
   * ban expired and the session is valid again.
   */
  private isBanned(user: User): boolean {
    const bannedUntil = user.banned_until;
    if (!bannedUntil) return false;
    return new Date(bannedUntil).getTime() > Date.now();
  }

  /**
   * Maintains a set of active token hashes indexed by user ID.
   */
  private async indexUserToken(
    userId: string,
    tokenHash: string,
  ): Promise<void> {
    try {
      const key = this.getUserTokensKey(userId);
      const existing = (await this.redisService.getJson<string[]>(key)) || [];
      if (!existing.includes(tokenHash)) {
        existing.push(tokenHash);
        await this.redisService.setJson(
          key,
          existing,
          USER_TOKENS_INDEX_TTL_SECONDS,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed to index token for user ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Invalidates a single cached bearer token in Redis.
   */
  async invalidateToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.redisService.del(this.getTokenCacheKey(tokenHash));
  }

  /**
   * Invalidates all cached bearer tokens associated with a given user ID (e.g. on logout, role change, ban).
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    try {
      const userTokensKey = this.getUserTokensKey(userId);
      const tokenHashes =
        await this.redisService.getJson<string[]>(userTokensKey);
      if (tokenHashes && Array.isArray(tokenHashes)) {
        for (const hash of tokenHashes) {
          await this.redisService.del(this.getTokenCacheKey(hash));
        }
      }
      await this.redisService.del(userTokensKey);
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate user tokens for ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Authenticates an incoming ExecutionContext request using the unified verification logic.
   * If options.optional is true, unauthenticated/invalid requests proceed with request.user = undefined.
   * Otherwise, throws UnauthorizedException.
   */
  async authenticateRequest(
    context: ExecutionContext,
    options: AuthenticateOptions = { optional: false },
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      if (options.optional) {
        return true;
      }
      throw new UnauthorizedException();
    }

    const user = await this.verifyToken(token);

    if (!user) {
      if (options.optional) {
        return true;
      }
      throw new UnauthorizedException();
    }

    (request as Request & { user?: User }).user = user;
    return true;
  }
}

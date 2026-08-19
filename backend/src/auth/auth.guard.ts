import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'crypto';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../common/redis/redis.service';

const AUTH_TOKEN_CACHE_TTL_SECONDS = 60;

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const cacheKey = `auth:token:${tokenHash}`;

    // 1. Check Redis / Memory cache for high-throughput fast path
    const cachedUser = await this.redisService.getJson<User>(cacheKey);
    if (cachedUser) {
      (request as Request & { user?: User }).user = cachedUser;
      return true;
    }

    // 2. Cache miss -> Validate via Supabase network API
    const supabase = this.supabaseService.getClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException();
    }

    // 3. Cache valid user session
    await this.redisService.setJson(
      cacheKey,
      user,
      AUTH_TOKEN_CACHE_TTL_SECONDS,
    );

    // Attach user to request object
    (request as Request & { user?: User }).user = user;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers?.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : undefined;
  }
}

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private redisConfigured = false;
  private memoryFallback = new Map<
    string,
    { value: string; expiresAt?: number }
  >();
  private readonly rateLimitFallback = new Map<
    string,
    { count: number; expiresAt: number }
  >();
  private static readonly MAX_RATE_LIMIT_FALLBACK_KEYS = 10_000;
  private static readonly INCREMENT_WITH_EXPIRY_SCRIPT = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return count
  `;

  onModuleInit() {
    const host = process.env.REDIS_HOST;
    if (!host) {
      this.logger.log(
        'Redis is not configured. Using in-memory cache fallback.',
      );
      return;
    }

    this.redisConfigured = true;
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    try {
      this.client = new Redis({
        host,
        port,
        password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis connection warning: ${err.message}`);
      });

      this.client.connect().catch((err: unknown) => {
        this.logger.warn(
          `Redis connection failed on startup: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    } catch (err: unknown) {
      this.logger.error(
        `Redis initialization failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.client.status === 'ready') {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback to memory
      }
    }

    const item = this.memoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.memoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        // Fallback to memory
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryFallback.set(key, { value, expiresAt });
  }

  async incrementWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    if (this.redisConfigured) {
      if (!this.client || this.client.status !== 'ready') {
        throw new Error('Redis rate-limit counter is not ready');
      }

      const count = await this.client.eval(
        RedisService.INCREMENT_WITH_EXPIRY_SCRIPT,
        1,
        key,
        ttlSeconds,
      );
      return Number(count);
    }

    const now = Date.now();
    const current = this.rateLimitFallback.get(key);
    if (current && current.expiresAt > now) {
      current.count += 1;
      return current.count;
    }

    if (current) this.rateLimitFallback.delete(key);
    if (
      !this.rateLimitFallback.has(key) &&
      this.rateLimitFallback.size >= RedisService.MAX_RATE_LIMIT_FALLBACK_KEYS
    ) {
      const oldestKey = this.rateLimitFallback.keys().next().value;
      if (oldestKey) this.rateLimitFallback.delete(oldestKey);
    }

    this.rateLimitFallback.set(key, {
      count: 1,
      expiresAt: now + ttlSeconds * 1000,
    });
    return 1;
  }

  async del(key: string): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        await this.client.del(key);
      } catch {
        // Fallback
      }
    }
    this.memoryFallback.delete(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(
        `Failed to parse cached JSON for key ${key}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  async setJson<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(data);
    await this.set(key, raw, ttlSeconds);
  }

  async delByPattern(pattern: string): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch (err) {
        this.logger.warn(
          `Failed to delete Redis keys by pattern ${pattern}: ${(err as Error).message}`,
        );
      }
    }

    // Fallback: match pattern in memoryFallback
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of Array.from(this.memoryFallback.keys())) {
      if (regexPattern.test(key)) {
        this.memoryFallback.delete(key);
      }
    }
  }

  /**
   * Stale-While-Revalidate (SWR) Caching Strategy.
   * Returns cached data immediately (0-3ms). If data is stale, launches asynchronous background fetch.
   */
  async getOrFetchSWR<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: { ttlFreshSeconds?: number; ttlStaleSeconds?: number },
  ): Promise<T> {
    const ttlFresh = options?.ttlFreshSeconds ?? 300; // 5 mins fresh
    const ttlStale = options?.ttlStaleSeconds ?? 3600; // 1 hour total retention

    interface SwrEnvelope<D> {
      data: D;
      cachedAt: number;
      ttlFresh: number;
    }

    const envelope = await this.getJson<SwrEnvelope<T>>(key);

    if (envelope) {
      const isFresh = Date.now() - envelope.cachedAt < envelope.ttlFresh * 1000;
      if (isFresh) {
        return envelope.data;
      }

      // Return stale data immediately, revalidate asynchronously in background
      void (async () => {
        try {
          const freshData = await fetchFn();
          const newEnvelope: SwrEnvelope<T> = {
            data: freshData,
            cachedAt: Date.now(),
            ttlFresh,
          };
          await this.setJson(key, newEnvelope, ttlStale);
        } catch (err) {
          this.logger.warn(
            `Background SWR revalidation failed for key ${key}: ${(err as Error).message}`,
          );
        }
      })();

      return envelope.data;
    }

    // Cache MISS: Fetch synchronously, store in Redis, return
    const freshData = await fetchFn();
    const newEnvelope: SwrEnvelope<T> = {
      data: freshData,
      cachedAt: Date.now(),
      ttlFresh,
    };
    await this.setJson(key, newEnvelope, ttlStale);
    return freshData;
  }
}

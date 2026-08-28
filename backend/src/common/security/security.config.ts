import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';
import type { RedisService } from '../redis/redis.service';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 120;
// Stricter budget for expensive/sensitive write endpoints (e.g. anonymous order creation).
export const PATH_RATE_LIMITS: Readonly<Record<string, number>> = {
  '/api/products/orders': 10,
};
const DEFAULT_RATE_LIMIT_SKIP_PATH_PREFIXES = [
  '/api/health',
  '/api/webhooks/stripe',
];

export interface RateLimitResult {
  count: number;
  ttl: number;
}

export interface RateLimitStorage {
  increment(key: string, ttlSeconds: number): Promise<RateLimitResult>;
}

export class MemoryRateLimitStorage implements RateLimitStorage {
  private readonly store = new Map<
    string,
    { count: number; resetAt: number }
  >();

  increment(key: string, ttlSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = ttlSeconds * 1000;
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return Promise.resolve({ count: 1, ttl: ttlSeconds });
    }

    entry.count += 1;
    const remainingTtl = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return Promise.resolve({ count: entry.count, ttl: remainingTtl });
  }

  clear(): void {
    this.store.clear();
  }
}

export class RedisRateLimitStorage implements RateLimitStorage {
  private readonly memoryFallback = new MemoryRateLimitStorage();
  private client: Redis | null = null;

  constructor(redisOrService?: RedisService | Redis | null) {
    if (redisOrService) {
      if (
        typeof redisOrService === 'object' &&
        'client' in (redisOrService as unknown as Record<string, unknown>)
      ) {
        this.client =
          (redisOrService as unknown as { client: Redis | null }).client ||
          null;
      } else {
        this.client = redisOrService as Redis;
      }
    }
  }

  async increment(key: string, ttlSeconds: number): Promise<RateLimitResult> {
    const fullKey = `ratelimit:${key}`;

    if (this.client && this.client.status === 'ready') {
      try {
        const results = await this.client
          .multi()
          .incr(fullKey)
          .ttl(fullKey)
          .exec();

        if (results && results.length >= 2) {
          const [errIncr, countRes] = results[0];
          const [errTtl, ttlRes] = results[1];

          if (!errIncr && !errTtl) {
            const count = Number(countRes);
            let ttl = Number(ttlRes);

            // If key is newly created (count === 1) or has no TTL (ttl < 0), set expire
            if (count === 1 || ttl < 0) {
              await this.client.expire(fullKey, ttlSeconds);
              ttl = ttlSeconds;
            }

            return { count, ttl: ttl > 0 ? ttl : ttlSeconds };
          }
        }
      } catch {
        // Fallback to memory on Redis command error
      }
    }

    return this.memoryFallback.increment(key, ttlSeconds);
  }
}

export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, '');
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseAllowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const configuredOrigins = env.CORS_ALLOWED_ORIGINS
    ? env.CORS_ALLOWED_ORIGINS.split(',')
    : [];

  const candidates = [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...configuredOrigins,
    env.APP_URL,
    env.SITE_URL,
  ];

  return [...new Set(candidates.filter(isNonEmptyString).map(normalizeOrigin))];
}

export function isOriginAllowed(
  origin: string,
  allowedOrigins: string[],
): boolean {
  return allowedOrigins.includes(normalizeOrigin(origin));
}

export function createCorsOriginDelegate(allowedOrigins: string[]) {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
      return;
    }

    callback(new ForbiddenException(`Origin ${origin} is not allowed by CORS`));
  };
}

export function applySecurityHeaders(res: Response): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );
}

export function createSecurityHeadersMiddleware() {
  return (_req: Request, res: Response, next: NextFunction) => {
    applySecurityHeaders(res);
    next();
  };
}

/**
 * Resolves client IP address securely.
 * When Express 'trust proxy' is configured, req.ip contains the validated client IP.
 */
export function resolveClientIp(req: Request): string {
  if (req.ip) {
    return req.ip;
  }
  return req.socket?.remoteAddress || 'unknown';
}

export interface RateLimitRule {
  id: string;
  method?: string;
  pattern: RegExp | string;
  maxRequests: number;
  windowSeconds: number;
}

export const FORUM_ANTI_SPAM_RULES: readonly RateLimitRule[] = [
  // Likes: max 60 per hour (3600s TTL)
  {
    id: 'anti-spam:likes',
    method: 'POST',
    pattern:
      /^(\/api)?\/(forum\/(posts|comments)\/[^/]+\/like|blog\/comments\/[^/]+\/like)/,
    maxRequests: 60,
    windowSeconds: 3600,
  },
  // Comments: max 20 per hour (3600s TTL)
  {
    id: 'anti-spam:comments',
    method: 'POST',
    pattern:
      /^(\/api)?\/(forum\/comments(\/post\/[^/]+)?|blog\/posts\/[^/]+\/comments)/,
    maxRequests: 20,
    windowSeconds: 3600,
  },
  // Anonymous contact/enquiry aliases share one budget to prevent route rotation.
  {
    id: 'anti-spam:contact-messages',
    method: 'POST',
    pattern: /^(\/api)?\/(enquiries|messages(?:\/contact)?)$/,
    maxRequests: 5,
    windowSeconds: 3600,
  },
  // Posts & Questions: max 5 per hour (3600s TTL)
  {
    id: 'anti-spam:posts',
    method: 'POST',
    pattern: /^(\/api)?\/(forum\/(posts|questions)|blog(\/submissions)?)$/,
    maxRequests: 5,
    windowSeconds: 3600,
  },
];

export interface RateLimitOptions {
  env?: NodeJS.ProcessEnv;
  storage?: RateLimitStorage;
  redisService?: RedisService;
  rules?: readonly RateLimitRule[];
}

export function createRateLimitMiddleware(
  optionsOrEnv?: NodeJS.ProcessEnv | RateLimitOptions,
  maybeRedisService?: RedisService,
) {
  let env: NodeJS.ProcessEnv = process.env;
  let storage: RateLimitStorage | undefined;
  let customRules: readonly RateLimitRule[] | undefined;

  if (optionsOrEnv) {
    if (
      'env' in optionsOrEnv ||
      'storage' in optionsOrEnv ||
      'redisService' in optionsOrEnv ||
      'rules' in optionsOrEnv
    ) {
      const opts = optionsOrEnv as RateLimitOptions;
      env = opts.env || process.env;
      customRules = opts.rules;
      storage =
        opts.storage ||
        (opts.redisService
          ? new RedisRateLimitStorage(opts.redisService)
          : undefined);
    } else {
      env = optionsOrEnv as NodeJS.ProcessEnv;
    }
  }

  if (!storage && maybeRedisService) {
    storage = new RedisRateLimitStorage(maybeRedisService);
  }

  if (!storage) {
    storage = new MemoryRateLimitStorage();
  }

  const rules = customRules || FORUM_ANTI_SPAM_RULES;

  const windowMs = Number(
    env.RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS,
  );
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const maxRequests = Number(
    env.RATE_LIMIT_MAX_REQUESTS || DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  );
  const skipPathPrefixes = env.RATE_LIMIT_SKIP_PATH_PREFIXES
    ? env.RATE_LIMIT_SKIP_PATH_PREFIXES.split(',').map((path) => path.trim())
    : DEFAULT_RATE_LIMIT_SKIP_PATH_PREFIXES;

  const resolveMaxRequests = (path: string): number => {
    const overrides = env.RATE_LIMIT_PATH_LIMITS
      ? (JSON.parse(env.RATE_LIMIT_PATH_LIMITS) as Record<string, number>)
      : PATH_RATE_LIMITS;
    const override = overrides[path];
    return typeof override === 'number' && override > 0
      ? override
      : maxRequests;
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    if (skipPathPrefixes.some((prefix) => req.path.startsWith(prefix))) {
      next();
      return;
    }

    const clientIp = resolveClientIp(req);
    const identity = `ip:${clientIp}`;
    const reqMethod = (req.method || 'GET').toUpperCase();

    // Check specific route & method rules (anti-spam, etc.)
    const matchedRule = rules.find((rule) => {
      if (rule.method && rule.method.toUpperCase() !== reqMethod) {
        return false;
      }
      if (typeof rule.pattern === 'string') {
        return req.path === rule.pattern || req.path === `/api${rule.pattern}`;
      }
      return rule.pattern.test(req.path);
    });

    const limit = matchedRule
      ? matchedRule.maxRequests
      : resolveMaxRequests(req.path);
    const effectiveWindowSeconds = matchedRule
      ? matchedRule.windowSeconds
      : windowSeconds;
    const key = matchedRule
      ? `${identity}:${matchedRule.id}:${limit}:${effectiveWindowSeconds}`
      : `${identity}:${limit}`;

    try {
      const { count, ttl } = await storage.increment(
        key,
        effectiveWindowSeconds,
      );

      if (count > limit) {
        res.setHeader('Retry-After', String(ttl));
        res.status(429).json({
          statusCode: 429,
          message: 'Too many requests',
          error: 'Too Many Requests',
        });
        return;
      }
    } catch {
      // In case of unexpected error, fail-open to not block legitimate users
    }

    next();
  };
}

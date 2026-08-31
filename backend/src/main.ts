import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  createCorsOriginDelegate,
  createRateLimitMiddleware,
  createSecurityHeadersMiddleware,
  parseAllowedOrigins,
} from './common/security/security.config';
import { RedisService } from './common/redis/redis.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Trust 1 reverse proxy hop (Nginx in Docker / VPS) for secure client IP resolution
  const trustProxySetting = process.env.TRUST_PROXY || '1';
  app.set(
    'trust proxy',
    trustProxySetting === 'true' ? true : Number(trustProxySetting) || 1,
  );

  const allowedOrigins = parseAllowedOrigins();
  const redisService = app.get(RedisService);

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(createSecurityHeadersMiddleware());
  app.use(createRateLimitMiddleware(process.env, redisService));
  app.enableCors({
    origin: createCorsOriginDelegate(allowedOrigins),
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000, process.env.HOST ?? '0.0.0.0');
}
void bootstrap();

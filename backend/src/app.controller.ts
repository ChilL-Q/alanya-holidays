import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';
import { RedisService } from './common/redis/redis.service';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  uptime: number;
  db: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  timestamp: string;
  version: string;
}

interface RedisClientWithStatus {
  status?: string;
  ping: () => Promise<string>;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthCheckResponse> {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isDbConnected = dbStatus === 'connected';
    const isRedisConnected = redisStatus === 'connected';

    let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';

    if (!isDbConnected) {
      overallStatus = 'error';
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    } else if (!isRedisConnected) {
      overallStatus = 'degraded';
      res.status(HttpStatus.OK);
    } else {
      overallStatus = 'ok';
      res.status(HttpStatus.OK);
    }

    return {
      status: overallStatus,
      uptime: Math.floor(process.uptime()),
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.1',
    };
  }

  private async checkDatabase(): Promise<'connected' | 'disconnected'> {
    let timerId: NodeJS.Timeout | undefined;
    try {
      const client = this.supabaseService?.getClient();
      if (!client) {
        return 'disconnected';
      }

      const timeoutPromise = new Promise<{
        error: { message: string } | null;
      }>((_, reject) => {
        timerId = setTimeout(
          () => reject(new Error('Database check timeout')),
          1500,
        );
      });

      const queryPromise = client
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .limit(1)
        .then((res) => ({ error: res.error }));

      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result && !result.error) {
        return 'connected';
      }
      return 'disconnected';
    } catch {
      return 'disconnected';
    } finally {
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  }

  private async checkRedis(): Promise<'connected' | 'disconnected'> {
    let timerId: NodeJS.Timeout | undefined;
    try {
      const redisHolder = this.redisService as unknown as {
        client?: RedisClientWithStatus | null;
      };
      const client = redisHolder?.client;

      if (!client || client.status !== 'ready') {
        return 'disconnected';
      }

      const timeoutPromise = new Promise<string>((_, reject) => {
        timerId = setTimeout(
          () => reject(new Error('Redis check timeout')),
          1000,
        );
      });

      const pong = await Promise.race([client.ping(), timeoutPromise]);

      return pong === 'PONG' ? 'connected' : 'disconnected';
    } catch {
      return 'disconnected';
    } finally {
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly redisService: RedisService) {}

  async enqueueTask(
    queueName: string,
    taskName: string,
    payload: any,
  ): Promise<boolean> {
    const jobKey = `queue:${queueName}:${taskName}:${Date.now()}`;
    await this.redisService.setJson(jobKey, payload, 3600);
    this.logger.log(`Enqueued task ${taskName} to ${queueName}`);
    return true;
  }
}

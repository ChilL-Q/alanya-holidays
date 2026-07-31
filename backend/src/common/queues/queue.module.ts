import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}

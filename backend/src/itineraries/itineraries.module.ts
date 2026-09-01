import { Module } from '@nestjs/common';
import { ItinerariesController } from './itineraries.controller';
import { ItinerariesService } from './itineraries.service';
import { ItinerariesRepository } from './itineraries.repository';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../common/redis/redis.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SupabaseModule, AuthModule, RedisModule, AiModule],
  controllers: [ItinerariesController],
  providers: [ItinerariesService, ItinerariesRepository],
  exports: [ItinerariesService, ItinerariesRepository],
})
export class ItinerariesModule {}

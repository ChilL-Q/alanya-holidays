import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaProcessingService } from './media-processing.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [MediaController],
  providers: [MediaProcessingService],
  exports: [MediaProcessingService],
})
export class MediaModule {}

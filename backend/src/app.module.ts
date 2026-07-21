import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [SupabaseModule, BookingsModule, AuthModule, PropertiesModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

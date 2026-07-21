import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { MessagesModule } from './messages/messages.module';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [SupabaseModule, BookingsModule, AuthModule, PropertiesModule, ServicesModule, UsersModule, ReviewsModule, FavoritesModule, MessagesModule, BlogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

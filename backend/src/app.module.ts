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
import { DirectoryModule } from './directory/directory.module';
import { ProductsModule } from './products/products.module';
import { ForumModule } from './forum/forum.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RedisModule } from './common/redis/redis.module';
import { CommonModule } from './common/common.module';
import { AiModule } from './ai/ai.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { BillingModule } from './billing/billing.module';
import { ItinerariesModule } from './itineraries/itineraries.module';
import { BusinessApplicationsModule } from './business-applications/business-applications.module';

@Module({
  imports: [
    CommonModule,
    RedisModule,
    SupabaseModule,
    BookingsModule,
    AuthModule,
    PropertiesModule,
    ServicesModule,
    UsersModule,
    ReviewsModule,
    FavoritesModule,
    MessagesModule,
    BlogModule,
    DirectoryModule,
    ProductsModule,
    ForumModule,
    WebhooksModule,
    AiModule,
    MediaModule,
    NotificationsModule,
    AdminModule,
    BillingModule,
    ItinerariesModule,
    BusinessApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

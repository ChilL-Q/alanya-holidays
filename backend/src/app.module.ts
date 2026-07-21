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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

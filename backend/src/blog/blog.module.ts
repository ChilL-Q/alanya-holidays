import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';

@Module({
  imports: [AuthModule, AdminModule],
  providers: [BlogService, BlogRepository],
  controllers: [BlogController],
})
export class BlogModule {}

import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';

@Module({
  providers: [BlogService, BlogRepository],
  controllers: [BlogController],
})
export class BlogModule {}

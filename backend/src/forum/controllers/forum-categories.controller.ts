import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ForumCategoriesService } from '../services/forum-categories.service';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('forum/categories')
export class ForumCategoriesController {
  constructor(
    private readonly forumCategoriesService: ForumCategoriesService,
  ) {}

  @Get()
  async getForumCategories() {
    return this.forumCategoriesService.getForumCategories();
  }

  @Get('tree')
  async getForumCategoryTree() {
    return this.forumCategoriesService.getForumCategoryTree();
  }

  @Get('slug/:slug')
  async getForumCategory(@Param('slug') slug: string) {
    return this.forumCategoriesService.getForumCategory(slug);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createForumCategory(@Body() body: any, @Req() req: any) {
    return this.forumCategoriesService.createForumCategory(body, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateForumCategory(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.forumCategoriesService.updateForumCategory(
      id,
      body,
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteForumCategory(@Param('id') id: string, @Req() req: any) {
    return this.forumCategoriesService.deleteForumCategory(id, req.user.id);
  }
}

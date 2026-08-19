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
import {
  CreateForumCategoryDto,
  UpdateForumCategoryDto,
} from '../dto/forum-categories.dto';
import {
  AuthenticatedRequest,
  ForumActionResponse,
  ForumCategory,
} from '../types/forum.types';

@Controller('forum/categories')
export class ForumCategoriesController {
  constructor(
    private readonly forumCategoriesService: ForumCategoriesService,
  ) {}

  @Get()
  async getForumCategories(): Promise<ForumCategory[]> {
    return this.forumCategoriesService.getForumCategories();
  }

  @Get('tree')
  async getForumCategoryTree(): Promise<ForumCategory[]> {
    return this.forumCategoriesService.getForumCategoryTree();
  }

  @Get('slug/:slug')
  async getForumCategory(
    @Param('slug') slug: string,
  ): Promise<ForumCategory | null> {
    return this.forumCategoriesService.getForumCategory(slug);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createForumCategory(
    @Body() body: CreateForumCategoryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumCategory> {
    return this.forumCategoriesService.createForumCategory(body, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateForumCategory(
    @Param('id') id: string,
    @Body() body: UpdateForumCategoryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumCategory> {
    return this.forumCategoriesService.updateForumCategory(
      id,
      body,
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteForumCategory(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumActionResponse> {
    return this.forumCategoriesService.deleteForumCategory(id, req.user.id);
  }
}

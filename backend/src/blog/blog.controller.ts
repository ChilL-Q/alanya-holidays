import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  BlogPost,
  BlogPostSummary,
  BlogPostsListResult,
  BlogSubmission,
  BlogTag,
  SubmissionCreatedResponse,
  SuccessResponse,
} from './types/blog.types';
import {
  CreateBlogPostDto,
  CreateBlogSubmissionDto,
  CreateBlogTagDto,
  GetBlogQueryDto,
  GetBlogSubmissionsQueryDto,
  RejectBlogSubmissionDto,
  UpdateBlogPostDto,
} from './dto';
import { LimitQueryDto } from '../common/dto/pagination.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async getBlogPosts(
    @Query() query: GetBlogQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<BlogPostsListResult> {
    return this.blogService.getBlogPosts(query, user?.id);
  }

  @Get('featured')
  async getFeaturedBlogPosts(
    @Query() query?: LimitQueryDto | string,
  ): Promise<BlogPostSummary[]> {
    let limit = 3;
    if (typeof query === 'string') {
      limit = parseInt(query, 10) || 3;
    } else if (query?.limit !== undefined) {
      limit = Number(query.limit) || 3;
    }
    return this.blogService.getFeaturedBlogPosts(limit);
  }

  @Get('tags')
  async getBlogTags(): Promise<BlogTag[]> {
    return this.blogService.getBlogTags();
  }

  @Post('tags')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async createBlogTag(
    @Body() body: CreateBlogTagDto | { name: string },
    @CurrentUser() user: AuthUser,
  ): Promise<BlogTag> {
    const tagName =
      typeof body === 'object' && body !== null && 'name' in body
        ? body.name
        : '';
    return this.blogService.createBlogTag(tagName, user.id);
  }

  @Delete('tags/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async deleteBlogTag(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse> {
    return this.blogService.deleteBlogTag(id, user.id);
  }

  @Get('submissions/admin')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getBlogSubmissions(
    @Query() query: GetBlogSubmissionsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogSubmission[]> {
    return this.blogService.getBlogSubmissions(query, user.id);
  }

  @Get('submissions/me')
  @UseGuards(AuthGuard)
  async getUserBlogSubmissions(
    @CurrentUser() user: AuthUser,
  ): Promise<BlogSubmission[]> {
    return this.blogService.getUserBlogSubmissions(user.id);
  }

  @Post('submissions')
  @UseGuards(AuthGuard)
  async createBlogSubmission(
    @Body() body: CreateBlogSubmissionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SubmissionCreatedResponse> {
    return this.blogService.createBlogSubmission(body, user.id);
  }

  @Patch('submissions/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async approveBlogSubmission(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogPost> {
    return this.blogService.approveBlogSubmission(id, user.id);
  }

  @Patch('submissions/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async rejectBlogSubmission(
    @Param('id') id: string,
    @Body() body: RejectBlogSubmissionDto | { reason: string },
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse> {
    const reason =
      typeof body === 'object' && body !== null && 'reason' in body
        ? body.reason
        : '';
    return this.blogService.rejectBlogSubmission(id, reason, user.id);
  }

  @Get('post/:slug')
  async getBlogPost(
    @Param('slug') slug: string,
    @Query('incrementViews') incrementViews?: string,
  ): Promise<BlogPost> {
    return this.blogService.getBlogPost(slug, incrementViews !== 'false');
  }

  @Get('related/:id')
  async getRelatedPosts(
    @Param('id') id: string,
    @Query('category') category?: string,
    @Query() query?: LimitQueryDto | string,
  ): Promise<BlogPostSummary[]> {
    let limit = 3;
    if (typeof query === 'string') {
      limit = parseInt(query, 10) || 3;
    } else if (query?.limit !== undefined) {
      limit = Number(query.limit) || 3;
    }
    return this.blogService.getRelatedPosts(id, category || '', limit);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createBlogPost(
    @Body() body: CreateBlogPostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogPost> {
    return this.blogService.createBlogPost(body, user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateBlogPost(
    @Param('id') id: string,
    @Body() body: UpdateBlogPostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogPost> {
    return this.blogService.updateBlogPost(id, body, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteBlogPost(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse> {
    return this.blogService.deleteBlogPost(id, user.id);
  }

  @Post(':id/tags/:tagId')
  @UseGuards(AuthGuard)
  async addTagToPost(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse> {
    return this.blogService.addTagToPost(id, tagId, user.id);
  }

  @Delete(':id/tags/:tagId')
  @UseGuards(AuthGuard)
  async removeTagFromPost(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse> {
    return this.blogService.removeTagFromPost(id, tagId, user.id);
  }
}

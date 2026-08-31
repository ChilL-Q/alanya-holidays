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
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  BlogComment,
  BlogPost,
  BlogPostSummary,
  BlogPostsListResult,
  BlogSubmission,
  BlogTag,
  SubmissionCreatedResponse,
  SuccessResponse,
} from './types/blog.types';
import {
  BlogLimitQueryDto,
  CreateBlogCommentDto,
  CreateBlogPostDto,
  CreateBlogSubmissionDto,
  CreateBlogTagDto,
  GetBlogCommentsQueryDto,
  GetBlogQueryDto,
  GetBlogSubmissionsQueryDto,
  RejectBlogSubmissionDto,
  UpdateBlogPostDto,
  UpdateBlogSubmissionDto,
} from './dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get(['', 'posts'])
  @UseGuards(OptionalAuthGuard)
  async getBlogPosts(
    @Query() query: GetBlogQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<BlogPostsListResult> {
    return this.blogService.getBlogPosts(query, user?.id);
  }

  @Get('featured')
  async getFeaturedBlogPosts(
    @Query() query: BlogLimitQueryDto = {},
  ): Promise<BlogPostSummary[]> {
    return this.blogService.getFeaturedBlogPosts(query.limit ?? 3);
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
    @Query() query: GetBlogSubmissionsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogSubmission[]> {
    return this.blogService.getUserBlogSubmissions(query, user.id);
  }

  @Get('posts/me')
  @UseGuards(AuthGuard)
  async getUserBlogPosts(
    @Query() query: GetBlogQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogPostsListResult> {
    return this.blogService.getUserBlogPosts(query, user.id);
  }

  @Patch('submissions/:id')
  @UseGuards(AuthGuard)
  async updateUserBlogSubmission(
    @Param('id') id: string,
    @Body() body: UpdateBlogSubmissionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogSubmission> {
    return this.blogService.updateUserBlogSubmission(id, body, user.id);
  }

  @Post('submissions/:id/resubmit')
  @UseGuards(AuthGuard)
  async resubmitUserBlogSubmission(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogSubmission> {
    return this.blogService.resubmitUserBlogSubmission(id, user.id);
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
  @UseGuards(OptionalAuthGuard)
  async getBlogPost(
    @Param('slug') slug: string,
    @Query('incrementViews') incrementViews?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<BlogPost> {
    return this.blogService.getBlogPost(
      slug,
      incrementViews !== 'false',
      user?.id,
    );
  }

  @Get('related/:id')
  async getRelatedPosts(
    @Param('id') id: string,
    @Query('category') category: string | undefined,
    @Query() query: BlogLimitQueryDto = {},
  ): Promise<BlogPostSummary[]> {
    return this.blogService.getRelatedPosts(
      id,
      category || '',
      query.limit ?? 3,
    );
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

  // ── Blog Comments ────────────────────────────────────────────

  @Get('posts/:postId/comments')
  @UseGuards(OptionalAuthGuard)
  async getBlogComments(
    @Param('postId') postId: string,
    @Query() query: GetBlogCommentsQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<BlogComment[]> {
    return this.blogService.getBlogComments(postId, query, user?.id);
  }

  @Post('posts/:postId/comments')
  @UseGuards(AuthGuard)
  async createBlogComment(
    @Param('postId') postId: string,
    @Body() body: CreateBlogCommentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogComment> {
    return this.blogService.createBlogComment(postId, body, user.id);
  }

  @Put('comments/:id')
  @UseGuards(AuthGuard)
  async updateBlogComment(
    @Param('id') id: string,
    @Body() body: CreateBlogCommentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BlogComment> {
    return this.blogService.updateBlogComment(id, body.body, user.id);
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard)
  async deleteBlogComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse> {
    return this.blogService.deleteBlogComment(id, user.id);
  }

  @Post('comments/:id/like')
  @UseGuards(AuthGuard)
  async toggleBlogCommentLike(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ liked: boolean }> {
    return this.blogService.toggleBlogCommentLike(id, user.id);
  }
}

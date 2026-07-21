import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, Patch, Optional } from '@nestjs/common';
import { BlogService } from './blog.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async getBlogPosts(@Query() query: any, @Req() req: any) {
    // We try to get user id if token exists, but it's optional for read
    let userId = undefined;
    if (req.headers.authorization) {
      // Very simple extraction just to pass the id if authenticated
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        // AuthGuard sets req.user, but since we don't have UseGuards here, we rely on a manual check in service if needed,
        // Actually, to make it simple, let's just make a custom extraction or require the frontend to pass it if needed.
        // For now, we will pass undefined for anon users.
        // Real implementation would decode JWT or use a custom OptionalAuthGuard.
      }
    }
    return this.blogService.getBlogPosts(query, req.user?.id);
  }

  @Get('featured')
  async getFeaturedBlogPosts(@Query('limit') limit: string) {
    return this.blogService.getFeaturedBlogPosts(limit ? parseInt(limit) : 3);
  }

  @Get('tags')
  async getBlogTags() {
    return this.blogService.getBlogTags();
  }

  @Post('tags')
  @UseGuards(AuthGuard)
  async createBlogTag(@Body('name') name: string, @Req() req: any) {
    return this.blogService.createBlogTag(name, req.user.id);
  }

  @Delete('tags/:id')
  @UseGuards(AuthGuard)
  async deleteBlogTag(@Param('id') id: string, @Req() req: any) {
    return this.blogService.deleteBlogTag(id, req.user.id);
  }

  @Get('submissions/admin')
  @UseGuards(AuthGuard)
  async getBlogSubmissions(@Query() query: any, @Req() req: any) {
    return this.blogService.getBlogSubmissions(query, req.user.id);
  }

  @Get('submissions/me')
  @UseGuards(AuthGuard)
  async getUserBlogSubmissions(@Req() req: any) {
    return this.blogService.getUserBlogSubmissions(req.user.id);
  }

  @Post('submissions')
  @UseGuards(AuthGuard)
  async createBlogSubmission(@Body() body: any, @Req() req: any) {
    return this.blogService.createBlogSubmission(body, req.user.id);
  }

  @Patch('submissions/:id/approve')
  @UseGuards(AuthGuard)
  async approveBlogSubmission(@Param('id') id: string, @Req() req: any) {
    return this.blogService.approveBlogSubmission(id, req.user.id);
  }

  @Patch('submissions/:id/reject')
  @UseGuards(AuthGuard)
  async rejectBlogSubmission(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    return this.blogService.rejectBlogSubmission(id, reason, req.user.id);
  }

  @Get('post/:slug')
  async getBlogPost(@Param('slug') slug: string, @Query('incrementViews') incrementViews: string) {
    return this.blogService.getBlogPost(slug, incrementViews !== 'false');
  }

  @Get('related/:id')
  async getRelatedPosts(@Param('id') id: string, @Query('category') category: string, @Query('limit') limit: string) {
    return this.blogService.getRelatedPosts(id, category, limit ? parseInt(limit) : 3);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createBlogPost(@Body() body: any, @Req() req: any) {
    return this.blogService.createBlogPost(body, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateBlogPost(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.blogService.updateBlogPost(id, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteBlogPost(@Param('id') id: string, @Req() req: any) {
    return this.blogService.deleteBlogPost(id, req.user.id);
  }

  @Post(':id/tags/:tagId')
  @UseGuards(AuthGuard)
  async addTagToPost(@Param('id') id: string, @Param('tagId') tagId: string, @Req() req: any) {
    return this.blogService.addTagToPost(id, tagId, req.user.id);
  }

  @Delete(':id/tags/:tagId')
  @UseGuards(AuthGuard)
  async removeTagFromPost(@Param('id') id: string, @Param('tagId') tagId: string, @Req() req: any) {
    return this.blogService.removeTagFromPost(id, tagId, req.user.id);
  }
}

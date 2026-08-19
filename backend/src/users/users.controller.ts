import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../forum/types/forum.types';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('forum/members')
  async getForumMembers(
    @Query('limit') limit?: string,
    @Query('onlineOnly') onlineOnly?: string,
  ) {
    return this.usersService.getForumMembers(
      limit ? parseInt(limit) : undefined,
      onlineOnly === 'true',
    );
  }

  @Get('forum/online-count')
  async getOnlineCount() {
    return this.usersService.getOnlineCount();
  }

  @Put('presence/touch')
  @UseGuards(AuthGuard)
  async touchPresence(@Req() req: AuthenticatedRequest) {
    return this.usersService.touchPresence(req.user.id);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAllUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      req.user.id,
    );
  }

  @Get('role/:role')
  @UseGuards(AuthGuard)
  async getUsersByRole(
    @Param('role') role: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.getUsersByRole(
      role,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      req.user.id,
    );
  }

  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserProfile(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updates: UpdateUserProfileDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateUserProfile(id, updates, req.user.id);
  }
}

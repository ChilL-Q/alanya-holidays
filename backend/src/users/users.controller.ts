import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { PaginationDto, LimitQueryDto } from '../common/dto/pagination.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('forum/members')
  async getForumMembers(
    @Query() query?: LimitQueryDto,
    @Query('onlineOnly') onlineOnly?: string,
  ) {
    return this.usersService.getForumMembers(
      query?.limit,
      onlineOnly === 'true',
    );
  }

  @Get('forum/online-count')
  async getOnlineCount() {
    return this.usersService.getOnlineCount();
  }

  @Put('presence/touch')
  @UseGuards(AuthGuard)
  async touchPresence(@CurrentUser() user: AuthUser) {
    return this.usersService.touchPresence(user.id);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getAllUsers(
    @Query() pagination: PaginationDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.usersService.getAllUsers(
      pagination.page ?? 1,
      pagination.limit ?? 20,
      user?.id ?? '',
    );
  }

  @Get('role/:role')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getUsersByRole(
    @Param('role') role: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.usersService.getUsersByRole(
      role,
      pagination.page ?? 1,
      pagination.limit ?? 20,
      user?.id ?? '',
    );
  }

  // Note: no public GET :id — profile reads are admin-only
  // (UsersAdminController) or self-scoped via the guarded PUT below.
  // A public variant previously leaked contact/banking PII via select('*').

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updates: UpdateUserProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateUserProfile(id, updates, user.id);
  }
}

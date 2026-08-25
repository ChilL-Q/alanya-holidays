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
import {
  PaginationDto,
  LimitQueryDto,
  parsePagination,
} from '../common/dto/pagination.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('forum/members')
  async getForumMembers(
    @Query('limit') limitStr?: string,
    @Query('onlineOnly') onlineOnly?: string,
    @Query() query?: LimitQueryDto,
  ) {
    let limit: number | undefined;
    if (query?.limit !== undefined) {
      limit = Number(query.limit);
    } else if (limitStr !== undefined) {
      limit = parseInt(limitStr, 10);
    }
    return this.usersService.getForumMembers(limit, onlineOnly === 'true');
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
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @CurrentUser() user?: AuthUser,
    @Query() pagination?: PaginationDto,
  ) {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
    );
    return this.usersService.getAllUsers(page, limit, user?.id ?? '');
  }

  @Get('role/:role')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getUsersByRole(
    @Param('role') role: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @CurrentUser() user?: AuthUser,
    @Query() pagination?: PaginationDto,
  ) {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
    );
    return this.usersService.getUsersByRole(role, page, limit, user?.id ?? '');
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
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateUserProfile(id, updates, user.id);
  }
}

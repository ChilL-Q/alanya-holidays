import {
  Controller,
  Get,
  Patch,
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

@Controller('users/admin')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Query('role') role?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    if (role) {
      return this.usersService.getUsersByRole(
        role,
        page,
        limit,
        user?.id ?? '',
      );
    }
    return this.usersService.getAllUsers(page, limit, user?.id ?? '');
  }

  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserProfile(id);
  }

  @Patch(':id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updates: UpdateUserProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateUserProfile(id, updates, user.id);
  }
}

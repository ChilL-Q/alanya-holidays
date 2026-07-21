import { Controller, Get, Put, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getAllUsers(@Query('page') page: string, @Query('limit') limit: string, @Req() req: any) {
    return this.usersService.getAllUsers(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, req.user.id);
  }

  @Get('role/:role')
  @UseGuards(AuthGuard)
  async getUsersByRole(@Param('role') role: string, @Query('page') page: string, @Query('limit') limit: string, @Req() req: any) {
    return this.usersService.getUsersByRole(role, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, req.user.id);
  }

  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserProfile(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateUserProfile(@Param('id') id: string, @Body() updates: any, @Req() req: any) {
    return this.usersService.updateUserProfile(id, updates, req.user.id);
  }
}

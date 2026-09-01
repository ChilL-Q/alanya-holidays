import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { BusinessApplicationsService } from './business-applications.service';
import { CreateBusinessApplicationDto } from './dto/create-business-application.dto';
import { AdminBusinessApplicationsQueryDto } from './dto/admin-business-applications-query.dto';
import { RejectBusinessApplicationDto } from './dto/reject-business-application.dto';

@Controller('business-applications')
export class BusinessApplicationsController {
  constructor(private readonly service: BusinessApplicationsService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getMine(@CurrentUser() user: AuthUser) {
    return this.service.getMine(user.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  submit(
    @Body() dto: CreateBusinessApplicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.submit(user.id, dto);
  }

  @Get('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  list(@Query() query: AdminBusinessApplicationsQueryDto) {
    return this.service.list(query);
  }

  @Patch('admin/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.approve(id, user.id);
  }

  @Patch('admin/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: RejectBusinessApplicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(id, user.id, dto.reason);
  }
}

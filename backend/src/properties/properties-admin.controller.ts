import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';

@Controller('properties/admin')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class PropertiesAdminController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async getPropertiesAdmin(
    @Query('status') status?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    return this.propertiesService.getAdminProperties(status, page, limit);
  }

  @Get(':id')
  async getPropertyAdmin(@Param('id') id: string) {
    return this.propertiesService.getProperty(id);
  }

  @Patch(':id/status')
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body() body: UpdatePropertyStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.propertiesService.updatePropertyStatus(
      id,
      body.status,
      body.reason,
      user.id,
    );
  }

  @Delete(':id')
  async deleteProperty(
    @Param('id') id: string,
    @Query('reason') reason: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.propertiesService.deleteProperty(id, reason, user.id);
  }
}

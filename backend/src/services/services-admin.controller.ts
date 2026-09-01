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
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';

@Controller('services/admin')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class ServicesAdminController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get(':id')
  async getServiceAdmin(@Param('id') id: string) {
    return this.servicesService.getService(id);
  }

  @Patch(':id/status')
  async updateServiceStatus(
    @Param('id') id: string,
    @Body() body: UpdateServiceStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.servicesService.updateServiceStatus(
      id,
      body.status,
      body.reason,
      user.id,
    );
  }

  @Delete(':id')
  async deleteService(
    @Param('id') id: string,
    @Query('reason') reason: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.servicesService.deleteService(id, reason || '', user.id);
  }
}

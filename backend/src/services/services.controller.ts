import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { ServiceListResponse } from './types/services.types';
import {
  CreateServiceDto,
  UpdateServiceDto,
  UpdateServiceModelDto,
  UpdateServiceStatusDto,
  SaveServiceDraftDto,
} from './dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AdminServicesQueryDto } from './dto/admin-services-query.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ============================================
  // Services Catalog
  // ============================================

  @Get('types')
  getServiceTypes(): string[] {
    return this.servicesService.getServiceTypes();
  }

  @Get('brands/:type')
  async getServiceBrands(@Param('type') type: string): Promise<string[]> {
    return this.servicesService.getServiceBrands(type);
  }

  @Get('models/:type/:brand')
  async getServiceModels(
    @Param('type') type: string,
    @Param('brand') brand: string,
  ): Promise<Record<string, unknown>[]> {
    return this.servicesService.getServiceModels(type, brand);
  }

  @Get('model/:type/:brand/:model')
  async getServiceModel(
    @Param('type') type: string,
    @Param('brand') brand: string,
    @Param('model') model: string,
  ): Promise<Record<string, unknown>> {
    return this.servicesService.getServiceModel(type, brand, model);
  }

  @Put('models/:id')
  @UseGuards(AuthGuard)
  async updateServiceModel(
    @Param('id') id: string,
    @Body() updates: UpdateServiceModelDto | Record<string, unknown>,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.servicesService.updateServiceModel(id, updates, user.id);
  }

  @Get('by-model/:type/:brand/:model')
  async getServicesByModel(
    @Param('type') type: string,
    @Param('brand') brand: string,
    @Param('model') model: string,
  ): Promise<Record<string, unknown>[]> {
    return this.servicesService.getServicesByModel(type, brand, model);
  }

  // ============================================
  // Services Edits
  // ============================================

  @Post('edits/:serviceId')
  @UseGuards(AuthGuard)
  async requestServiceUpdate(
    @Param('serviceId') serviceId: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    const changes =
      body &&
      typeof body === 'object' &&
      'changes' in body &&
      body.changes &&
      typeof body.changes === 'object'
        ? (body.changes as Record<string, unknown>)
        : body;

    return this.servicesService.requestServiceUpdate(
      serviceId,
      changes,
      user.id,
    );
  }

  @Get('edits/admin/pending')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getPendingServiceEdits(): Promise<Record<string, unknown>[]> {
    return this.servicesService.getPendingServiceEdits();
  }

  @Get('edits/my-pending')
  @UseGuards(AuthGuard)
  async getMyPendingEdits(
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown>[]> {
    return this.servicesService.getMyPendingEdits(user.id);
  }

  @Get('edits/service/:serviceId')
  @UseGuards(AuthGuard)
  async getServiceEditsByService(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown>[]> {
    return this.servicesService.getServiceEditsByService(serviceId, user.id);
  }

  @Get('edits/:editId')
  @UseGuards(AuthGuard)
  async getServiceEdit(
    @Param('editId') editId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.servicesService.getServiceEdit(editId, user.id);
  }

  @Delete('edits/:editId')
  @UseGuards(AuthGuard)
  async deleteServiceEdit(
    @Param('editId') editId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.servicesService.deleteServiceEdit(editId, user.id);
  }

  @Post('edits/:editId/approve')
  @UseGuards(AuthGuard)
  async approveServiceEdit(
    @Param('editId') editId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.servicesService.approveServiceEdit(editId, user.id);
  }

  @Post('edits/:editId/reject')
  @UseGuards(AuthGuard)
  async rejectServiceEdit(
    @Param('editId') editId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.servicesService.rejectServiceEdit(editId, reason, user.id);
  }

  // ============================================
  // Services CRUD
  // ============================================

  @Post()
  @UseGuards(AuthGuard)
  async createService(
    @Body() data: CreateServiceDto | Record<string, unknown>,
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.servicesService.createService(data, user.id);
  }

  @Post('draft')
  @UseGuards(AuthGuard)
  async saveServiceDraft(
    @Body() data: SaveServiceDraftDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ id: string }> {
    return this.servicesService.saveServiceDraft(data, user.id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  async publishServiceDraft(
    @Param('id') id: string,
    @Body() updates: Record<string, unknown>,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.servicesService.publishServiceDraft(id, updates, user.id);
  }

  @Get()
  async getServices(
    @Query('type') type?: string,
    @Query() pagination?: PaginationDto,
  ): Promise<ServiceListResponse> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    return this.servicesService.getServices(type, page, limit);
  }

  @Get('provider/:providerId')
  async getServicesByProvider(
    @Param('providerId') providerId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.servicesService.getServicesByProvider(providerId);
  }

  @Get('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getAdminServices(
    @Query() query: AdminServicesQueryDto,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
    let parsedTypes: string[] | undefined;
    if (query.typesFilter) {
      try {
        parsedTypes = JSON.parse(query.typesFilter) as string[];
      } catch {
        parsedTypes = [query.typesFilter];
      }
    } else if (query.category) {
      parsedTypes = [query.category];
    }
    return this.servicesService.getAdminServices(
      query.statusFilter,
      parsedTypes,
      query.page,
      query.limit ?? 50,
    );
  }

  @Get(':id')
  async getService(@Param('id') id: string): Promise<Record<string, unknown>> {
    return this.servicesService.getService(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateService(
    @Param('id') id: string,
    @Body() updates: UpdateServiceDto | Record<string, unknown>,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.servicesService.updateService(id, updates, user.id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async updateServiceStatus(
    @Param('id') id: string,
    @Body() data: UpdateServiceStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.servicesService.updateServiceStatus(
      id,
      data.status,
      data.reason,
      user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteService(
    @Param('id') id: string,
    @Query('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.servicesService.deleteService(id, reason, user.id);
  }
}

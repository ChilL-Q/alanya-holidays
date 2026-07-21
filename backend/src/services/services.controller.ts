import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ============================================
  // Services Catalog
  // ============================================

  @Get('types')
  getServiceTypes() {
    return this.servicesService.getServiceTypes();
  }

  @Get('brands/:type')
  async getServiceBrands(@Param('type') type: string) {
    return this.servicesService.getServiceBrands(type);
  }

  @Get('models/:type/:brand')
  async getServiceModels(@Param('type') type: string, @Param('brand') brand: string) {
    return this.servicesService.getServiceModels(type, brand);
  }

  @Get('model/:type/:brand/:model')
  async getServiceModel(@Param('type') type: string, @Param('brand') brand: string, @Param('model') model: string) {
    return this.servicesService.getServiceModel(type, brand, model);
  }

  @Put('models/:id')
  @UseGuards(AuthGuard)
  async updateServiceModel(@Param('id') id: string, @Body() updates: any, @Req() req: any) {
    return this.servicesService.updateServiceModel(id, updates, req.user.id);
  }

  @Get('by-model/:type/:brand/:model')
  async getServicesByModel(@Param('type') type: string, @Param('brand') brand: string, @Param('model') model: string) {
    return this.servicesService.getServicesByModel(type, brand, model);
  }

  // ============================================
  // Services Edits
  // ============================================

  @Post('edits/:serviceId')
  @UseGuards(AuthGuard)
  async requestServiceUpdate(@Param('serviceId') serviceId: string, @Body() changes: any, @Req() req: any) {
    return this.servicesService.requestServiceUpdate(serviceId, changes, req.user.id);
  }

  @Get('edits/admin/pending')
  @UseGuards(AuthGuard)
  async getPendingServiceEdits() {
    return this.servicesService.getPendingServiceEdits();
  }

  @Get('edits/my-pending')
  @UseGuards(AuthGuard)
  async getMyPendingEdits(@Req() req: any) {
    return this.servicesService.getMyPendingEdits(req.user.id);
  }

  @Get('edits/service/:serviceId')
  @UseGuards(AuthGuard)
  async getServiceEditsByService(@Param('serviceId') serviceId: string) {
    return this.servicesService.getServiceEditsByService(serviceId);
  }

  @Get('edits/:editId')
  @UseGuards(AuthGuard)
  async getServiceEdit(@Param('editId') editId: string) {
    return this.servicesService.getServiceEdit(editId);
  }

  @Delete('edits/:editId')
  @UseGuards(AuthGuard)
  async deleteServiceEdit(@Param('editId') editId: string, @Req() req: any) {
    return this.servicesService.deleteServiceEdit(editId, req.user.id);
  }

  @Post('edits/:editId/approve')
  @UseGuards(AuthGuard)
  async approveServiceEdit(@Param('editId') editId: string, @Req() req: any) {
    return this.servicesService.approveServiceEdit(editId, req.user.id);
  }

  @Post('edits/:editId/reject')
  @UseGuards(AuthGuard)
  async rejectServiceEdit(@Param('editId') editId: string, @Body('reason') reason: string, @Req() req: any) {
    return this.servicesService.rejectServiceEdit(editId, reason, req.user.id);
  }

  // ============================================
  // Services CRUD (Existing)
  // ============================================

  @Post()
  @UseGuards(AuthGuard)
  async createService(@Body() data: any, @Req() request: any) {
    return this.servicesService.createService(data, request.user.id);
  }

  @Get()
  async getServices(@Query('type') type: string, @Query('page') page: string, @Query('limit') limit: string) {
    return this.servicesService.getServices(type, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get('provider/:providerId')
  async getServicesByProvider(@Param('providerId') providerId: string) {
    return this.servicesService.getServicesByProvider(providerId);
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  async getAdminServices(
    @Query('statusFilter') statusFilter: string, 
    @Query('typesFilter') typesFilter: string,
    @Query('page') page: string, 
    @Query('limit') limit: string
  ) {
    let parsedTypes;
    if (typesFilter) {
      try { parsedTypes = JSON.parse(typesFilter); } catch (e) { parsedTypes = [typesFilter]; }
    }
    return this.servicesService.getAdminServices(statusFilter, parsedTypes, page ? parseInt(page) : 1, limit ? parseInt(limit) : 50);
  }

  @Get(':id')
  async getService(@Param('id') id: string) {
    return this.servicesService.getService(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateService(@Param('id') id: string, @Body() updates: any, @Req() request: any) {
    return this.servicesService.updateService(id, updates, request.user.id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  async updateServiceStatus(@Param('id') id: string, @Body() data: { status: string, reason?: string }, @Req() request: any) {
    return this.servicesService.updateServiceStatus(id, data.status, data.reason, request.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteService(@Param('id') id: string, @Query('reason') reason: string, @Req() request: any) {
    return this.servicesService.deleteService(id, reason, request.user.id);
  }
}

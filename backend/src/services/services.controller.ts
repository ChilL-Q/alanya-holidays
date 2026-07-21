import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

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

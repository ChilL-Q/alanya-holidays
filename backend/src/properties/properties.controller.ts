import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post('by-ids')
  async getPropertiesByIds(@Body('ids') ids: string[]) {
    return this.propertiesService.getPropertiesByIds(ids);
  }

  @Post('available')
  async getAvailableProperties(@Body('checkIn') checkIn: string, @Body('checkOut') checkOut: string) {
    return this.propertiesService.getAvailableProperties(checkIn, checkOut);
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  async getAdminProperties(@Query('statusFilter') statusFilter: string, @Query('page') page: string, @Query('limit') limit: string) {
    return this.propertiesService.getAdminProperties(statusFilter, page ? parseInt(page) : 1, limit ? parseInt(limit) : 50);
  }

  @Get('host/:hostId')
  async getPropertiesByHost(@Param('hostId') hostId: string) {
    return this.propertiesService.getPropertiesByHost(hostId);
  }

  @Get()
  async getProperties(@Query() query: any) {
    // Parse filters back to object if passed as string
    let filters = query.filters;
    if (typeof filters === 'string') {
      try { filters = JSON.parse(filters); } catch (e) {}
    }
    const queryOptions = {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      filters,
      location: query.location,
      allowedIds: query.allowedIds,
      sort: query.sort,
    };
    return this.propertiesService.getProperties(queryOptions);
  }

  @Get(':id')
  async getProperty(@Param('id') id: string) {
    return this.propertiesService.getProperty(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProperty(@Body() data: any, @Req() request: any) {
    return this.propertiesService.createProperty(data, request.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateProperty(@Param('id') id: string, @Body() updates: any, @Req() request: any) {
    return this.propertiesService.updateProperty(id, updates, request.user.id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  async updatePropertyStatus(@Param('id') id: string, @Body() data: { status: string, reason?: string }, @Req() request: any) {
    return this.propertiesService.updatePropertyStatus(id, data.status, data.reason, request.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProperty(@Param('id') id: string, @Query('reason') reason: string, @Req() request: any) {
    return this.propertiesService.deleteProperty(id, reason, request.user.id);
  }
}

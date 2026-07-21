import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ============================================
  // Properties Catalog
  // ============================================
  
  @Get('types')
  async getPropertyTypes() {
    return this.propertiesService.getPropertyTypes();
  }

  @Get('locations/:type')
  async getPropertyLocations(@Param('type') type: string) {
    return this.propertiesService.getPropertyLocations(type);
  }

  @Get('by-location/:type/:location')
  async getPropertiesByLocation(@Param('type') type: string, @Param('location') location: string, @Query('page') page: string, @Query('limit') limit: string) {
    return this.propertiesService.getPropertiesByLocation(type, location, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  // ============================================
  // Properties iCal
  // ============================================

  @Get(':id/ical')
  async getICalFeeds(@Param('id') propertyId: string) {
    return this.propertiesService.getICalFeeds(propertyId);
  }

  @Post(':id/ical')
  @UseGuards(AuthGuard)
  async addICalFeed(@Param('id') propertyId: string, @Body('name') name: string, @Body('url') url: string, @Req() req: any) {
    return this.propertiesService.addICalFeed(propertyId, name, url, req.user.id);
  }

  @Post(':id/ical/sync')
  @UseGuards(AuthGuard)
  async syncPropertyICal(@Param('id') propertyId: string, @Req() req: any) {
    return this.propertiesService.syncPropertyICal(propertyId, req.user.id);
  }

  @Delete('ical/:id')
  @UseGuards(AuthGuard)
  async removeICalFeed(@Param('id') id: string, @Req() req: any) {
    return this.propertiesService.removeICalFeed(id, req.user.id);
  }

  // ============================================
  // Properties Availability
  // ============================================

  @Get(':id/availability')
  async getPropertyAvailability(@Param('id') propertyId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.propertiesService.getPropertyAvailability(propertyId, startDate, endDate);
  }

  @Put(':id/availability')
  @UseGuards(AuthGuard)
  async updatePropertyAvailability(@Param('id') propertyId: string, @Body() data: any, @Req() req: any) {
    return this.propertiesService.updatePropertyAvailability(propertyId, data.dates, data.status, data.price, req.user.id);
  }

  @Post(':id/calendar/sync')
  async syncPropertyCalendar(@Param('id') propertyId: string) {
    return this.propertiesService.syncPropertyCalendar(propertyId);
  }

  @Get(':id/unavailable-dates')
  async getUnavailableDates(@Param('id') propertyId: string) {
    return this.propertiesService.getUnavailableDates(propertyId);
  }

  // ============================================
  // Properties Reviews
  // ============================================

  @Get(':id/reviews')
  async getReviews(@Param('id') propertyId: string, @Query('page') page: string, @Query('limit') limit: string) {
    return this.propertiesService.getReviews(propertyId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
  }

  @Get(':id/reviews/count')
  async getReviewCount(@Param('id') propertyId: string) {
    return this.propertiesService.getReviewCount(propertyId);
  }

  @Post(':id/reviews')
  @UseGuards(AuthGuard)
  async addReview(@Param('id') propertyId: string, @Body() body: any, @Req() req: any) {
    return this.propertiesService.addReview({ ...body, property_id: propertyId }, req.user.id);
  }

  @Delete('reviews/:id')
  @UseGuards(AuthGuard)
  async deleteReview(@Param('id') reviewId: string, @Req() req: any) {
    return this.propertiesService.deleteReview(reviewId, req.user.id);
  }

  @Post('reviews/:id/flag')
  @UseGuards(AuthGuard)
  async flagReview(@Param('id') reviewId: string, @Req() req: any) {
    return this.propertiesService.flagReview(reviewId, req.user.id);
  }

  @Post('reviews/:id/unflag')
  @UseGuards(AuthGuard)
  async unflagReview(@Param('id') reviewId: string, @Req() req: any) {
    return this.propertiesService.unflagReview(reviewId, req.user.id);
  }

  @Get('reviews/admin/flagged')
  @UseGuards(AuthGuard)
  async getFlaggedReviews(@Query('page') page: string, @Query('limit') limit: string, @Req() req: any) {
    return this.propertiesService.getFlaggedReviews(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, req.user.id);
  }

  @Post('reviews/admin/bulk-delete')
  @UseGuards(AuthGuard)
  async bulkDeleteReviews(@Body('reviewIds') reviewIds: string[], @Req() req: any) {
    return this.propertiesService.bulkDeleteReviews(reviewIds, req.user.id);
  }

  // ============================================
  // Properties CRUD (Existing)
  // ============================================

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

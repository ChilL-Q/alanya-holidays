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
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  GetPropertiesQueryDto,
  PropertyFilterDto,
  CreatePropertyDto,
  UpdatePropertyDto,
  UpdateAvailabilityDto,
  CreatePropertyReviewDto,
} from './dto';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { AuthenticatedRequest } from './types/property.types';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ============================================
  // Properties Catalog
  // ============================================

  @Get('types')
  async getPropertyTypes(): Promise<string[]> {
    return this.propertiesService.getPropertyTypes();
  }

  @Get('locations/:type')
  async getPropertyLocations(@Param('type') type: string): Promise<string[]> {
    return this.propertiesService.getPropertyLocations(type);
  }

  @Get('by-location/:type/:location')
  async getPropertiesByLocation(
    @Param('type') type: string,
    @Param('location') location: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
    return this.propertiesService.getPropertiesByLocation(
      type,
      location,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ============================================
  // Properties iCal
  // ============================================

  @Get(':id/ical')
  async getICalFeeds(
    @Param('id') propertyId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.propertiesService.getICalFeeds(propertyId);
  }

  @Post(':id/ical')
  @UseGuards(AuthGuard)
  async addICalFeed(
    @Param('id') propertyId: string,
    @Body('name') name: string,
    @Body('url') url: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Record<string, unknown>> {
    return this.propertiesService.addICalFeed(
      propertyId,
      name,
      url,
      req.user.id,
    );
  }

  @Post(':id/ical/sync')
  @UseGuards(AuthGuard)
  async syncPropertyICal(
    @Param('id') propertyId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.syncPropertyICal(propertyId, req.user.id);
  }

  @Delete('ical/:id')
  @UseGuards(AuthGuard)
  async removeICalFeed(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.removeICalFeed(id, req.user.id);
  }

  // ============================================
  // Properties Availability
  // ============================================

  @Get(':id/availability')
  async getPropertyAvailability(
    @Param('id') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, unknown>[]> {
    return this.propertiesService.getPropertyAvailability(
      propertyId,
      startDate,
      endDate,
    );
  }

  @Put(':id/availability')
  @UseGuards(AuthGuard)
  async updatePropertyAvailability(
    @Param('id') propertyId: string,
    @Body() data: UpdateAvailabilityDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.updatePropertyAvailability(
      propertyId,
      data.dates,
      data.status,
      data.price,
      req.user.id,
    );
  }

  @Post(':id/calendar/sync')
  async syncPropertyCalendar(
    @Param('id') propertyId: string,
  ): Promise<unknown> {
    return this.propertiesService.syncPropertyCalendar(propertyId);
  }

  @Get(':id/unavailable-dates')
  async getUnavailableDates(
    @Param('id') propertyId: string,
  ): Promise<string[]> {
    return this.propertiesService.getUnavailableDates(propertyId);
  }

  // ============================================
  // Properties Reviews
  // ============================================

  @Get(':id/reviews')
  async getReviews(
    @Param('id') propertyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Record<string, unknown>[]; total: number | null }> {
    return this.propertiesService.getReviews(
      propertyId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id/reviews/count')
  async getReviewCount(@Param('id') propertyId: string): Promise<number> {
    return this.propertiesService.getReviewCount(propertyId);
  }

  @Post(':id/reviews')
  @UseGuards(AuthGuard)
  async addReview(
    @Param('id') propertyId: string,
    @Body() body: CreatePropertyReviewDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.addReview(
      { ...body, property_id: propertyId },
      req.user.id,
    );
  }

  @Delete('reviews/:id')
  @UseGuards(AuthGuard)
  async deleteReview(
    @Param('id') reviewId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.deleteReview(reviewId, req.user.id);
  }

  @Post('reviews/:id/flag')
  @UseGuards(AuthGuard)
  async flagReview(
    @Param('id') reviewId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.flagReview(reviewId, req.user.id);
  }

  @Post('reviews/:id/unflag')
  @UseGuards(AuthGuard)
  async unflagReview(
    @Param('id') reviewId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.unflagReview(reviewId, req.user.id);
  }

  @Get('reviews/admin/flagged')
  @UseGuards(AuthGuard)
  async getFlaggedReviews(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Record<string, unknown>[]; total: number | null }> {
    return this.propertiesService.getFlaggedReviews(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      req.user.id,
    );
  }

  @Post('reviews/admin/bulk-delete')
  @UseGuards(AuthGuard)
  async bulkDeleteReviews(
    @Body('reviewIds') reviewIds: string[],
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.bulkDeleteReviews(reviewIds, req.user.id);
  }

  // ============================================
  // Properties CRUD
  // ============================================

  @Post('by-ids')
  async getPropertiesByIds(
    @Body('ids') ids: string[],
  ): Promise<Record<string, unknown>[]> {
    return this.propertiesService.getPropertiesByIds(ids);
  }

  @Post('available')
  async getAvailableProperties(
    @Body('checkIn') checkIn: string,
    @Body('checkOut') checkOut: string,
  ): Promise<Record<string, unknown>[]> {
    return this.propertiesService.getAvailableProperties(checkIn, checkOut);
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  async getAdminProperties(
    @Query('statusFilter') statusFilter?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
    return this.propertiesService.getAdminProperties(
      statusFilter,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('host/:hostId')
  async getPropertiesByHost(
    @Param('hostId') hostId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.propertiesService.getPropertiesByHost(hostId);
  }

  @Get()
  async getProperties(
    @Query() queryDto: GetPropertiesQueryDto,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
    let filters: PropertyFilterDto | undefined;
    if (queryDto.filters) {
      try {
        filters = JSON.parse(queryDto.filters) as PropertyFilterDto;
      } catch {
        throw new BadRequestException('Invalid filters JSON format');
      }
    }
    const queryOptions = {
      page: queryDto.page || 1,
      limit: queryDto.limit || 20,
      filters,
      location: queryDto.location,
      allowedIds: queryDto.allowedIds,
      sort: queryDto.sort,
    };
    return this.propertiesService.getProperties(queryOptions);
  }

  @Get(':id')
  async getProperty(@Param('id') id: string): Promise<Record<string, unknown>> {
    return this.propertiesService.getProperty(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProperty(
    @Body() data: CreatePropertyDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Record<string, unknown>> {
    return this.propertiesService.createProperty(data, request.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateProperty(
    @Param('id') id: string,
    @Body() updates: UpdatePropertyDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.updateProperty(id, updates, request.user.id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body() data: UpdateStatusDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.updatePropertyStatus(
      id,
      data.status,
      data.reason,
      request.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProperty(
    @Param('id') id: string,
    @Query('reason') reason: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.deleteProperty(id, reason, request.user.id);
  }
}

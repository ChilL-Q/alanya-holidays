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
  BadRequestException,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  GetPropertiesQueryDto,
  PropertyFilterDto,
  CreatePropertyDto,
  UpdatePropertyDto,
  UpdateAvailabilityDto,
  CreatePropertyReviewDto,
  UpdatePropertyStatusDto,
  SavePropertyDraftDto,
} from './dto';
import { PaginationDto, parsePagination } from '../common/dto/pagination.dto';

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
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
    );
    return this.propertiesService.getPropertiesByLocation(
      type,
      location,
      page,
      limit,
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
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.propertiesService.addICalFeed(propertyId, name, url, user.id);
  }

  @Post(':id/ical/sync')
  @UseGuards(AuthGuard)
  async syncPropertyICal(
    @Param('id') propertyId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.propertiesService.syncPropertyICal(propertyId, user.id);
  }

  @Delete('ical/:id')
  @UseGuards(AuthGuard)
  async removeICalFeed(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.removeICalFeed(id, user.id);
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
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.updatePropertyAvailability(
      propertyId,
      data.dates,
      data.status,
      data.price,
      user.id,
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
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ): Promise<{ data: Record<string, unknown>[]; total: number | null }> {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
      { limit: 10 },
    );
    return this.propertiesService.getReviews(propertyId, page, limit);
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
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.addReview(
      { ...body, property_id: propertyId },
      user.id,
    );
  }

  @Delete('reviews/:id')
  @UseGuards(AuthGuard)
  async deleteReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.deleteReview(reviewId, user.id);
  }

  @Post('reviews/:id/flag')
  @UseGuards(AuthGuard)
  async flagReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.flagReview(reviewId, user.id);
  }

  @Post('reviews/:id/unflag')
  @UseGuards(AuthGuard)
  async unflagReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.unflagReview(reviewId, user.id);
  }

  @Get('reviews/admin/flagged')
  @UseGuards(AuthGuard)
  async getFlaggedReviews(
    @CurrentUser() user: AuthUser,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ): Promise<{ data: Record<string, unknown>[]; total: number | null }> {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
    );
    return this.propertiesService.getFlaggedReviews(page, limit, user.id);
  }

  @Post('reviews/admin/bulk-delete')
  @UseGuards(AuthGuard)
  async bulkDeleteReviews(
    @Body('reviewIds') reviewIds: string[],
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.bulkDeleteReviews(reviewIds, user.id);
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
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getAdminProperties(
    @Query('statusFilter') statusFilter?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query() pagination?: PaginationDto,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
    const { page, limit } = parsePagination(
      { page: pageStr, limit: limitStr },
      pagination,
      { limit: 50 },
    );
    return this.propertiesService.getAdminProperties(statusFilter, page, limit);
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
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, unknown>> {
    return this.propertiesService.createProperty(data, user.id);
  }

  @Post('draft')
  @UseGuards(AuthGuard)
  async savePropertyDraft(
    @Body() data: SavePropertyDraftDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ id: string }> {
    return this.propertiesService.savePropertyDraft(data, user.id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  async publishPropertyDraft(
    @Param('id') id: string,
    @Body() updates: Partial<CreatePropertyDto>,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.publishPropertyDraft(id, updates, user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateProperty(
    @Param('id') id: string,
    @Body() updates: UpdatePropertyDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.updateProperty(id, updates, user.id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body() data: UpdatePropertyStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.updatePropertyStatus(
      id,
      data.status,
      data.reason,
      user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProperty(
    @Param('id') id: string,
    @Query('reason') reason: string | undefined,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.propertiesService.deleteProperty(id, reason, user.id);
  }
}

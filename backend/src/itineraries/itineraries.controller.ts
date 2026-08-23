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
import { ItinerariesService } from './itineraries.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { LimitQueryDto } from '../common/dto/pagination.dto';

@Controller('itineraries')
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createItinerary(
    @Body() createItineraryDto: CreateItineraryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.itinerariesService.createItinerary(user.id, createItineraryDto);
  }

  @Get(['me', 'my'])
  @UseGuards(AuthGuard)
  async getMyItineraries(@CurrentUser() user: AuthUser) {
    return this.itinerariesService.getMyItineraries(user.id);
  }

  @Get('community')
  async getCommunityItineraries(@Query() query?: LimitQueryDto | string) {
    let limit = 20;
    if (typeof query === 'string') {
      limit = parseInt(query, 10) || 20;
    } else if (query?.limit !== undefined) {
      limit = Number(query.limit) || 20;
    }
    return this.itinerariesService.getCommunityItineraries(limit);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getItineraryById(@Param('id') id: string) {
    return this.itinerariesService.getItineraryById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateItinerary(
    @Param('id') id: string,
    @Body() updateItineraryDto: UpdateItineraryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.itinerariesService.updateItinerary(
      id,
      updateItineraryDto,
      user.id,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async patchItinerary(
    @Param('id') id: string,
    @Body() updateItineraryDto: UpdateItineraryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.itinerariesService.updateItinerary(
      id,
      updateItineraryDto,
      user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteItinerary(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.itinerariesService.deleteItinerary(id, user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ItinerariesService } from './itineraries.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

interface RequestWithUser {
  user: {
    id: string;
    [key: string]: unknown;
  };
}

@Controller('itineraries')
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createItinerary(
    @Body() createItineraryDto: CreateItineraryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.itinerariesService.createItinerary(
      req.user.id,
      createItineraryDto,
    );
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyItineraries(@Req() req: RequestWithUser) {
    return this.itinerariesService.getMyItineraries(req.user.id);
  }

  @Get('community')
  async getCommunityItineraries(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.itinerariesService.getCommunityItineraries(parsedLimit);
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
    @Req() req: RequestWithUser,
  ) {
    return this.itinerariesService.updateItinerary(
      id,
      updateItineraryDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteItinerary(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.itinerariesService.deleteItinerary(id, req.user.id);
  }
}

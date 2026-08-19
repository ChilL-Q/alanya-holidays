import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ItinerariesRepository,
  SavedItineraryRow,
} from './itineraries.repository';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

@Injectable()
export class ItinerariesService {
  constructor(private readonly itinerariesRepository: ItinerariesRepository) {}

  async createItinerary(
    userId: string,
    dto: CreateItineraryDto,
  ): Promise<SavedItineraryRow> {
    return this.itinerariesRepository.createItinerary(userId, dto);
  }

  async getMyItineraries(userId: string): Promise<SavedItineraryRow[]> {
    return this.itinerariesRepository.findByUserId(userId);
  }

  async getCommunityItineraries(limit = 20): Promise<SavedItineraryRow[]> {
    return this.itinerariesRepository.findCommunity(limit);
  }

  async getItineraryById(id: string): Promise<SavedItineraryRow> {
    const itinerary = await this.itinerariesRepository.findById(id);
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`);
    }
    return itinerary;
  }

  async updateItinerary(
    id: string,
    dto: UpdateItineraryDto,
    userId: string,
  ): Promise<SavedItineraryRow> {
    const existing = await this.getItineraryById(id);
    if (existing.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this itinerary',
      );
    }
    return this.itinerariesRepository.updateItinerary(id, dto);
  }

  async deleteItinerary(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.getItineraryById(id);
    if (existing.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this itinerary',
      );
    }
    await this.itinerariesRepository.deleteItinerary(id);
    return { success: true };
  }
}

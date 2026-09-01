import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBusinessApplicationDto } from './dto/create-business-application.dto';
import { AdminBusinessApplicationsQueryDto } from './dto/admin-business-applications-query.dto';
import {
  BusinessApplication,
  BusinessApplicationsPage,
} from './business-applications.types';
import {
  BusinessApplicationsPersistenceException,
  BusinessApplicationsRepository,
} from './business-applications.repository';

@Injectable()
export class BusinessApplicationsService {
  constructor(private readonly repository: BusinessApplicationsRepository) {}

  getMine(userId: string): Promise<BusinessApplication | null> {
    return this.execute(() => this.repository.findMine(userId));
  }

  hasApprovedBusinessAccount(userId: string): Promise<boolean> {
    return this.execute(() =>
      this.repository.hasApprovedBusinessAccount(userId),
    );
  }

  submit(
    userId: string,
    dto: CreateBusinessApplicationDto,
  ): Promise<BusinessApplication> {
    const normalized = this.normalizeCreateDto(dto);
    return this.execute(() => this.repository.create(userId, normalized), true);
  }

  list(
    query: AdminBusinessApplicationsQueryDto,
  ): Promise<BusinessApplicationsPage> {
    return this.execute(() => this.repository.findAll(query.page, query.limit));
  }

  approve(id: string, reviewerId: string): Promise<BusinessApplication> {
    return this.executeReview(() => this.repository.approve(id, reviewerId));
  }

  reject(
    id: string,
    reviewerId: string,
    reason: string,
  ): Promise<BusinessApplication> {
    return this.executeReview(() =>
      this.repository.reject(id, reviewerId, reason),
    );
  }

  private normalizeCreateDto(
    dto: CreateBusinessApplicationDto,
  ): CreateBusinessApplicationDto {
    const optional = (value?: string) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    };

    return {
      accountType: dto.accountType,
      businessName: dto.businessName.trim(),
      contactEmail: dto.contactEmail.trim(),
      contactPhone: optional(dto.contactPhone),
      website: optional(dto.website),
    };
  }

  private async executeReview<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof BusinessApplicationsPersistenceException) {
        if (error.code === 'P0002') {
          throw new NotFoundException(
            'Business account application not found.',
          );
        }
        if (error.code === '23514') {
          throw new ConflictException(
            'Business account application is no longer pending.',
          );
        }
        if (error.code === '23505') {
          throw new ConflictException(
            'A conflicting business account application already exists.',
          );
        }
      }
      throw new InternalServerErrorException(
        'Unable to process the business account application.',
      );
    }
  }

  private async execute<T>(
    operation: () => Promise<T>,
    sanitizeDuplicate = false,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        sanitizeDuplicate &&
        error instanceof BusinessApplicationsPersistenceException &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'A business account application already exists for this account.',
        );
      }
      throw new InternalServerErrorException(
        'Unable to process the business account application.',
      );
    }
  }
}

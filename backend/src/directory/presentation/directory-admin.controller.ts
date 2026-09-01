import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { RequireRole } from '../../auth/decorators/require-role.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthUser } from '../../auth/types/auth-user.interface';
import { DirectoryListingService } from '../application/directory-listing.service';
import { ListingClaimService } from '../application/listing-claim.service';
import { CurateListingScoreDto } from '../dto/curate-listing.dto';
import {
  AdminDirectoryListingsQueryDto,
  AdminDirectoryStatusQueryDto,
  AdminPaginationQueryDto,
} from '../dto/admin-directory-query.dto';
import { ModerationAuditService } from '../../admin/moderation-audit.service';
import { AdminListingWriteDto } from '../dto/admin-listing-write.dto';

@Controller('directory/admin')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class DirectoryAdminController {
  constructor(
    private readonly listingService: DirectoryListingService,
    private readonly claimService: ListingClaimService,
    @Optional()
    private readonly moderationAuditService?: ModerationAuditService,
  ) {}

  async getDirectoryListingsAdmin(
    query: AdminDirectoryListingsQueryDto,
    user: AuthUser,
  ): Promise<unknown>;
  async getDirectoryListingsAdmin(
    status: string | undefined,
    category: string | undefined,
    q: string | undefined,
    query: string | undefined,
    user: AuthUser,
  ): Promise<unknown>;
  @Get('listings')
  async getDirectoryListingsAdmin(
    @Query() queryOrStatus: AdminDirectoryListingsQueryDto | string | undefined,
    @CurrentUser() userOrCategory: AuthUser | string | undefined,
    legacyQ?: string,
    legacyQuery?: string,
    legacyUser?: AuthUser,
  ) {
    const query =
      typeof queryOrStatus === 'object' && queryOrStatus !== null
        ? queryOrStatus
        : {
            status: queryOrStatus,
            category:
              typeof userOrCategory === 'string' ? userOrCategory : undefined,
            q: legacyQ,
            query: legacyQuery,
            page: 1,
            limit: 20,
          };
    const user = legacyUser ?? (userOrCategory as AuthUser);
    return this.listingService.getDirectoryListingsAdmin(
      {
        status: query.status,
        category: query.category,
        query: query.query || query.q,
      },
      user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('status/:status')
  async getDirectoryListingsByStatus(
    @Param('status') status: 'approved' | 'rejected',
    @Query() query: AdminDirectoryStatusQueryDto,
  ) {
    return this.listingService.getDirectoryListingsByStatus(
      status,
      query.category,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('pending')
  async getPendingDirectoryListings(@Query() query: AdminPaginationQueryDto) {
    return this.listingService.getPendingDirectoryListings(
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Post('listings')
  async createDirectoryListing(
    @Body() body: AdminListingWriteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.createAdminDirectoryListing(body, user.id);
  }

  @Patch('listings/:id')
  async updateDirectoryListing(
    @Param('id') id: string,
    @Body() body: AdminListingWriteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.updateAdminDirectoryListing(id, body, user.id);
  }

  @Delete('listings/:id')
  async deleteDirectoryListing(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.deleteDirectoryListing(id, user.id);
  }

  @Post(':id/approve')
  async approveDirectoryListing(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.listingService.approveDirectoryListing(
      id,
      user.id,
    );
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'listing',
        entity_id: id,
        action: 'approve',
        admin_id: user.id,
      });
    }
    return result;
  }

  @Post(':id/reject')
  async rejectDirectoryListing(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.listingService.rejectDirectoryListing(
      id,
      reason,
      user.id,
    );
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'listing',
        entity_id: id,
        action: 'reject',
        admin_id: user.id,
        reason,
      });
    }
    return result;
  }

  async getListingClaims(user: AuthUser): Promise<unknown>;
  async getListingClaims(
    query: AdminPaginationQueryDto,
    user: AuthUser,
  ): Promise<unknown>;
  @Get('claims')
  async getListingClaims(
    @Query() queryOrUser: AdminPaginationQueryDto | AuthUser,
    @CurrentUser() currentUser?: AuthUser,
  ) {
    const legacyCall = currentUser === undefined;
    const user = legacyCall ? (queryOrUser as AuthUser) : currentUser;
    const query = legacyCall
      ? undefined
      : (queryOrUser as AdminPaginationQueryDto);
    return this.claimService.getListingClaims(
      user.id,
      query?.page ?? 1,
      query?.limit ?? 20,
    );
  }

  @Post('claims/:id/approve')
  async approveListingClaim(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.claimService.approveListingClaim(id, user.id);
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'claim',
        entity_id: id,
        action: 'approve',
        admin_id: user.id,
      });
    }
    return result;
  }

  @Post('claims/:id/reject')
  async rejectListingClaim(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.claimService.rejectListingClaim(
      id,
      reason,
      user.id,
    );
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'claim',
        entity_id: id,
        action: 'reject',
        admin_id: user.id,
        reason,
      });
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Administrative Curation Controls (Task 2.2)
  // ---------------------------------------------------------------------------
  @Post(':id/feature')
  async featureListing(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.listingService.featureListing(id, user.id);
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'listing',
        entity_id: id,
        action: 'feature',
        admin_id: user.id,
      });
    }
    return result;
  }

  @Post(':id/unfeature')
  async unfeatureListing(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.listingService.unfeatureListing(id, user.id);
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'listing',
        entity_id: id,
        action: 'unfeature',
        admin_id: user.id,
      });
    }
    return result;
  }

  @Post(':id/verify')
  async verifyListing(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.listingService.verifyListing(id, user.id);
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'listing',
        entity_id: id,
        action: 'verify',
        admin_id: user.id,
      });
    }
    return result;
  }

  @Post(':id/unverify')
  async unverifyListing(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.listingService.unverifyListing(id, user.id);
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'listing',
        entity_id: id,
        action: 'unverify',
        admin_id: user.id,
      });
    }
    return result;
  }

  @Post(':id/score')
  async updateListingScore(
    @Param('id') id: string,
    @Body() dto: CurateListingScoreDto,
    @CurrentUser() user: AuthUser,
  ) {
    const rawScore = dto.score ?? dto.base_score;
    if (
      rawScore === undefined ||
      rawScore === null ||
      isNaN(rawScore) ||
      rawScore < 0 ||
      rawScore > 100
    ) {
      throw new BadRequestException('Score must be a number between 0 and 100');
    }
    const result = await this.listingService.setListingScore(
      id,
      rawScore,
      user.id,
    );
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'listing',
        entity_id: id,
        action: 'update_score',
        admin_id: user.id,
        metadata: { score: rawScore },
      });
    }
    return result;
  }
}

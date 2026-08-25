import {
  Controller,
  Get,
  Post,
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
import { ModerationAuditService } from '../../admin/moderation-audit.service';

@Controller('directory')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class DirectoryAdminController {
  constructor(
    private readonly listingService: DirectoryListingService,
    private readonly claimService: ListingClaimService,
    @Optional()
    private readonly moderationAuditService?: ModerationAuditService,
  ) {}

  @Get('admin/listings')
  async getDirectoryListingsAdmin(
    @Query('status') status: string | undefined,
    @Query('category') category: string | undefined,
    @Query('q') q: string | undefined,
    @Query('query') query: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    const searchQuery = query || q;
    return this.listingService.getDirectoryListingsAdmin(
      { status, category, query: searchQuery },
      user.id,
    );
  }

  @Get('admin/status/:status')
  async getDirectoryListingsByStatus(
    @Param('status') status: 'approved' | 'rejected',
    @Query('category') category?: string,
  ) {
    return this.listingService.getDirectoryListingsByStatus(status, category);
  }

  @Get('admin/pending')
  async getPendingDirectoryListings() {
    return this.listingService.getPendingDirectoryListings();
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

  @Get('claims')
  async getListingClaims(@CurrentUser() user: AuthUser) {
    return this.claimService.getListingClaims(user.id);
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

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { RequireRole } from '../../auth/decorators/require-role.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthUser } from '../../auth/types/auth-user.interface';
import { DirectoryListingService } from '../application/directory-listing.service';
import { ListingClaimService } from '../application/listing-claim.service';
import { DirectoryService } from '../directory.service';

@Controller('directory')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class DirectoryAdminController {
  private readonly listingService!: DirectoryListingService;
  private readonly claimService!: ListingClaimService;

  constructor(
    @Optional() directoryListingService?: DirectoryListingService,
    @Optional() listingClaimService?: ListingClaimService,
    @Optional() directoryService?: DirectoryService,
  ) {
    if (directoryListingService) {
      this.listingService = directoryListingService;
    } else if (directoryService) {
      const facade = directoryService as unknown as {
        listingService: DirectoryListingService;
      };
      this.listingService = facade.listingService;
    }
    if (listingClaimService) {
      this.claimService = listingClaimService;
    } else if (directoryService) {
      const facade = directoryService as unknown as {
        claimService: ListingClaimService;
      };
      this.claimService = facade.claimService;
    }
  }

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
    return this.listingService.approveDirectoryListing(id, user.id);
  }

  @Post(':id/reject')
  async rejectDirectoryListing(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listingService.rejectDirectoryListing(id, reason, user.id);
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
    return this.claimService.approveListingClaim(id, user.id);
  }

  @Post('claims/:id/reject')
  async rejectListingClaim(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimService.rejectListingClaim(id, reason, user.id);
  }
}

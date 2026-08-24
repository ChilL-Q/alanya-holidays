import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';
import { DirectoryController } from './directory.controller';
import { DirectoryAdminController } from './presentation/directory-admin.controller';
import { DirectoryService } from './directory.service';
import { DirectoryListingService } from './application/directory-listing.service';
import { ListingClaimService } from './application/listing-claim.service';
import { DirectoryRepository } from './directory.repository';
import { EmailOutboxRepository } from '../bookings/email-outbox.repository';

@Module({
  imports: [AuthModule, AdminModule],
  controllers: [DirectoryAdminController, DirectoryController],
  providers: [
    DirectoryListingService,
    ListingClaimService,
    DirectoryService,
    DirectoryRepository,
    EmailOutboxRepository,
  ],
  exports: [DirectoryListingService, ListingClaimService, DirectoryService],
})
export class DirectoryModule {}

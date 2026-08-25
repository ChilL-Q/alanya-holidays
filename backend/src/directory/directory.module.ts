import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { DirectoryController } from './directory.controller';
import { DirectoryAdminController } from './presentation/directory-admin.controller';
import { DirectoryListingService } from './application/directory-listing.service';
import { ListingClaimService } from './application/listing-claim.service';
import { DirectoryRepository } from './directory.repository';
import { EmailOutboxRepository } from '../bookings/email-outbox.repository';

@Module({
  imports: [AuthModule, AdminModule, WebhooksModule],
  controllers: [DirectoryAdminController, DirectoryController],
  providers: [
    DirectoryListingService,
    ListingClaimService,
    DirectoryRepository,
    EmailOutboxRepository,
  ],
  exports: [DirectoryListingService, ListingClaimService],
})
export class DirectoryModule {}

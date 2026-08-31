import { IsEnum, IsOptional } from 'class-validator';
import { SaveListingDraftDto } from './save-listing-draft.dto';

export class AdminListingWriteDto extends SaveListingDraftDto {
  @IsOptional()
  @IsEnum(['draft', 'pending', 'approved', 'rejected'])
  status?: 'draft' | 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsEnum(['admin', 'merchant', 'import'])
  creation_source?: 'admin' | 'merchant' | 'import';
}

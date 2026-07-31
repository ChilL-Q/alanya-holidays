import { IsString, IsUUID, IsOptional } from 'class-validator';

/**
 * Body DTO for POST /directory/claims (public, authenticated). Mirrors exactly
 * the fields `DirectoryService.submitListingClaim` reads off the body. Fields
 * the service sets server-side (`user_id` from the JWT, `status: 'pending'`)
 * are intentionally NOT here — the client cannot supply them.
 *
 * Required fields match the `.trim()` (non-optional) reads in the service;
 * optional fields match its `?.trim()` reads.
 */
export class SubmitClaimDto {
  @IsUUID()
  listing_id!: string;

  @IsString()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  role!: string;

  @IsString()
  business_name!: string;

  @IsString()
  contact_phone!: string;

  @IsOptional()
  @IsString()
  additional_notes?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

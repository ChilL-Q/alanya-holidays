import { IsOptional, IsString } from 'class-validator';

export class AssignEnquiryDto {
  @IsOptional()
  @IsString()
  assigned_to?: string | null;
}

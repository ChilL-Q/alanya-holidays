import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import {
  BUSINESS_APPLICATION_ACCOUNT_TYPES,
  BusinessApplicationAccountType,
} from '../business-applications.types';

const trimRequiredString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export class CreateBusinessApplicationDto {
  @IsIn(BUSINESS_APPLICATION_ACCOUNT_TYPES)
  accountType!: BusinessApplicationAccountType;

  @Transform(trimRequiredString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;

  @Transform(trimRequiredString)
  @IsEmail()
  @MaxLength(254)
  contactEmail!: string;

  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  contactPhone?: string;

  @Transform(trimOptionalString)
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  website?: string;
}

import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEnquiryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  email!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^\+?[0-9()\-\s]{7,50}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  enquiry_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  service_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dates?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  party_size?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferred_contact?: string;
}

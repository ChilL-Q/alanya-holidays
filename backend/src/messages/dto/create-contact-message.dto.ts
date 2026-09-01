import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateContactMessageDto {
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

  @IsString()
  @IsOptional()
  @MaxLength(500)
  subject?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  visa_type?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^\+?[0-9()\-\s]{7,50}$/)
  phone?: string;
}

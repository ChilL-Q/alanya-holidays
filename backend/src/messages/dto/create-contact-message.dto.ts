import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

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

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;
}

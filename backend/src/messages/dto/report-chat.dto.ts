import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReportChatDto {
  @IsUUID()
  @IsNotEmpty()
  reportedId!: string;

  @IsUUID()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  reason!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  @IsNotEmpty()
  recipientId!: string;

  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  initialMessage?: string;
}

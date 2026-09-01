import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsIn(['user', 'model'])
  role!: 'user' | 'model';

  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class AiGuideDto {
  @IsOptional()
  @IsString()
  propertyName?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsString()
  @IsNotEmpty()
  userQuestion!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];

  @IsOptional()
  @IsIn(['chat', 'structured'])
  mode?: 'chat' | 'structured';
}

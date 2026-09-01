import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

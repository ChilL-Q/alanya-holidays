import { IsString, IsNotEmpty } from 'class-validator';

export class AddICalFeedDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;
}

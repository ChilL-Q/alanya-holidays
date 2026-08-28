import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBlogTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;
}

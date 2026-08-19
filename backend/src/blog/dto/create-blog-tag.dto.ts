import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBlogTagDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

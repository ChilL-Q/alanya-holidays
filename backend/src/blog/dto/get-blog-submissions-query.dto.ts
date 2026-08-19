import { IsOptional, IsString } from 'class-validator';

export class GetBlogSubmissionsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

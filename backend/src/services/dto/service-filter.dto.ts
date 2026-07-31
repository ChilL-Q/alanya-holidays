import { IsOptional, IsArray, IsString } from 'class-validator';

export class ServiceFilterDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];
}

import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateServiceModelDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;

  [key: string]: unknown;
}

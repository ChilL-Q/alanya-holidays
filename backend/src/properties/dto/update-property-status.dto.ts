import { IsString, IsOptional } from 'class-validator';

export class UpdatePropertyStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

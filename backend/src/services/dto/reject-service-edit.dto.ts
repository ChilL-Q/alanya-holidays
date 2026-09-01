import { IsOptional, IsString } from 'class-validator';

export class RejectServiceEditDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

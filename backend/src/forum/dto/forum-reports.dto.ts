import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateForumReportDto {
  @IsIn(['post', 'comment'])
  target_type: 'post' | 'comment';

  @IsString()
  @IsNotEmpty()
  target_id: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class GetForumReportsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeResolved?: boolean;
}

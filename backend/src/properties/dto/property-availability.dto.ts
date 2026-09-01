import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateAvailabilityDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  dates!: string[];

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

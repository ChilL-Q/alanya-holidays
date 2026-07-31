import {
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  item_id!: string;

  @IsUUID()
  user_id!: string;

  @IsDateString()
  check_in!: string;

  @IsDateString()
  check_out!: string;

  @IsNumber()
  @Min(0)
  total_price!: number;

  @IsInt()
  @Min(1)
  guests!: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsIn(['property', 'service'])
  item_type?: string;
}

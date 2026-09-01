import { IsNumber, Min, Max, IsString, IsNotEmpty } from 'class-validator';

export class SubmitReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsNotEmpty()
  comment!: string;
}

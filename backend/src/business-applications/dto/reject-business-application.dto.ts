import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectBusinessApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}

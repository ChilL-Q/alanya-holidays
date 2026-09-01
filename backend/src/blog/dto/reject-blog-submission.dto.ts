import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectBlogSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 chars' })
  @MaxLength(1000)
  reason!: string;
}

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectBlogSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 chars' })
  reason!: string;
}

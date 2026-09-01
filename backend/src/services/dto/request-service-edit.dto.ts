import { IsNotEmpty, IsObject } from 'class-validator';

export class RequestServiceEditDto {
  @IsObject()
  @IsNotEmpty()
  changes!: Record<string, unknown>;

  [key: string]: unknown;
}

import { IsIn } from 'class-validator';

export class CreateSubscriptionCheckoutDto {
  @IsIn(['monthly', 'annual'])
  plan!: 'monthly' | 'annual';
}

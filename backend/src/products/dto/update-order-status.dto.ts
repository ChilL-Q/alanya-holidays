import { IsIn } from 'class-validator';

export const SELLER_ORDER_STATUSES = [
  'paid',
  'shipped',
  'completed',
  'cancelled',
] as const;

export type SellerOrderStatus = (typeof SELLER_ORDER_STATUSES)[number];

export class UpdateOrderStatusDto {
  @IsIn(SELLER_ORDER_STATUSES)
  status!: SellerOrderStatus;
}

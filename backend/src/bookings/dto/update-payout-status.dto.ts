import { IsIn } from 'class-validator';

/**
 * Allowed values mirror the DB enum `public.payout_status`.
 */
export const PAYOUT_STATUSES = [
  'pending',
  'processing',
  'paid',
  'failed',
  'hold',
] as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

/**
 * Allowed transitions of the payout lifecycle. `paid` is terminal;
 * everything else can be re-driven through processing/hold/failed.
 */
export const PAYOUT_STATUS_TRANSITIONS: Record<
  PayoutStatus,
  readonly PayoutStatus[]
> = {
  pending: ['processing', 'paid', 'failed', 'hold'],
  processing: ['paid', 'failed', 'hold'],
  failed: ['pending', 'processing', 'hold'],
  hold: ['paid', 'pending', 'processing'],
  paid: [],
};

export class UpdatePayoutStatusDto {
  @IsIn(PAYOUT_STATUSES)
  payoutStatus!: string;
}

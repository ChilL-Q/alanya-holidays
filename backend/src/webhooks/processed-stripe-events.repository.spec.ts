import { Test, TestingModule } from '@nestjs/testing';
import { ProcessedStripeEventsRepository } from './processed-stripe-events.repository';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Adversarial idempotency tests for Stripe webhook event claiming (audit 2.3):
 * processed events must be persisted in the DB so duplicates are detected
 * across restarts and multiple instances.
 */
describe('ProcessedStripeEventsRepository', () => {
  let repository: ProcessedStripeEventsRepository;
  let mockSupabaseClient: { rpc: jest.Mock };

  beforeEach(async () => {
    mockSupabaseClient = { rpc: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessedStripeEventsRepository,
        {
          provide: SupabaseService,
          useValue: { getClient: () => mockSupabaseClient },
        },
      ],
    }).compile();

    repository = module.get<ProcessedStripeEventsRepository>(
      ProcessedStripeEventsRepository,
    );
  });

  it('should claim an unseen event via the claim_stripe_event RPC and return true', async () => {
    mockSupabaseClient.rpc.mockResolvedValueOnce({ data: true, error: null });

    const isFirstTime = await repository.tryClaimEvent('evt_123');

    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('claim_stripe_event', {
      p_event_id: 'evt_123',
    });
    expect(isFirstTime).toBe(true);
  });

  it('should return false for an already-claimed (duplicate) event', async () => {
    mockSupabaseClient.rpc.mockResolvedValueOnce({ data: false, error: null });

    const isFirstTime = await repository.tryClaimEvent('evt_duplicate');

    expect(isFirstTime).toBe(false);
  });

  it('should throw when the DB claim fails (fail-closed: do not process unverified events)', async () => {
    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'connection refused' },
    });

    await expect(repository.tryClaimEvent('evt_err')).rejects.toThrow(
      'connection refused',
    );
  });
});

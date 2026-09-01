import { Test, TestingModule } from '@nestjs/testing';
import { EmailOutboxRepository } from './email-outbox.repository';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Adversarial tests for the persistent email outbox (audit 2.4):
 * emails must be durably enqueued in the DB (same transaction as the
 * business operation via RPC) instead of fire-and-forget edge function calls
 * that silently lose mail on restart.
 */
describe('EmailOutboxRepository', () => {
  let repository: EmailOutboxRepository;
  let mockSupabaseClient: { rpc: jest.Mock };

  const payload = {
    type: 'booking_confirmed',
    userId: '12345678-1234-1234-1234-123456789abc',
    data: { itemTitle: 'Villa', checkIn: '2026-09-01', checkOut: '2026-09-05' },
  };

  beforeEach(async () => {
    mockSupabaseClient = { rpc: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailOutboxRepository,
        {
          provide: SupabaseService,
          useValue: { getClient: () => mockSupabaseClient },
        },
      ],
    }).compile();

    repository = module.get<EmailOutboxRepository>(EmailOutboxRepository);
  });

  it('should enqueue an email through the enqueue_email RPC', async () => {
    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: { id: 11 },
      error: null,
    });

    await repository.enqueue(payload);

    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('enqueue_email', {
      p_payload: payload,
    });
  });

  it('should throw when enqueueing fails so callers know mail was not persisted', async () => {
    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'outbox insert failed' },
    });

    await expect(repository.enqueue(payload)).rejects.toThrow(
      'outbox insert failed',
    );
  });
});

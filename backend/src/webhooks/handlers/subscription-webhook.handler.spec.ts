import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionWebhookHandler } from './subscription-webhook.handler';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationsService } from '../../notifications/notifications.service';
import Stripe from 'stripe';

describe('SubscriptionWebhookHandler', () => {
  let handler: SubscriptionWebhookHandler;
  let notificationsService: { notifyUser: jest.Mock; notifyAdmins: jest.Mock };

  interface MockQueryResult {
    data: unknown;
    error: unknown;
  }

  interface TableMock {
    select: jest.Mock;
    insert: jest.Mock;
    upsert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    eq: jest.Mock;
    in: jest.Mock;
    limit: jest.Mock;
    maybeSingle: jest.Mock;
    then: (
      resolve?: ((value: MockQueryResult) => unknown) | null,
      reject?: ((reason: unknown) => unknown) | null,
    ) => Promise<unknown>;
  }

  let tableMocks: Record<string, TableMock>;
  let mockSupabaseClient: { from: jest.Mock };

  const createTableMock = (): TableMock => {
    const mock = {} as TableMock;
    mock.select = jest.fn().mockReturnValue(mock);
    mock.insert = jest.fn().mockResolvedValue({ data: null, error: null });
    mock.upsert = jest.fn().mockResolvedValue({ data: null, error: null });
    mock.update = jest.fn().mockReturnValue(mock);
    mock.delete = jest.fn().mockReturnValue(mock);
    mock.eq = jest.fn().mockReturnValue(mock);
    mock.in = jest.fn().mockReturnValue(mock);
    mock.limit = jest.fn().mockReturnValue(mock);
    mock.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mock.then = (resolve, reject) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject);
    return mock;
  };

  beforeEach(async () => {
    notificationsService = {
      notifyUser: jest.fn().mockResolvedValue({ id: 'n-1' }),
      notifyAdmins: jest.fn().mockResolvedValue([]),
    };

    tableMocks = {
      premium_subscriptions: createTableMock(),
    };

    mockSupabaseClient = {
      from: jest.fn().mockImplementation((table: string): TableMock => {
        if (!(table in tableMocks)) {
          tableMocks[table] = createTableMock();
        }
        return tableMocks[table];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionWebhookHandler,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => mockSupabaseClient,
          },
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    handler = module.get<SubscriptionWebhookHandler>(
      SubscriptionWebhookHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleCreated', () => {
    it('should default plan to monthly when metadata omits it (manual activation)', async () => {
      const sub = {
        id: 'sub_1',
        metadata: { userId: 'u1' },
      } as unknown as Stripe.Subscription;

      await handler.handleCreated(sub);

      expect(tableMocks.premium_subscriptions.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'u1', plan: 'monthly' }),
        { onConflict: 'user_id' },
      );
    });

    it('should ignore subscription when userId is missing and email cannot resolve', async () => {
      const sub = {
        id: 'sub_no_user',
        metadata: { plan: 'monthly' },
      } as unknown as Stripe.Subscription;

      await handler.handleCreated(sub);

      expect(tableMocks.premium_subscriptions.upsert).not.toHaveBeenCalled();
    });

    it('should resolve userId by customer email when metadata is absent', async () => {
      const sub = {
        id: 'sub_email_resolve',
        customer_email: 'owner@example.com',
        metadata: { plan: 'monthly' },
      } as unknown as Stripe.Subscription;

      const profilesEq = jest.fn().mockResolvedValue({
        data: { id: 'resolved-user-1' },
        error: null,
      });
      tableMocks.profiles = createTableMock();
      tableMocks.profiles.select = jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({ maybeSingle: profilesEq }),
      });

      await handler.handleCreated(sub);

      expect(tableMocks.premium_subscriptions.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'resolved-user-1' }),
        { onConflict: 'user_id' },
      );
    });

    it('should skip duplicate subscription when already exists (idempotency)', async () => {
      const sub = {
        id: 'sub_dup',
        metadata: { userId: 'u1', plan: 'pro' },
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'sub-existing' },
        error: null,
      });

      await handler.handleCreated(sub);

      expect(tableMocks.premium_subscriptions.upsert).not.toHaveBeenCalled();
    });

    it('should insert active premium subscription with tier and notify user', async () => {
      const sub = {
        id: 'sub_active_1',
        customer: 'cus_1',
        status: 'active',
        current_period_end: 1800000000,
        cancel_at_period_end: false,
        metadata: {
          userId: 'u_active',
          plan: 'monthly',
          tier: 'voyager',
        },
      } as unknown as Stripe.Subscription;

      await handler.handleCreated(sub);

      expect(tableMocks.premium_subscriptions.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u_active',
          plan: 'monthly',
          tier: 'voyager',
          status: 'active',
          stripe_subscription_id: 'sub_active_1',
          stripe_customer_id: 'cus_1',
          cancel_at_period_end: false,
        }),
        { onConflict: 'user_id' },
      );

      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'u_active',
        expect.objectContaining({
          title: '🎉 Welcome to Premium!',
          type: 'success',
        }),
      );
    });

    it('should safely extract customer ID when customer is provided as an object', async () => {
      const sub = {
        id: 'sub_obj_1',
        customer: { id: 'cus_from_sub_obj' },
        status: 'active',
        current_period_end: 1800000000,
        cancel_at_period_end: false,
        metadata: {
          userId: 'u_obj_cust',
          plan: 'monthly',
        },
      } as unknown as Stripe.Subscription;

      await handler.handleCreated(sub);

      expect(tableMocks.premium_subscriptions.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u_obj_cust',
          stripe_customer_id: 'cus_from_sub_obj',
        }),
        { onConflict: 'user_id' },
      );
    });

    it('should set status to trialing if subscription is trialing or trial_end in future', async () => {
      const futureTrialEnd = Math.floor(Date.now() / 1000) + 7 * 86400;
      const sub = {
        id: 'sub_trial_1',
        customer: 'cus_trial',
        status: 'trialing',
        trial_end: futureTrialEnd,
        metadata: {
          userId: 'u_trial',
          plan: 'annual',
        },
      } as unknown as Stripe.Subscription;

      await handler.handleCreated(sub);

      expect(tableMocks.premium_subscriptions.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'trialing',
        }),
        { onConflict: 'user_id' },
      );
    });

    it('should throw error if insert fails', async () => {
      const sub = {
        id: 'sub_err',
        customer: 'cus_err',
        metadata: { userId: 'u_err', plan: 'pro' },
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.upsert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      await expect(handler.handleCreated(sub)).rejects.toThrow(
        'Failed to upsert premium_subscription: Insert failed',
      );
    });
  });

  describe('handleUpdated', () => {
    it('should return early if subscription record not found', async () => {
      const sub = {
        id: 'sub_not_found',
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await handler.handleUpdated(sub);

      expect(tableMocks.premium_subscriptions.update).not.toHaveBeenCalled();
    });

    it('should update subscription status to past_due', async () => {
      const sub = {
        id: 'sub_upd_1',
        status: 'past_due',
        cancel_at_period_end: false,
        current_period_end: 1800000000,
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'rec_1',
          user_id: 'u1',
          status: 'active',
          cancel_at_period_end: false,
        },
        error: null,
      });

      await handler.handleUpdated(sub);

      expect(tableMocks.premium_subscriptions.update).toHaveBeenCalledWith({
        status: 'past_due',
        current_period_end: new Date(1800000000 * 1000).toISOString(),
        cancel_at_period_end: false,
      });
    });

    it('should notify user when subscription is restored from past_due to active', async () => {
      const sub = {
        id: 'sub_restored',
        status: 'active',
        cancel_at_period_end: false,
        current_period_end: 1800000000,
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'rec_restored',
          user_id: 'u_restored',
          status: 'past_due',
          cancel_at_period_end: false,
        },
        error: null,
      });

      await handler.handleUpdated(sub);

      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'u_restored',
        expect.objectContaining({
          title: 'Subscription Restored',
          type: 'success',
        }),
      );
    });

    it('should notify user when subscription cancellation is scheduled', async () => {
      const sub = {
        id: 'sub_cancel_sched',
        status: 'active',
        cancel_at_period_end: true,
        current_period_end: 1800000000,
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'rec_sched',
          user_id: 'u_sched',
          status: 'active',
          cancel_at_period_end: false,
        },
        error: null,
      });

      await handler.handleUpdated(sub);

      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'u_sched',
        expect.objectContaining({
          title: 'Subscription Cancellation Scheduled',
          type: 'warning',
        }),
      );
    });

    it('should throw error if update fails', async () => {
      const sub = {
        id: 'sub_upd_err',
        status: 'active',
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rec_err', user_id: 'u1' },
        error: null,
      });

      tableMocks.premium_subscriptions.then = (resolve, reject) =>
        Promise.resolve({
          data: null,
          error: { message: 'Update failed' },
        }).then(resolve, reject);

      await expect(handler.handleUpdated(sub)).rejects.toThrow(
        'Failed updating subscription: Update failed',
      );
    });
  });

  describe('handleDeleted', () => {
    it('should mark subscription as cancelled and notify user', async () => {
      const sub = {
        id: 'sub_del_1',
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rec_del', user_id: 'u_del' },
        error: null,
      });

      await handler.handleDeleted(sub);

      expect(tableMocks.premium_subscriptions.update).toHaveBeenCalledWith({
        status: 'cancelled',
      });
      expect(tableMocks.premium_subscriptions.eq).toHaveBeenCalledWith(
        'id',
        'rec_del',
      );

      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'u_del',
        expect.objectContaining({
          title: 'Subscription Cancelled',
          type: 'info',
        }),
      );
    });

    it('should throw error when cancel update fails', async () => {
      const sub = {
        id: 'sub_del_err',
      } as unknown as Stripe.Subscription;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rec_del_err', user_id: 'u_del' },
        error: null,
      });

      tableMocks.premium_subscriptions.then = (resolve, reject) =>
        Promise.resolve({
          data: null,
          error: { message: 'Delete error' },
        }).then(resolve, reject);

      await expect(handler.handleDeleted(sub)).rejects.toThrow(
        'Failed updating cancelled subscription: Delete error',
      );
    });
  });

  describe('handleInvoicePaymentFailed', () => {
    it('should mark active subscription as past_due and notify user', async () => {
      const invoice = {
        customer: 'cus_failed_1',
      } as unknown as Stripe.Invoice;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rec_inv_fail', user_id: 'u_inv_fail' },
        error: null,
      });

      await handler.handleInvoicePaymentFailed(invoice);

      expect(tableMocks.premium_subscriptions.update).toHaveBeenCalledWith({
        status: 'past_due',
      });

      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'u_inv_fail',
        expect.objectContaining({
          title: '⚠️ Payment Failed',
          type: 'error',
        }),
      );
    });

    it('should handle invoice.customer provided as an object', async () => {
      const invoice = {
        id: 'in_obj_1',
        customer: { id: 'cus_from_obj' },
      } as unknown as Stripe.Invoice;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rec_inv_obj', user_id: 'u_obj' },
        error: null,
      });

      await handler.handleInvoicePaymentFailed(invoice);

      expect(tableMocks.premium_subscriptions.eq).toHaveBeenCalledWith(
        'stripe_customer_id',
        'cus_from_obj',
      );
      expect(tableMocks.premium_subscriptions.update).toHaveBeenCalledWith({
        status: 'past_due',
      });
    });

    it('should return early if invoice.customer is missing', async () => {
      const invoice = {
        id: 'in_no_cus',
        customer: null,
      } as unknown as Stripe.Invoice;

      await handler.handleInvoicePaymentFailed(invoice);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return early if no active subscription found for customer', async () => {
      const invoice = {
        customer: 'cus_none',
      } as unknown as Stripe.Invoice;

      tableMocks.premium_subscriptions.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await handler.handleInvoicePaymentFailed(invoice);

      expect(tableMocks.premium_subscriptions.update).not.toHaveBeenCalled();
    });
  });
});

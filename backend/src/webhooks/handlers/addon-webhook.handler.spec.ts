import { Test, TestingModule } from '@nestjs/testing';
import { AddonWebhookHandler } from './addon-webhook.handler';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RedisService } from '../../common/redis/redis.service';
import Stripe from 'stripe';

describe('AddonWebhookHandler', () => {
  let handler: AddonWebhookHandler;
  let notificationsService: { notifyUser: jest.Mock; notifyAdmins: jest.Mock };
  let redisService: { delByPattern: jest.Mock };

  interface MockQueryResult {
    data: unknown;
    error: unknown;
  }

  interface TableMock {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    eq: jest.Mock;
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
    mock.update = jest.fn().mockReturnValue(mock);
    mock.delete = jest.fn().mockReturnValue(mock);
    mock.eq = jest.fn().mockReturnValue(mock);
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
    redisService = {
      delByPattern: jest.fn().mockResolvedValue(undefined),
    };
    tableMocks = {
      listing_addons: createTableMock(),
      directory_listings: createTableMock(),
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
        AddonWebhookHandler,
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
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    handler = module.get<AddonWebhookHandler>(AddonWebhookHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should ignore session if required metadata is missing', async () => {
    const session = {
      id: 'cs_missing_meta',
      metadata: {
        listingId: 'list-1',
        // missing addonType and userId
      },
    } as unknown as Stripe.Checkout.Session;

    await handler.handleCheckoutSession(session);

    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should ignore session if payment_status is not paid', async () => {
    const session = {
      id: 'cs_unpaid_addon',
      payment_status: 'unpaid',
      metadata: {
        userId: 'host-1',
        listingId: 'list-1',
        addonType: 'verified_badge',
      },
    } as unknown as Stripe.Checkout.Session;

    await handler.handleCheckoutSession(session);

    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should skip duplicate listing add-on webhook if already recorded (idempotency)', async () => {
    const session = {
      id: 'cs_addon_dup',
      payment_intent: 'pi_addon_dup',
      payment_status: 'paid',
      amount_total: 2900,
      currency: 'eur',
      metadata: {
        type: 'listing_addon',
        userId: 'host-1',
        listingId: 'list-1',
        addonType: 'verified_badge',
      },
    } as unknown as Stripe.Checkout.Session;

    tableMocks.listing_addons.maybeSingle.mockResolvedValueOnce({
      data: { id: 'la-existing' },
      error: null,
    });

    await handler.handleCheckoutSession(session);

    expect(tableMocks.listing_addons.eq).toHaveBeenCalledWith(
      'stripe_payment_intent_id',
      'pi_addon_dup',
    );
    expect(tableMocks.listing_addons.insert).not.toHaveBeenCalled();
    expect(tableMocks.directory_listings.update).not.toHaveBeenCalled();
  });

  it('should set expires_at to null when durationDays metadata is omitted for permanent add-on', async () => {
    const session = {
      id: 'cs_addon_perm',
      payment_intent: 'pi_addon_perm',
      payment_status: 'paid',
      metadata: {
        userId: 'host-2',
        listingId: 'list-2',
        addonType: 'verified_badge',
        durationDays: 'not-a-number',
      },
    } as unknown as Stripe.Checkout.Session;

    await handler.handleCheckoutSession(session);

    expect(tableMocks.listing_addons.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: 'list-2',
        addon_type: 'verified_badge',
        status: 'active',
        expires_at: null,
        stripe_payment_intent_id: 'pi_addon_perm',
      }),
    );
    expect(tableMocks.directory_listings.update).toHaveBeenCalledWith({
      is_verified: true,
    });
  });

  it('should insert listing addon and patch directory listing for verified_badge', async () => {
    const session = {
      id: 'cs_addon_vb',
      payment_intent: 'pi_addon_vb',
      amount_total: 5000,
      currency: 'eur',
      metadata: {
        type: 'listing_addon',
        userId: 'host-1',
        listingId: 'list-1',
        addonType: 'verified_badge',
        durationDays: '60',
      },
    } as unknown as Stripe.Checkout.Session;

    tableMocks.listing_addons.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await handler.handleCheckoutSession(session);

    expect(tableMocks.listing_addons.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: 'list-1',
        addon_type: 'verified_badge',
        status: 'active',
        stripe_payment_intent_id: 'pi_addon_vb',
        metadata: {
          amount: 50,
          currency: 'eur',
        },
      }),
    );

    expect(tableMocks.directory_listings.update).toHaveBeenCalledWith({
      is_verified: true,
    });
    expect(tableMocks.directory_listings.eq).toHaveBeenCalledWith(
      'id',
      'list-1',
    );
    expect(redisService.delByPattern).toHaveBeenCalledWith('directory:*');

    expect(notificationsService.notifyUser).toHaveBeenCalledWith(
      'host-1',
      expect.objectContaining({
        title: 'Upgrade activated',
        type: 'success',
      }),
    );
  });

  it('should record was_featured_before true and patch is_featured for seasonal_placement addon', async () => {
    const session = {
      id: 'cs_addon_seasonal',
      payment_intent: { id: 'pi_addon_seasonal_obj' },
      amount_total: 9900,
      currency: 'eur',
      metadata: {
        userId: 'host-3',
        listingId: 'list-3',
        addonType: 'seasonal_placement',
      },
    } as unknown as Stripe.Checkout.Session;

    tableMocks.directory_listings.maybeSingle.mockResolvedValueOnce({
      data: { is_featured: true },
      error: null,
    });

    await handler.handleCheckoutSession(session);

    expect(tableMocks.listing_addons.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_id: 'list-3',
        addon_type: 'seasonal_placement',
        status: 'active',
        stripe_payment_intent_id: 'pi_addon_seasonal_obj',
        metadata: {
          amount: 99,
          currency: 'eur',
          was_featured_before: true,
        },
      }),
    );
    expect(tableMocks.directory_listings.update).toHaveBeenCalledWith({
      is_featured: true,
    });
  });

  it('should notify admins when sponsored_article addon is purchased', async () => {
    const session = {
      id: 'cs_addon_sponsored',
      payment_intent: 'pi_addon_spon',
      amount_total: 14900,
      currency: 'eur',
      metadata: {
        userId: 'host-5',
        listingId: 'list-5',
        addonType: 'sponsored_article',
      },
    } as unknown as Stripe.Checkout.Session;

    tableMocks.directory_listings.maybeSingle.mockResolvedValueOnce({
      data: { name: 'Sunset Cafe' },
      error: null,
    });

    await handler.handleCheckoutSession(session);

    expect(notificationsService.notifyAdmins).toHaveBeenCalledWith({
      title: 'Sponsored article purchased',
      message: expect.stringContaining('Sunset Cafe'),
      type: 'info',
      link: '/admin/directory',
    });
  });

  it('should throw error when insert into listing_addons fails', async () => {
    const session = {
      id: 'cs_fail',
      metadata: {
        userId: 'host-4',
        listingId: 'list-4',
        addonType: 'verified_badge',
      },
    } as unknown as Stripe.Checkout.Session;

    tableMocks.listing_addons.insert.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB connection error' },
    });

    await expect(handler.handleCheckoutSession(session)).rejects.toEqual({
      message: 'DB connection error',
    });
  });
});

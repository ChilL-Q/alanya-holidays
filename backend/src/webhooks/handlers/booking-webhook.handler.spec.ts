import { Test, TestingModule } from '@nestjs/testing';
import { BookingWebhookHandler } from './booking-webhook.handler';
import { SupabaseService } from '../../supabase/supabase.service';
import { BookingsService } from '../../bookings/bookings.service';
import { BookingsRepository } from '../../bookings/bookings.repository';
import Stripe from 'stripe';

describe('BookingWebhookHandler', () => {
  let handler: BookingWebhookHandler;
  let bookingsService: jest.Mocked<Partial<BookingsService>>;
  let bookingsRepository: jest.Mocked<Partial<BookingsRepository>>;

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
    tableMocks = {
      bookings: createTableMock(),
      notifications: createTableMock(),
      properties: createTableMock(),
      services: createTableMock(),
      profiles: createTableMock(),
    };

    mockSupabaseClient = {
      from: jest.fn().mockImplementation((table: string): TableMock => {
        if (!(table in tableMocks)) {
          tableMocks[table] = createTableMock();
        }
        return tableMocks[table];
      }),
    };

    bookingsService = {
      confirmBookingPayment: jest.fn().mockResolvedValue({ confirmedCount: 1 }),
    };

    bookingsRepository = {
      unblockDatesForBooking: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingWebhookHandler,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => mockSupabaseClient,
          },
        },
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
        {
          provide: BookingsRepository,
          useValue: bookingsRepository,
        },
      ],
    }).compile();

    handler = module.get<BookingWebhookHandler>(BookingWebhookHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleCheckoutSession', () => {
    it('should ignore sessions with payment_status !== paid', async () => {
      const session = {
        id: 'cs_unpaid',
        payment_status: 'unpaid',
      } as Stripe.Checkout.Session;

      await handler.handleCheckoutSession(session);

      expect(bookingsService.confirmBookingPayment).not.toHaveBeenCalled();
    });

    it('should return early when bookingIds or userId metadata is missing', async () => {
      const sessionNoUser = {
        id: 'cs_no_user',
        payment_status: 'paid',
        metadata: { bookingIds: 'b1,b2' },
      } as unknown as Stripe.Checkout.Session;

      await handler.handleCheckoutSession(sessionNoUser);
      expect(bookingsService.confirmBookingPayment).not.toHaveBeenCalled();

      const sessionNoBookings = {
        id: 'cs_no_bookings',
        payment_status: 'paid',
        metadata: { userId: 'u1' },
      } as unknown as Stripe.Checkout.Session;

      await handler.handleCheckoutSession(sessionNoBookings);
      expect(bookingsService.confirmBookingPayment).not.toHaveBeenCalled();
    });

    it('should confirm booking payment for valid checkout session', async () => {
      const session = {
        id: 'cs_booking_paid',
        payment_status: 'paid',
        payment_intent: 'pi_book_1',
        metadata: {
          bookingIds: 'b1,b2',
          userId: 'user-123',
        },
      } as unknown as Stripe.Checkout.Session;

      await handler.handleCheckoutSession(session);

      expect(bookingsService.confirmBookingPayment).toHaveBeenCalledWith(
        ['b1', 'b2'],
        'user-123',
        'cs_booking_paid',
        'pi_book_1',
      );
    });

    it('should throw error when confirmBookingPayment fails', async () => {
      const session = {
        id: 'cs_fail',
        payment_status: 'paid',
        metadata: {
          bookingIds: 'b1',
          userId: 'u1',
        },
      } as unknown as Stripe.Checkout.Session;

      (
        bookingsService.confirmBookingPayment as jest.Mock
      ).mockRejectedValueOnce(new Error('Payment confirmation failed'));

      await expect(handler.handleCheckoutSession(session)).rejects.toThrow(
        'Payment confirmation failed',
      );
    });
  });

  describe('handlePaymentIntentFailed', () => {
    it('should mark booking as failed and send notification to guest', async () => {
      const pi = {
        id: 'pi_failed_1',
        last_payment_error: { message: 'Insufficient funds' },
      } as Stripe.PaymentIntent;

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({
          data: [{ id: 'b_failed_1', user_id: 'guest_1' }],
          error: null,
        }).then(resolve, reject);

      await handler.handlePaymentIntentFailed(pi);

      expect(tableMocks.bookings.update).toHaveBeenCalledWith({
        payment_status: 'failed',
      });
      expect(tableMocks.bookings.eq).toHaveBeenCalledWith('id', 'b_failed_1');

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'guest_1',
          title: '⚠️ Payment Failed',
          type: 'error',
        }),
      );
    });

    it('should handle missing bookings gracefully', async () => {
      const pi = {
        id: 'pi_no_bookings',
      } as Stripe.PaymentIntent;

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({
          data: [],
          error: null,
        }).then(resolve, reject);

      await handler.handlePaymentIntentFailed(pi);

      expect(tableMocks.bookings.update).not.toHaveBeenCalled();
    });
  });

  describe('handleDisputeCreated', () => {
    it('should mark bookings as failed and notify all admins', async () => {
      const dispute = {
        id: 'dp_100',
        amount: 50000,
        currency: 'eur',
        reason: 'fraudulent',
        status: 'needs_response',
        payment_intent: 'pi_dispute_100',
      } as unknown as Stripe.Dispute;

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({
          data: [{ id: 'b_disp_1', user_id: 'guest_disp' }],
          error: null,
        }).then(resolve, reject);

      tableMocks.profiles.then = (resolve, reject) =>
        Promise.resolve({
          data: [{ id: 'admin_1' }, { id: 'admin_2' }],
          error: null,
        }).then(resolve, reject);

      await handler.handleDisputeCreated(dispute);

      expect(tableMocks.bookings.update).toHaveBeenCalledWith({
        payment_status: 'failed',
      });
      expect(tableMocks.bookings.in).toHaveBeenCalledWith('id', ['b_disp_1']);

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'admin_1',
          title: 'Charge Dispute Filed',
          type: 'warning',
          link: '/admin/bookings',
        }),
        expect.objectContaining({
          user_id: 'admin_2',
          title: 'Charge Dispute Filed',
          type: 'warning',
          link: '/admin/bookings',
        }),
      ]);
    });
  });

  describe('handleChargeRefunded', () => {
    it('should do nothing if payment_intent is missing', async () => {
      const charge = {
        id: 'ch_no_pi',
        payment_intent: null,
      } as Stripe.Charge;

      await handler.handleChargeRefunded(charge);

      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(bookingsRepository.unblockDatesForBooking).not.toHaveBeenCalled();
    });

    it('should skip duplicate refund processing if booking is already refunded (idempotency)', async () => {
      const charge = {
        id: 'ch_ref_dup',
        payment_intent: 'pi_refund_dup',
      } as Stripe.Charge;

      const mockBooking = {
        id: 'b_already_refunded',
        user_id: 'guest_dup',
        item_id: 'prop_dup',
        item_type: 'property',
        status: 'cancelled',
        payment_status: 'refunded',
      };

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({ data: [mockBooking], error: null }).then(
          resolve,
          reject,
        );

      await handler.handleChargeRefunded(charge);

      expect(tableMocks.bookings.update).not.toHaveBeenCalled();
      expect(bookingsRepository.unblockDatesForBooking).not.toHaveBeenCalled();
      expect(tableMocks.notifications.insert).not.toHaveBeenCalled();
    });

    it('should cancel booking, unblock dates, and notify guest and property host', async () => {
      const charge = {
        id: 'ch_ref_prop',
        payment_intent: 'pi_refund_1',
      } as Stripe.Charge;

      const mockBooking = {
        id: 'b_refund_prop',
        user_id: 'guest_1',
        item_id: 'prop_1',
        item_type: 'property',
        status: 'confirmed',
        payment_status: 'paid',
      };

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({ data: [mockBooking], error: null }).then(
          resolve,
          reject,
        );

      tableMocks.properties.maybeSingle.mockResolvedValueOnce({
        data: { host_id: 'host_1', title: 'Luxury Villa' },
        error: null,
      });

      await handler.handleChargeRefunded(charge);

      expect(tableMocks.bookings.update).toHaveBeenCalledWith({
        status: 'cancelled',
        payment_status: 'refunded',
      });
      expect(tableMocks.bookings.eq).toHaveBeenCalledWith('id', mockBooking.id);

      expect(bookingsRepository.unblockDatesForBooking).toHaveBeenCalledWith(
        mockBooking.id,
      );

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'guest_1',
          title: 'Booking Refunded & Cancelled',
          type: 'info',
        }),
      );

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith({
        user_id: 'host_1',
        title: 'Booking Refunded & Cancelled',
        message:
          'Booking for "Luxury Villa" was cancelled due to a refund. Dates have been reopened.',
        type: 'warning',
        link: '/host/bookings',
      });
    });

    it('should notify service provider for service booking refund', async () => {
      const charge = {
        id: 'ch_ref_svc',
        payment_intent: 'pi_refund_svc',
      } as Stripe.Charge;

      const mockBooking = {
        id: 'b_refund_svc',
        user_id: 'guest_2',
        item_id: 'svc_1',
        item_type: 'service',
        status: 'confirmed',
        payment_status: 'paid',
      };

      tableMocks.bookings.then = (resolve, reject) =>
        Promise.resolve({ data: [mockBooking], error: null }).then(
          resolve,
          reject,
        );

      tableMocks.services.maybeSingle.mockResolvedValueOnce({
        data: { provider_id: 'provider_1', title: 'City Tour' },
        error: null,
      });

      await handler.handleChargeRefunded(charge);

      expect(bookingsRepository.unblockDatesForBooking).toHaveBeenCalledWith(
        mockBooking.id,
      );

      expect(tableMocks.notifications.insert).toHaveBeenCalledWith({
        user_id: 'provider_1',
        title: 'Booking Refunded & Cancelled',
        message:
          'Booking for "City Tour" was cancelled due to a refund. Dates have been reopened.',
        type: 'warning',
        link: '/host/bookings',
      });
    });
  });
});

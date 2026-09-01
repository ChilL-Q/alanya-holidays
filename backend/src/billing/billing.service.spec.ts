import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { PAYMENT_GATEWAY } from '../webhooks/domain/payment-gateway.interface';

const activeRecord = {
  id: 'rec-1',
  user_id: 'user-1',
  plan: 'monthly',
  status: 'active',
  stripe_subscription_id: 'sub-1',
  stripe_customer_id: 'cus-1',
  current_period_end: '2026-09-25T00:00:00Z',
  cancel_at_period_end: false,
};

describe('BillingService', () => {
  let service: BillingService;
  let billingRepository: {
    findByUserId: jest.Mock;
    hasActivePremiumAccess: jest.Mock;
    setCancelAtPeriodEnd: jest.Mock;
  };
  let paymentGateway: {
    createSubscriptionCheckoutSession: jest.Mock;
    cancelSubscriptionAtPeriodEnd: jest.Mock;
    createBillingPortalSession: jest.Mock;
  };

  beforeEach(async () => {
    billingRepository = {
      findByUserId: jest.fn(),
      hasActivePremiumAccess: jest.fn(),
      setCancelAtPeriodEnd: jest.fn().mockResolvedValue(undefined),
    };
    paymentGateway = {
      createSubscriptionCheckoutSession: jest
        .fn()
        .mockResolvedValue({ url: 'https://checkout.stripe.test/sub' }),
      cancelSubscriptionAtPeriodEnd: jest.fn().mockResolvedValue(undefined),
      createBillingPortalSession: jest
        .fn()
        .mockResolvedValue({ url: 'https://billing.stripe.test/portal' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: BillingRepository, useValue: billingRepository },
        { provide: PAYMENT_GATEWAY, useValue: paymentGateway },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('getMySubscription', () => {
    it('returns the wrapped subscription record', async () => {
      billingRepository.findByUserId.mockResolvedValue(activeRecord);

      const res = await service.getMySubscription('user-1');

      expect(res?.subscription).toEqual(
        expect.objectContaining({ plan: 'monthly', status: 'active' }),
      );
      expect(billingRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('returns null subscription when the user has none', async () => {
      billingRepository.findByUserId.mockResolvedValue(null);

      const res = await service.getMySubscription('user-1');

      expect(res).toEqual({ subscription: null });
    });
  });

  it('delegates the premium access decision to the authoritative repository predicate', async () => {
    billingRepository.hasActivePremiumAccess.mockResolvedValueOnce(true);

    await expect(service.hasActivePremiumAccess('user-1')).resolves.toBe(true);
    expect(billingRepository.hasActivePremiumAccess).toHaveBeenCalledWith(
      'user-1',
    );
  });

  describe('createCheckout', () => {
    it('throws BadRequest when an active subscription already exists', async () => {
      billingRepository.findByUserId.mockResolvedValue(activeRecord);

      await expect(
        service.createCheckout('user-1', 'u@test.dev', 'monthly'),
      ).rejects.toThrow(BadRequestException);
      expect(
        paymentGateway.createSubscriptionCheckoutSession,
      ).not.toHaveBeenCalled();
    });

    it('allows checkout when the previous subscription was cancelled', async () => {
      billingRepository.findByUserId.mockResolvedValue({
        ...activeRecord,
        status: 'cancelled',
      });

      const res = await service.createCheckout(
        'user-1',
        'u@test.dev',
        'annual',
      );

      expect(
        paymentGateway.createSubscriptionCheckoutSession,
      ).toHaveBeenCalledWith({
        userId: 'user-1',
        userEmail: 'u@test.dev',
        plan: 'annual',
      });
      expect(res.url).toContain('checkout.stripe');
    });

    it('delegates to the gateway for a fresh user', async () => {
      billingRepository.findByUserId.mockResolvedValue(null);

      await service.createCheckout('user-1', undefined, 'monthly');

      expect(
        paymentGateway.createSubscriptionCheckoutSession,
      ).toHaveBeenCalledWith({
        userId: 'user-1',
        userEmail: undefined,
        plan: 'monthly',
      });
    });
  });

  describe('cancel', () => {
    it('throws NotFound when the user has no subscription', async () => {
      billingRepository.findByUserId.mockResolvedValue(null);

      await expect(service.cancel('user-1')).rejects.toThrow(NotFoundException);
    });

    it('cancels at period end via gateway and persists the flag', async () => {
      billingRepository.findByUserId.mockResolvedValue(activeRecord);

      const res = await service.cancel('user-1');

      expect(paymentGateway.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith(
        'sub-1',
      );
      expect(billingRepository.setCancelAtPeriodEnd).toHaveBeenCalledWith(
        'rec-1',
        true,
      );
      expect(res).toEqual({ success: true });
    });
  });

  describe('createPortal', () => {
    it('throws NotFound when there is no stripe customer', async () => {
      billingRepository.findByUserId.mockResolvedValue(null);

      await expect(service.createPortal('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates a billing portal session with the stored customer', async () => {
      billingRepository.findByUserId.mockResolvedValue(activeRecord);

      const res = await service.createPortal('user-1');

      expect(paymentGateway.createBillingPortalSession).toHaveBeenCalledWith(
        'cus-1',
        expect.stringContaining('/settings'),
      );
      expect(res.url).toBe('https://billing.stripe.test/portal');
    });
  });

  it('reports a clear error when the gateway is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: BillingRepository, useValue: billingRepository },
      ],
    }).compile();

    const gatewayless = module.get<BillingService>(BillingService);
    await expect(
      gatewayless.createCheckout('user-1', undefined, 'monthly'),
    ).rejects.toThrow('Payment gateway is not configured');
  });
});

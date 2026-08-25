import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AuthGuard } from '../auth/auth.guard';

describe('BillingController', () => {
  let controller: BillingController;
  const billingService = {
    createCheckout: jest.fn(),
    cancel: jest.fn(),
    getMySubscription: jest.fn(),
    createPortal: jest.fn(),
  };
  const mockUser = { id: 'user-1', email: 'u@test.dev' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{ provide: BillingService, useValue: billingService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BillingController>(BillingController);
  });

  it('passes the current user and plan to checkout', async () => {
    billingService.createCheckout.mockResolvedValue({ url: 'https://co' });

    const res = await controller.createCheckout({ plan: 'annual' }, mockUser);

    expect(billingService.createCheckout).toHaveBeenCalledWith(
      'user-1',
      'u@test.dev',
      'annual',
    );
    expect(res).toEqual({ url: 'https://co' });
  });

  it('delegates cancel to the service', async () => {
    billingService.cancel.mockResolvedValue({ success: true });

    const res = await controller.cancel(mockUser);

    expect(billingService.cancel).toHaveBeenCalledWith('user-1');
    expect(res).toEqual({ success: true });
  });

  it('delegates getMySubscription to the service', async () => {
    billingService.getMySubscription.mockResolvedValue({ subscription: null });

    const res = await controller.getMySubscription(mockUser);

    expect(billingService.getMySubscription).toHaveBeenCalledWith('user-1');
    expect(res).toEqual({ subscription: null });
  });

  it('delegates portal creation to the service', async () => {
    billingService.createPortal.mockResolvedValue({ url: 'https://portal' });

    const res = await controller.createPortal(mockUser);

    expect(billingService.createPortal).toHaveBeenCalledWith('user-1');
    expect(res).toEqual({ url: 'https://portal' });
  });
});

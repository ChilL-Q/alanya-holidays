import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { BadRequestException, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';

describe('StripeWebhookController', () => {
  let controller: StripeWebhookController;
  let service: jest.Mocked<Partial<StripeWebhookService>>;

  beforeEach(async () => {
    service = {
      processWebhookEvent: jest.fn().mockResolvedValue({ received: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeWebhookController],
      providers: [
        {
          provide: StripeWebhookService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<StripeWebhookController>(StripeWebhookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw BadRequestException if stripe-signature header is missing', async () => {
    const req = {
      rawBody: Buffer.from('test payload'),
    } as RawBodyRequest<Request>;

    await expect(controller.handleStripeWebhook(req, '')).rejects.toThrow(
      new BadRequestException('Missing stripe-signature header'),
    );
  });

  it('should throw BadRequestException if rawBody is missing on request', async () => {
    const req = {} as RawBodyRequest<Request>;

    await expect(
      controller.handleStripeWebhook(req, 'sig_123'),
    ).rejects.toThrow(
      new BadRequestException(
        'Missing raw request body for Stripe signature verification',
      ),
    );
  });

  it('should process webhook event successfully when signature and rawBody are present', async () => {
    const rawBody = Buffer.from('valid raw body');
    const req = { rawBody } as RawBodyRequest<Request>;
    const signature = 'sig_valid_test';

    const result = await controller.handleStripeWebhook(req, signature);

    expect(service.processWebhookEvent).toHaveBeenCalledWith(
      rawBody,
      signature,
    );
    expect(result).toEqual({ received: true });
  });
});

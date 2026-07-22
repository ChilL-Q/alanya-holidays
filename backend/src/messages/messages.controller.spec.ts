import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

describe('MessagesController', () => {
  let controller: MessagesController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      sendMessage: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it('should delegate sendMessage call to MessagesService', async () => {
    const payload = {
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hi',
    };
    const res = await controller.sendMessage(payload);

    expect(res).toEqual({ success: true });
    expect(mockService.sendMessage).toHaveBeenCalledWith(payload);
  });
});

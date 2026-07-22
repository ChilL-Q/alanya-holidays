import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';

describe('MessagesService', () => {
  let service: MessagesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      insertMessage: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      invokeEmailFunction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: MessagesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should sanitize input HTML tags, insert message, and send email', async () => {
    const rawData = {
      name: '<b>John Doe</b>',
      email: 'john@example.com',
      subject: '<script>alert(1)</script>Inquiry',
      message: '<p>Hello Alanya!</p>',
    };

    const result = await service.sendMessage(rawData);

    expect(result).toEqual({ success: true });
    expect(mockRepository.insertMessage).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'alert(1)Inquiry',
      message: 'Hello Alanya!',
    });
    expect(mockRepository.invokeEmailFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'admin_contact_message',
        to: 'contact@alanyaholidays.com',
      }),
    );
  });
});

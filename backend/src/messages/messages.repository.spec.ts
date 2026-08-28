import { Test, TestingModule } from '@nestjs/testing';
import { MessagesRepository } from './messages.repository';
import { SupabaseService } from '../supabase/supabase.service';

describe('MessagesRepository - getLastMessagesAndUnreadCounts', () => {
  let repository: MessagesRepository;
  let mockRpc: jest.Mock;
  let mockFrom: jest.Mock;

  beforeEach(async () => {
    mockRpc = jest.fn();
    mockFrom = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesRepository,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => ({
              rpc: mockRpc,
              from: mockFrom,
            }),
          },
        },
      ],
    }).compile();

    repository = module.get<MessagesRepository>(MessagesRepository);
  });

  it('applies an inclusive range to user conversations', async () => {
    const range = jest.fn().mockResolvedValue({ data: [], error: null });
    const orderedQuery = { order: jest.fn(), range };
    orderedQuery.order.mockReturnValue(orderedQuery);
    const or = jest.fn().mockReturnValue(orderedQuery);
    const select = jest.fn().mockReturnValue({ or });
    mockFrom.mockReturnValue({ select });

    await repository.findUserConversations('user-1', 20, 40);

    expect(mockFrom).toHaveBeenCalledWith('chat_conversations');
    expect(or).toHaveBeenCalledWith('guest_id.eq.user-1,host_id.eq.user-1');
    expect(orderedQuery.order.mock.calls).toEqual([
      ['updated_at', { ascending: false }],
      ['id', { ascending: false }],
    ]);
    expect(range).toHaveBeenCalledWith(40, 59);
  });

  it('applies an inclusive range to conversation messages', async () => {
    const range = jest.fn().mockResolvedValue({ data: [], error: null });
    const orderedQuery = { order: jest.fn(), range };
    orderedQuery.order.mockReturnValue(orderedQuery);
    const eq = jest.fn().mockReturnValue(orderedQuery);
    const select = jest.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });

    await repository.findMessagesByConversationId('conv-1', 10, 5);

    expect(eq).toHaveBeenCalledWith('conversation_id', 'conv-1');
    expect(orderedQuery.order.mock.calls).toEqual([
      ['created_at', { ascending: true }],
      ['id', { ascending: true }],
    ]);
    expect(range).toHaveBeenCalledWith(5, 14);
  });

  it('should return empty object if conversationIds is empty', async () => {
    const result = await repository.getLastMessagesAndUnreadCounts([], 'u1');
    expect(result).toEqual({});
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should use get_conversations_last_and_unread RPC fast path when available', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          conversation_id: 'conv-1',
          last_message_id: 'msg-1',
          last_message_sender_id: 'user-2',
          last_message_content: 'Hello there!',
          last_message_is_read: false,
          last_message_created_at: '2026-08-22T10:00:00Z',
          unread_count: 3,
        },
        {
          conversation_id: 'conv-2',
          last_message_id: null,
          last_message_sender_id: null,
          last_message_content: null,
          last_message_is_read: null,
          last_message_created_at: null,
          unread_count: 0,
        },
      ],
      error: null,
    });

    const result = await repository.getLastMessagesAndUnreadCounts(
      ['conv-1', 'conv-2'],
      'user-1',
    );

    expect(mockRpc).toHaveBeenCalledWith('get_conversations_last_and_unread', {
      p_conversation_ids: ['conv-1', 'conv-2'],
      p_user_id: 'user-1',
    });
    expect(mockFrom).not.toHaveBeenCalled();

    expect(result['conv-1']).toEqual({
      last_message: {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_id: 'user-2',
        content: 'Hello there!',
        is_read: false,
        created_at: '2026-08-22T10:00:00Z',
      },
      unread_count: 3,
    });

    expect(result['conv-2']).toEqual({
      last_message: null,
      unread_count: 0,
    });
  });

  it('should gracefully fallback to batched queries when RPC throws or fails', async () => {
    mockRpc.mockRejectedValueOnce(new Error('RPC not found'));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'chat_messages') {
        return {
          select: jest.fn().mockImplementation((fields: string) => {
            if (fields === '*') {
              return {
                in: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'msg-legacy-1',
                        conversation_id: 'conv-1',
                        sender_id: 'user-2',
                        content: 'Fallback message',
                        is_read: true,
                        created_at: '2026-08-22T09:00:00Z',
                      },
                    ],
                    error: null,
                  }),
                }),
              };
            }
            if (fields === 'conversation_id') {
              return {
                in: jest.fn().mockReturnValue({
                  neq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                      data: [
                        { conversation_id: 'conv-1' },
                        { conversation_id: 'conv-1' },
                      ],
                      error: null,
                    }),
                  }),
                }),
              };
            }
            return { in: jest.fn().mockResolvedValue({ data: [] }) };
          }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [] }) };
    });

    const result = await repository.getLastMessagesAndUnreadCounts(
      ['conv-1'],
      'user-1',
    );

    expect(result['conv-1']).toEqual({
      last_message: {
        id: 'msg-legacy-1',
        conversation_id: 'conv-1',
        sender_id: 'user-2',
        content: 'Fallback message',
        is_read: true,
        created_at: '2026-08-22T09:00:00Z',
      },
      unread_count: 2,
    });
  });
});

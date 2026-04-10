import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chat';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      auth: { getUser: vi.fn() },
      functions: { invoke: vi.fn().mockResolvedValue({}) },
      channel: vi.fn()
    }
  }
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

// Stable UUIDs for test fixtures
const USER_ID   = '550e8400-e29b-41d4-a716-446655440001';
const CONV_ID   = '550e8400-e29b-41d4-a716-446655440002';
const PROP_ID   = '550e8400-e29b-41d4-a716-446655440003';
const HOST_ID   = '550e8400-e29b-41d4-a716-446655440004';
const HOST_ID2  = '550e8400-e29b-41d4-a716-446655440005';

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
  });

  const createMockChain = (data: any = null, error: any = null) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data, error }),
      then: (resolve: any) => resolve({ data, count: error ? 0 : (Array.isArray(data) ? data.length : 1), error })
    };
    return chain;
  };

  describe('getConversations', () => {
    it('throws if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(chatService.getConversations()).rejects.toThrow('Not authenticated');
    });

    it('fetches and enriches conversations', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });

      const mockConvs = [{ id: CONV_ID }];

      mockSupabase.from.mockImplementation((table) => {
          if (table === 'chat_conversations') return createMockChain(mockConvs);
          if (table === 'chat_messages') {
              const chain = createMockChain();
              chain.then = (cb: any) => cb({ count: 5, data: [] });
              chain.maybeSingle = vi.fn().mockResolvedValue({ data: { content: 'hi' }, error: null });
              return chain;
          }
      });

      const result = await chatService.getConversations();
      expect(result).toHaveLength(1);
      expect(result[0].unread_count).toBe(5);
      expect(result[0].last_message).toEqual({ content: 'hi' });
    });

    it('throws on db error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
      mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB Error')));
      await expect(chatService.getConversations()).rejects.toThrow('DB Error');
    });
  });

  describe('getMessages', () => {
      it('fetches messages for conversation', async () => {
          mockSupabase.from.mockReturnValue(
              createMockChain({ id: CONV_ID }) as any
          );
          const mockData = [{ id: '1' }];
          const msgChain = createMockChain(mockData);
          mockSupabase.from.mockReturnValueOnce(createMockChain({ id: CONV_ID }) as any);
          mockSupabase.from.mockReturnValueOnce(msgChain);
          const result = await chatService.getMessages(CONV_ID);
          expect(result).toEqual(mockData);
      });

      it('throws when not participant', async () => {
          mockSupabase.from.mockReturnValue(createMockChain(null) as any);
          await expect(chatService.getMessages(CONV_ID)).rejects.toThrow('Not authorized for this conversation');
      });
  });

  describe('sendMessage', () => {
    it('throws if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(chatService.sendMessage(CONV_ID, 'hi')).rejects.toThrow('Not authenticated');
    });

    it('inserts message correctly and updates conversation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });

      const msgChain = createMockChain({ id: 'msg1', content: 'hello' });
      const convUpdateChain = createMockChain();
      const convSelectChain = createMockChain({ guest_id: USER_ID, host_id: HOST_ID2, property: { title: 'Villa' } });
      const convAccessChain = createMockChain({ id: CONV_ID });

      let convCall = 0;
      mockSupabase.from.mockImplementation((table) => {
          if (table === 'chat_conversations') {
              convCall++;
              if (convCall === 1) return convAccessChain; // verify access
              if (convCall === 2) return convUpdateChain;
              return convSelectChain;
          }
          if (table === 'chat_messages') return msgChain;
          return createMockChain();
      });

      const result = await chatService.sendMessage(CONV_ID, 'hello');

      expect(msgChain.insert).toHaveBeenCalled();
      expect(convUpdateChain.update).toHaveBeenCalled();
      await new Promise(r => setTimeout(r, 0)); // flush promises
      expect(mockSupabase.functions.invoke).toHaveBeenCalled();

      expect(result).toEqual({ id: 'msg1', content: 'hello' });
    });

    it('throws on db error', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
        mockSupabase.from
            .mockReturnValueOnce(createMockChain({ id: CONV_ID })) // verify access
            .mockReturnValueOnce(createMockChain(null, new Error('DB Error'))); // insert fails
        await expect(chatService.sendMessage(CONV_ID, 'hi')).rejects.toThrow('DB Error');
    });
  });

  describe('createConversation', () => {
      it('throws if not auth', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
          await expect(chatService.createConversation(PROP_ID, HOST_ID)).rejects.toThrow();
      });

      it('returns existing', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
          const chain = createMockChain({ id: CONV_ID });
          mockSupabase.from.mockReturnValue(chain);
          const result = await chatService.createConversation(PROP_ID, HOST_ID);
          expect(result).toBe(CONV_ID);
      });

      it('creates new if not exists', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
          // New code attempts INSERT directly; returns data.id on success
          const insertChain = createMockChain({ id: 'new-c' });
          mockSupabase.from.mockReturnValue(insertChain);

          const result = await chatService.createConversation(PROP_ID, HOST_ID);
          expect(insertChain.insert).toHaveBeenCalled();
          expect(result).toBe('new-c');
      });

      it('handles duplicate error condition', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
          // New code: INSERT → 23505 error → fetch existing conversation
          const insertChain = createMockChain(null, { code: '23505' });
          const fetchChain = createMockChain({ id: 'c-dup' });

          let call = 0;
          mockSupabase.from.mockImplementation(() => {
              call++;
              return call === 1 ? insertChain : fetchChain;
          });

          const result = await chatService.createConversation(PROP_ID, HOST_ID);
          expect(result).toBe('c-dup');
      });
  });

  describe('markAsRead', () => {
      it('updates messages', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
          const chain = createMockChain();
          mockSupabase.from.mockReturnValue(chain);
          await chatService.markAsRead(CONV_ID);
          expect(chain.update).toHaveBeenCalledWith({ is_read: true });
      });

      it('does nothing if no user', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
          const chain = createMockChain();
          mockSupabase.from.mockReturnValue(chain);
          await chatService.markAsRead(CONV_ID);
          expect(chain.update).not.toHaveBeenCalled();
      });

      it('throws on db error', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
          const chain = createMockChain();
          chain.eq = vi.fn().mockResolvedValue({ error: new Error('DB Error') });
          mockSupabase.from.mockReturnValue(chain);
          await expect(chatService.markAsRead(CONV_ID)).rejects.toThrow();
      });
  });

  describe('clearHistory', () => {
      it('deletes messages', async () => {
          mockSupabase.from.mockReturnValueOnce(createMockChain({ id: CONV_ID }) as any);
          mockSupabase.from.mockReturnValueOnce(createMockChain());
          await chatService.clearHistory(CONV_ID);
          const calls = mockSupabase.from.mock.calls;
          expect(calls).toContainEqual(['chat_messages']);
      });

      it('throws if no user', async () => {
          mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
          await expect(chatService.clearHistory(CONV_ID)).rejects.toThrow();
      });
  });

  describe('submitReport', () => {
      it('inserts report', async () => {
          const chain = createMockChain();
          mockSupabase.from.mockReturnValue(chain);
          await chatService.submitReport({ reason: 'spam' } as any);
          expect(chain.insert).toHaveBeenCalled();
      });
  });

  describe('subscribeToMessages', () => {
      it('calls channel subscribe', () => {
          const mockUnsubscribe = vi.fn();
          const mockOn = vi.fn().mockReturnValue({ subscribe: vi.fn(), unsubscribe: mockUnsubscribe });
          const mockSubscribe = vi.fn();
          mockSupabase.channel.mockReturnValue({
              on: mockOn,
              subscribe: mockSubscribe,
              unsubscribe: mockUnsubscribe
          });
          // Ensure verifyConversationAccess resolves (access check passes)
          mockSupabase.from.mockReturnValue({
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              or: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: CONV_ID }, error: null })
          });

          chatService.subscribeToMessages(CONV_ID, vi.fn());
          expect(mockSupabase.channel).toHaveBeenCalledWith(`conversation:${CONV_ID}`);
          expect(mockOn).toHaveBeenCalled();
      });
  });
});

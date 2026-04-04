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

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
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
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });

      const mockConvs = [{ id: 'c1' }];
      
      mockSupabase.from.mockImplementation((table) => {
          if (table === 'chat_conversations') return createMockChain(mockConvs);
          if (table === 'chat_messages') {
              // Can act as either the lastMsg single fetch or the unread count fetch depending on what's called last.
              const chain = createMockChain();
              // override to resolve the promise for the count query
              chain.then = (cb: any) => cb({ count: 5, data: [] });
              // override single for last msg query
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
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
      mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB Error')));
      await expect(chatService.getConversations()).rejects.toThrow('DB Error');
    });
  });

  describe('getMessages', () => {
      it('fetches messages for conversation', async () => {
          mockSupabase.from.mockReturnValue(
              createMockChain({ id: 'c1' }) as any
          );
          const mockData = [{ id: '1' }];
          const msgChain = createMockChain(mockData);
          mockSupabase.from.mockReturnValueOnce(createMockChain({ id: 'c1' }) as any);
          mockSupabase.from.mockReturnValueOnce(msgChain);
          const result = await chatService.getMessages('c1');
          expect(result).toEqual(mockData);
      });

      it('throws when not participant', async () => {
          mockSupabase.from.mockReturnValue(createMockChain(null) as any);
          await expect(chatService.getMessages('c1')).rejects.toThrow('Not authorized for this conversation');
      });
  });

  describe('sendMessage', () => {
    it('throws if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(chatService.sendMessage('c1', 'hi')).rejects.toThrow('Not authenticated');
    });

    it('inserts message correctly and updates conversation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });

      const msgChain = createMockChain({ id: 'msg1', content: 'hello' });
      const convUpdateChain = createMockChain();
      const convSelectChain = createMockChain({ guest_id: 'me', host_id: 'host1', property: { title: 'Villa' } });
      const convAccessChain = createMockChain({ id: 'c1' });

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

      const result = await chatService.sendMessage('c1', 'hello');

      expect(msgChain.insert).toHaveBeenCalled();
      expect(convUpdateChain.update).toHaveBeenCalled();
      // Verify email invocation happens in the background
      await new Promise(r => setTimeout(r, 0)); // flush promises
      expect(mockSupabase.functions.invoke).toHaveBeenCalled();

      expect(result).toEqual({ id: 'msg1', content: 'hello' });
    });

    it('throws on db error', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
        mockSupabase.from
            .mockReturnValueOnce(createMockChain({ id: 'c1' })) // verify access
            .mockReturnValueOnce(createMockChain(null, new Error('DB Error'))); // insert fails
        await expect(chatService.sendMessage('c1', 'hi')).rejects.toThrow('DB Error');
    });
  });

  describe('createConversation', () => {
      it('throws if not auth', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
          await expect(chatService.createConversation('p1', 'h1')).rejects.toThrow();
      });

      it('returns existing', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
          const chain = createMockChain({ id: 'c1' });
          mockSupabase.from.mockReturnValue(chain);
          const result = await chatService.createConversation('p1', 'h1');
          expect(result).toBe('c1');
      });

      it('creates new if not exists', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
          
          const existChain = createMockChain(null); // not found
          const insertChain = createMockChain({ id: 'new-c' });

          let call = 0;
          mockSupabase.from.mockImplementation(() => {
              call++;
              return call === 1 ? existChain : insertChain;
          });

          const result = await chatService.createConversation('p1', 'h1');
          expect(insertChain.insert).toHaveBeenCalled();
          expect(result).toBe('new-c');
      });

      it('handles duplicate error condition', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
          
          const existChain = createMockChain(null); // not found
          const insertChain = createMockChain(null, { code: '23505' }); // duplicate error
          const retryChain = createMockChain({ id: 'c-dup' });

          let call = 0;
          mockSupabase.from.mockImplementation(() => {
              call++;
              if (call === 1) return existChain;
              if (call === 2) return insertChain;
              return retryChain;
          });

          const result = await chatService.createConversation('p1', 'h1');
          expect(result).toBe('c-dup');
      });
  });

  describe('markAsRead', () => {
      it('updates messages', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
          const chain = createMockChain();
          mockSupabase.from.mockReturnValue(chain);
          await chatService.markAsRead('c1');
          expect(chain.update).toHaveBeenCalledWith({ is_read: true });
      });

      it('does nothing if no user', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
          const chain = createMockChain();
          mockSupabase.from.mockReturnValue(chain);
          await chatService.markAsRead('c1');
          expect(chain.update).not.toHaveBeenCalled();
      });

      it('throws on db error', async () => {
          mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'me' } } });
          const chain = createMockChain();
          chain.eq = vi.fn().mockResolvedValue({ error: new Error('DB Error') });
          mockSupabase.from.mockReturnValue(chain);
          await expect(chatService.markAsRead('c1')).rejects.toThrow();
      });
  });

  describe('clearHistory', () => {
      it('deletes messages', async () => {
          mockSupabase.from.mockReturnValueOnce(createMockChain({ id: 'c1' }) as any);
          mockSupabase.from.mockReturnValueOnce(createMockChain());
          await chatService.clearHistory('c1');
          const calls = mockSupabase.from.mock.calls;
          expect(calls).toContainEqual(['chat_messages']);
      });

      it('throws if no user', async () => {
          mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
          await expect(chatService.clearHistory('c1')).rejects.toThrow();
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
          const mockOn = vi.fn().mockReturnThis();
          const mockSubscribe = vi.fn();
          mockSupabase.channel.mockReturnValue({
              on: mockOn,
              subscribe: mockSubscribe
          });
          
          chatService.subscribeToMessages('c1', vi.fn());
          expect(mockSupabase.channel).toHaveBeenCalledWith('conversation:c1');
          expect(mockOn).toHaveBeenCalled();
          expect(mockSubscribe).toHaveBeenCalled();
      });
  });
});

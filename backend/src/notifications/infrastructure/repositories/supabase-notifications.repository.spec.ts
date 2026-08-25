import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseNotificationsRepository } from './supabase-notifications.repository';
import { SupabaseService } from '../../../supabase/supabase.service';

describe('SupabaseNotificationsRepository', () => {
  let repository: SupabaseNotificationsRepository;
  let mockSupabaseService: {
    getClient: jest.Mock;
  };
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
    };

    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseNotificationsRepository,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    repository = module.get<SupabaseNotificationsRepository>(
      SupabaseNotificationsRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should insert notification and map to domain model', async () => {
      const dbRow = {
        id: 'notif-101',
        user_id: 'u-1',
        actor_id: 'u-2',
        type: 'FORUM_COMMENT',
        title: 'New Comment',
        message: 'Someone commented',
        data: { postId: 'p-1' },
        link: '/forum/posts/p-1',
        read: false,
        created_at: '2026-08-24T12:00:00.000Z',
      };

      mockQueryBuilder.single.mockResolvedValue({ data: dbRow, error: null });

      const result = await repository.create({
        userId: 'u-1',
        actorId: 'u-2',
        type: 'FORUM_COMMENT',
        title: 'New Comment',
        message: 'Someone commented',
        data: { postId: 'p-1' },
        link: '/forum/posts/p-1',
      });

      expect(mockQueryBuilder.from).toHaveBeenCalledWith('notifications');
      expect(result).toEqual({
        id: 'notif-101',
        userId: 'u-1',
        type: 'FORUM_COMMENT',
        title: 'New Comment',
        message: 'Someone commented',
        data: { postId: 'p-1' },
        link: '/forum/posts/p-1',
        read: false,
        createdAt: '2026-08-24T12:00:00.000Z',
      });
    });

    it('should throw error when database insertion fails', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(
        repository.create({
          userId: 'u-1',
          type: 'SYSTEM',
          title: 'Alert',
          message: 'Error test',
        }),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    it('should query notifications sorted descending by creation date', async () => {
      const rows = [
        {
          id: 'notif-1',
          user_id: 'u-1',
          actor_id: null,
          type: 'SYSTEM',
          title: 'System Notice',
          message: 'Update scheduled',
          data: {},
          link: null,
          read: true,
          created_at: '2026-08-24T10:00:00.000Z',
        },
      ];

      mockQueryBuilder.limit.mockResolvedValue({ data: rows, error: null });

      const result = await repository.findByUserId('u-1', 20);

      expect(mockQueryBuilder.from).toHaveBeenCalledWith('notifications');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'u-1');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('notif-1');
    });
  });

  describe('markAsRead', () => {
    it('should update read flag and return true when matched', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'notif-1' }],
        error: null,
      });

      const result = await repository.markAsRead('u-1', 'notif-1');

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ read: true });
      expect(mockQueryBuilder.match).toHaveBeenCalledWith({
        id: 'notif-1',
        user_id: 'u-1',
      });
      expect(result).toBe(true);
    });

    it('should return false when notification is not found', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.markAsRead('u-1', 'notif-nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications and return updated count', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'notif-1' }, { id: 'notif-2' }],
        error: null,
      });

      const count = await repository.markAllAsRead('u-1');

      expect(mockQueryBuilder.match).toHaveBeenCalledWith({
        user_id: 'u-1',
        read: false,
      });
      expect(count).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete notification matching user_id and return true', async () => {
      mockQueryBuilder.select.mockResolvedValue({
        data: [{ id: 'notif-1' }],
        error: null,
      });

      const result = await repository.delete('u-1', 'notif-1');

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.match).toHaveBeenCalledWith({
        id: 'notif-1',
        user_id: 'u-1',
      });
      expect(result).toBe(true);
    });
  });
});

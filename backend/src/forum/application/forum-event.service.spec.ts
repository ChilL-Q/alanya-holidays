import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ForumEventService } from './forum-event.service';
import { ForumRepository } from '../forum.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';

describe('ForumEventService', () => {
  let service: ForumEventService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRoles: Record<string, jest.Mock>;

  const userId = '11111111-1111-4111-a111-111111111111';
  const eventId = '22222222-2222-4222-a222-222222222222';

  beforeEach(async () => {
    mockRepository = {
      getEvents: jest.fn().mockResolvedValue([]),
      getEventBySlug: jest.fn(),
      getEventSlugs: jest.fn().mockResolvedValue([]),
      insertEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      getEventRsvpAttendees: jest.fn().mockResolvedValue([]),
      getProfilesByIds: jest.fn().mockResolvedValue([]),
      toggleRow: jest.fn().mockResolvedValue({ active: true }),
      annotateRsvp: jest
        .fn()
        .mockImplementation((rows) => Promise.resolve(rows)),
    };

    mockUserRoles = {
      getRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumEventService,
        {
          provide: ForumRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRoles,
        },
      ],
    }).compile();

    service = module.get<ForumEventService>(ForumEventService);
  });

  describe('Events management', () => {
    it('fetches events and annotates RSVP for current user', async () => {
      mockRepository.getEvents.mockResolvedValueOnce([
        { id: eventId, title: 'Beach Meet' },
      ]);
      const res = await service.getForumEvents({ upcomingOnly: true }, userId);
      expect(res).toEqual([{ id: eventId, title: 'Beach Meet' }]);
      expect(mockRepository.annotateRsvp).toHaveBeenCalled();
    });

    it('requires admin to include unpublished events', async () => {
      mockUserRoles.getRole.mockResolvedValueOnce('user');
      await expect(
        service.getForumEvents({ includeUnpublished: true }, userId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('creates event with resolved unique slug when user is admin', async () => {
      mockUserRoles.getRole.mockResolvedValueOnce('admin');
      mockRepository.getEventSlugs.mockResolvedValueOnce([]);
      mockRepository.insertEvent.mockResolvedValueOnce({
        id: eventId,
        title: 'Sunset BBQ',
        slug: 'sunset-bbq',
      });

      const res = await service.createForumEvent(
        { title: 'Sunset BBQ', event_date: '2026-09-01' },
        userId,
      );
      expect(res.id).toBe(eventId);
      expect(mockRepository.insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sunset BBQ',
          slug: 'sunset-bbq',
          created_by: userId,
        }),
      );
    });

    it('toggles RSVP delegating to repository toggleRow', async () => {
      mockRepository.toggleRow.mockResolvedValueOnce({ active: true });
      const res = await service.toggleEventRsvp(
        eventId,
        '+905551234567',
        userId,
      );
      expect(res).toEqual({ going: true });
      expect(mockRepository.toggleRow).toHaveBeenCalledWith(
        'forum_event_rsvps',
        'event_id',
        eventId,
        userId,
        { contact_phone: '+905551234567' },
      );
    });
  });
});

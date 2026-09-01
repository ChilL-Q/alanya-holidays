import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ForumEventService } from './forum-event.service';
import { ForumRepository } from '../forum.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { BusinessApplicationsService } from '../../business-applications/business-applications.service';

describe('ForumEventService', () => {
  let service: ForumEventService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRoles: Record<string, jest.Mock>;
  let mockBusinessApplications: { hasApprovedBusinessAccount: jest.Mock };

  const userId = '11111111-1111-4111-a111-111111111111';
  const eventId = '22222222-2222-4222-a222-222222222222';

  beforeEach(async () => {
    mockRepository = {
      getEvents: jest.fn().mockResolvedValue([]),
      getEventBySlug: jest.fn(),
      getEventSlugs: jest.fn().mockResolvedValue([]),
      getEventOwnership: jest.fn(),
      insertEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn().mockResolvedValue(true),
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
    mockBusinessApplications = {
      hasApprovedBusinessAccount: jest.fn().mockResolvedValue(true),
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
        {
          provide: BusinessApplicationsService,
          useValue: mockBusinessApplications,
        },
      ],
    }).compile();

    service = module.get<ForumEventService>(ForumEventService);
  });

  describe('Events management', () => {
    it('denies event list, create, update, and delete to an ordinary authenticated user', async () => {
      mockUserRoles.getRole.mockResolvedValue('user');
      mockBusinessApplications.hasApprovedBusinessAccount.mockResolvedValue(
        false,
      );

      await expect(service.getMyForumEvents(userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.createForumEvent(
          { title: 'Unauthorized Event', event_date: '2026-09-01' },
          userId,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateForumEvent(eventId, { title: 'Unauthorized' }, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(service.deleteForumEvent(eventId, userId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockRepository.getEvents).not.toHaveBeenCalled();
      expect(mockRepository.insertEvent).not.toHaveBeenCalled();
      expect(mockRepository.getEventOwnership).not.toHaveBeenCalled();
      expect(mockRepository.updateEvent).not.toHaveBeenCalled();
      expect(mockRepository.deleteEvent).not.toHaveBeenCalled();
    });

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
          is_published: true,
        }),
      );
    });

    it('forces merchant ownership when an authenticated user creates an event', async () => {
      mockUserRoles.getRole.mockResolvedValueOnce('user');
      mockRepository.insertEvent.mockResolvedValueOnce({ id: eventId });

      await service.createForumEvent(
        {
          title: 'Merchant Meetup',
          event_date: '2026-09-02',
          host_id: 'forged-owner',
          is_published: true,
        },
        userId,
      );

      expect(mockRepository.insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          host_id: userId,
          created_by: userId,
          is_published: false,
        }),
      );
    });

    it('allows the event owner to edit but rejects a forged event id', async () => {
      mockUserRoles.getRole.mockResolvedValue('user');
      mockRepository.getEventOwnership
        .mockResolvedValueOnce({
          host_id: userId,
          created_by: userId,
          is_published: false,
        })
        .mockResolvedValueOnce({
          host_id: 'another-user',
          created_by: 'another-user',
          is_published: false,
        });
      mockRepository.updateEvent.mockResolvedValueOnce({
        id: eventId,
        title: 'Updated',
      });

      await expect(
        service.updateForumEvent(eventId, { title: 'Updated' }, userId),
      ).resolves.toEqual({ id: eventId, title: 'Updated' });
      expect(mockRepository.updateEvent).toHaveBeenCalledWith(
        eventId,
        { title: 'Updated' },
        userId,
      );
      await expect(
        service.updateForumEvent(eventId, { title: 'Forged' }, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects merchant publication and mutations of a published event', async () => {
      mockUserRoles.getRole.mockResolvedValue('user');
      mockRepository.getEventOwnership
        .mockResolvedValueOnce({
          host_id: userId,
          created_by: userId,
          is_published: false,
        })
        .mockResolvedValueOnce({
          host_id: userId,
          created_by: userId,
          is_published: true,
        })
        .mockResolvedValueOnce({
          host_id: userId,
          created_by: userId,
          is_published: true,
        });

      await expect(
        service.updateForumEvent(eventId, { is_published: true }, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateForumEvent(eventId, { title: 'Published edit' }, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(service.deleteForumEvent(eventId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRepository.updateEvent).not.toHaveBeenCalled();
      expect(mockRepository.deleteEvent).not.toHaveBeenCalled();
    });

    it('loads draft and published events scoped to the authenticated owner', async () => {
      mockRepository.getEvents.mockResolvedValueOnce([
        { id: eventId, host_id: userId, is_published: false },
        {
          id: 'published-event',
          created_by: userId,
          is_published: true,
        },
      ]);

      await expect(service.getMyForumEvents(userId)).resolves.toEqual([
        { id: eventId, host_id: userId, is_published: false },
        {
          id: 'published-event',
          created_by: userId,
          is_published: true,
        },
      ]);
      expect(mockRepository.getEvents).toHaveBeenCalledWith(
        { ownerId: userId, includeUnpublished: true, limit: 100 },
        expect.any(String),
      );
    });

    it('never returns an unpublished event to another user', async () => {
      mockRepository.getEventBySlug.mockResolvedValueOnce({
        id: eventId,
        slug: 'private-event',
        is_published: false,
        host_id: 'another-user',
        created_by: 'another-user',
      });
      mockUserRoles.getRole.mockResolvedValueOnce('user');

      await expect(
        service.getForumEvent('private-event', userId),
      ).resolves.toBeNull();
      expect(mockRepository.annotateRsvp).not.toHaveBeenCalled();
    });

    it('hides an owned unpublished event from an ordinary account', async () => {
      mockRepository.getEventBySlug.mockResolvedValueOnce({
        id: eventId,
        slug: 'private-event',
        is_published: false,
        host_id: userId,
        created_by: userId,
      });
      mockUserRoles.getRole.mockResolvedValueOnce('user');
      mockBusinessApplications.hasApprovedBusinessAccount.mockResolvedValueOnce(
        false,
      );

      await expect(
        service.getForumEvent('private-event', userId),
      ).resolves.toBeNull();
      expect(mockRepository.annotateRsvp).not.toHaveBeenCalled();
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

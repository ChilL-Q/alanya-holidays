import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateForumEventDto } from './forum-events.dto';

describe('CreateForumEventDto validation', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const meta = { type: 'body' as const, metatype: CreateForumEventDto };
  const valid = {
    title: 'Sunset Sports Meetup',
    event_date: '2026-09-01T18:00:00Z',
    category_id: '11111111-2222-4333-8444-555555555555',
  };

  it('accepts a UUID category_id', async () => {
    await expect(pipe.transform(valid, meta)).resolves.toMatchObject(valid);
  });

  it('rejects a category slug before the event service is called', async () => {
    await expect(
      pipe.transform({ ...valid, category_id: 'events-sports' }, meta),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

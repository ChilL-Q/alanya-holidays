import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ConversationMessagesQueryDto,
  ConversationsQueryDto,
} from './messages-pagination-query.dto';

describe('message pagination query DTOs', () => {
  it('transforms valid conversation pagination strings', async () => {
    const dto = plainToInstance(ConversationsQueryDto, {
      limit: '50',
      offset: '10',
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto).toEqual(expect.objectContaining({ limit: 50, offset: 10 }));
  });

  it('rejects conversations above the bound', async () => {
    const dto = plainToInstance(ConversationsQueryDto, { limit: '51' });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(['limit']);
  });

  it('defaults conversation messages to a bounded first page', async () => {
    const dto = plainToInstance(ConversationMessagesQueryDto, {});

    expect(await validate(dto)).toEqual([]);
    expect(dto).toEqual(expect.objectContaining({ limit: 50, offset: 0 }));
  });

  it.each([
    [{ limit: '51' }, 'limit'],
    [{ limit: '0' }, 'limit'],
    [{ offset: '-1' }, 'offset'],
    [{ offset: '1.5' }, 'offset'],
  ])('rejects invalid message pagination %j', async (input, property) => {
    const dto = plainToInstance(ConversationMessagesQueryDto, input);

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain(property);
  });
});

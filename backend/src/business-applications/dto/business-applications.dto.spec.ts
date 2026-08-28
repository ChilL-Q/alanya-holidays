import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateBusinessApplicationDto } from './create-business-application.dto';
import { RejectBusinessApplicationDto } from './reject-business-application.dto';
import { AdminBusinessApplicationsQueryDto } from './admin-business-applications-query.dto';

describe('business application DTOs', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const transform = <T>(
    value: unknown,
    metatype: new () => T,
    type: 'body' | 'query' = 'body',
  ) => pipe.transform(value, { type, metatype });

  it('accepts the concrete submission fields and strips overposting fields', async () => {
    const result = await transform(
      {
        accountType: 'seller',
        businessName: 'Alanya Crafts',
        contactEmail: 'owner@example.com',
        contactPhone: '+90 555 000 0000',
        website: 'https://example.com',
        userId: 'attacker',
        status: 'approved',
        role: 'admin',
      },
      CreateBusinessApplicationDto,
    );

    expect(result).toEqual({
      accountType: 'seller',
      businessName: 'Alanya Crafts',
      contactEmail: 'owner@example.com',
      contactPhone: '+90 555 000 0000',
      website: 'https://example.com',
    });
  });

  it('trims required fields and converts blank optional fields to undefined before validation', async () => {
    await expect(
      transform(
        {
          accountType: 'seller',
          businessName: '  Alanya Crafts  ',
          contactEmail: '  owner@example.com  ',
          contactPhone: '   ',
          website: '\t ',
        },
        CreateBusinessApplicationDto,
      ),
    ).resolves.toEqual({
      accountType: 'seller',
      businessName: 'Alanya Crafts',
      contactEmail: 'owner@example.com',
      contactPhone: undefined,
      website: undefined,
    });
  });

  it('validates business name and optional phone bounds after trimming', async () => {
    await expect(
      transform(
        {
          accountType: 'seller',
          businessName: `  ${'x'.repeat(120)}  `,
          contactEmail: ' owner@example.com ',
          contactPhone: ' 1234567 ',
        },
        CreateBusinessApplicationDto,
      ),
    ).resolves.toMatchObject({
      businessName: 'x'.repeat(120),
      contactPhone: '1234567',
    });

    await expect(
      transform(
        {
          accountType: 'seller',
          businessName: ' x ',
          contactEmail: ' owner@example.com ',
        },
        CreateBusinessApplicationDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      transform(
        {
          accountType: 'seller',
          businessName: ` ${'x'.repeat(121)} `,
          contactEmail: ' owner@example.com ',
        },
        CreateBusinessApplicationDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      transform(
        {
          accountType: 'seller',
          businessName: 'Valid Business',
          contactEmail: ' owner@example.com ',
          contactPhone: ' 123456 ',
        },
        CreateBusinessApplicationDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsupported account types and malformed contact details', async () => {
    await expect(
      transform(
        {
          accountType: 'admin',
          businessName: 'X',
          contactEmail: 'not-email',
          website: 'javascript:alert(1)',
        },
        CreateBusinessApplicationDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bounds rejection reasons', async () => {
    await expect(
      transform({ reason: 'short' }, RejectBusinessApplicationDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      transform({ reason: 'x'.repeat(1001) }, RejectBusinessApplicationDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transforms and bounds admin pagination', async () => {
    await expect(
      transform(
        { page: '2', limit: '100' },
        AdminBusinessApplicationsQueryDto,
        'query',
      ),
    ).resolves.toMatchObject({ page: 2, limit: 100 });
    await expect(
      transform({ limit: '101' }, AdminBusinessApplicationsQueryDto, 'query'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

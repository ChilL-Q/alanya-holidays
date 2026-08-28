import { validate } from 'class-validator';
import { VerifyClaimDto } from './verify-claim.dto';

describe('VerifyClaimDto', () => {
  it.each([
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    '123e4567-e89b-42d3-a456-426614174000',
  ])('accepts supported verification token format %s', async (token) => {
    const dto = Object.assign(new VerifyClaimDto(), { token });

    expect(await validate(dto)).toEqual([]);
  });

  it.each(['', 'short', 'token with spaces', '123e4567-e89b-12d3-a456'])(
    'rejects malformed token %s',
    async (token) => {
      const dto = Object.assign(new VerifyClaimDto(), { token });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('token');
    },
  );
});

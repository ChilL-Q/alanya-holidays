import { IsString, Matches } from 'class-validator';

const CLAIM_VERIFICATION_TOKEN_RE =
  /^(?:[A-Za-z0-9_-]{43}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export class VerifyClaimDto {
  @IsString()
  @Matches(CLAIM_VERIFICATION_TOKEN_RE, {
    message: 'token must be a valid claim verification token',
  })
  token!: string;
}

import { DomainException } from './domain.exception';

export class ForbiddenDomainException extends DomainException {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;

  constructor(
    message = 'You do not have permission to perform this action.',
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

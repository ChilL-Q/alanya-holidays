import { DomainException } from './domain.exception';

export class InvalidStatusTransitionException extends DomainException {
  readonly code = 'INVALID_STATUS_TRANSITION';
  readonly httpStatus = 400;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

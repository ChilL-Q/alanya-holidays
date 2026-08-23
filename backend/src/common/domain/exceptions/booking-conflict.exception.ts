import { DomainException } from './domain.exception';

export class BookingConflictException extends DomainException {
  readonly code = 'BOOKING_CONFLICT';
  readonly httpStatus = 409;

  constructor(
    message = 'The requested booking dates conflict with an existing reservation.',
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

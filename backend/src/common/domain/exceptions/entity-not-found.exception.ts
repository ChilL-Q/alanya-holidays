import { DomainException } from './domain.exception';

export class EntityNotFoundException extends DomainException {
  readonly code = 'ENTITY_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(
    entityName: string,
    id?: string,
    details?: Record<string, unknown>,
  ) {
    super(
      id
        ? `${entityName} with id "${id}" was not found.`
        : `${entityName} was not found.`,
      details,
    );
  }
}

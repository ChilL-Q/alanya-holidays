export class DatabaseException extends Error {
  readonly code = 'DATABASE_ERROR';

  constructor(
    public readonly internalMessage: string,
    public readonly originalError?: unknown,
    public readonly dbCode?: string,
  ) {
    super('A database operation failed.');
    this.name = 'DatabaseException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

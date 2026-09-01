import { GlobalHttpExceptionFilter, SentrySdk } from './http-exception.filter';
import {
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  EntityNotFoundException,
  BookingConflictException,
  InvalidStatusTransitionException,
  ForbiddenDomainException,
  DatabaseException,
} from '../domain/exceptions';

interface FilterErrorResponse {
  success: boolean;
  error: {
    statusCode: number;
    code: string;
    message: string | string[];
    path: string;
    timestamp: string;
  };
}

interface MockScope {
  tags: Record<string, string>;
  extras: Record<string, unknown>;
  user?: { id?: string; email?: string };
  setTag: (k: string, v: string) => void;
  setExtra: (k: string, v: unknown) => void;
  setUser: (u: { id?: string; email?: string }) => void;
}

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;
  let lastStatus: number | null = null;
  let lastJsonPayload: FilterErrorResponse | null = null;
  let mockResponse: Response;
  let mockRequest: {
    url: string;
    method: string;
    user?: { id?: string; sub?: string; email?: string };
  };
  let mockArgumentsHost: ArgumentsHost;
  let mockSentry: SentrySdk;
  let captureExceptionMock: jest.Mock<string | void, [unknown]>;
  let withScopeMock: jest.Mock<void, [(scope: MockScope) => void]>;
  let mockScope: MockScope;
  let setTagMock: jest.Mock<void, [string, string]>;
  let setExtraMock: jest.Mock<void, [string, unknown]>;
  let setUserMock: jest.Mock<void, [{ id?: string; email?: string }]>;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SENTRY_DSN;
    lastStatus = null;
    lastJsonPayload = null;

    setTagMock = jest.fn((k: string, v: string) => {
      mockScope.tags[k] = v;
    });
    setExtraMock = jest.fn((k: string, v: unknown) => {
      mockScope.extras[k] = v;
    });
    setUserMock = jest.fn((u: { id?: string; email?: string }) => {
      mockScope.user = u;
    });

    mockScope = {
      tags: {},
      extras: {},
      setTag: setTagMock,
      setExtra: setExtraMock,
      setUser: setUserMock,
    };

    captureExceptionMock = jest.fn<string | void, [unknown]>(
      (_err: unknown) => 'mock-event-id',
    );
    withScopeMock = jest.fn((cb: (scope: MockScope) => void) => {
      cb(mockScope);
    });

    mockSentry = {
      withScope: withScopeMock,
      captureException: captureExceptionMock,
    };

    filter = new GlobalHttpExceptionFilter(mockSentry);

    const resObj = {
      status: (code: number) => {
        lastStatus = code;
        return resObj;
      },
      json: (payload: FilterErrorResponse) => {
        lastJsonPayload = payload;
        return resObj;
      },
    };
    mockResponse = resObj as unknown as Response;

    mockRequest = {
      url: '/api/test',
      method: 'POST',
      user: { id: 'user-123', email: 'test@example.com' },
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest as unknown as Request,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should catch 4xx HttpException and format JSON response without reporting to Sentry', () => {
    process.env.SENTRY_DSN = 'https://mock@sentry.io/123';
    const exception = new BadRequestException('Invalid payload');

    filter.catch(exception, mockArgumentsHost);

    expect(lastStatus).toBe(HttpStatus.BAD_REQUEST);
    expect(lastJsonPayload).not.toBeNull();
    expect(lastJsonPayload?.success).toBe(false);
    expect(lastJsonPayload?.error.statusCode).toBe(400);
    expect(lastJsonPayload?.error.message).toBe('Invalid payload');
    expect(lastJsonPayload?.error.path).toBe('/api/test');
    expect(captureExceptionMock).not.toHaveBeenCalled();
    expect(withScopeMock).not.toHaveBeenCalled();
  });

  it('should catch 5xx HttpException and capture in Sentry with route and user metadata when SENTRY_DSN is configured', () => {
    process.env.SENTRY_DSN = 'https://mock@sentry.io/123';
    const exception = new InternalServerErrorException('Database failure');

    filter.catch(exception, mockArgumentsHost);

    expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(lastJsonPayload).not.toBeNull();
    expect(lastJsonPayload?.success).toBe(false);
    expect(lastJsonPayload?.error.statusCode).toBe(500);
    expect(withScopeMock).toHaveBeenCalledTimes(1);
    expect(setTagMock).toHaveBeenCalledWith('path', '/api/test');
    expect(setTagMock).toHaveBeenCalledWith('method', 'POST');
    expect(setExtraMock).toHaveBeenCalledWith('statusCode', 500);
    expect(setUserMock).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'test@example.com',
    });
    expect(captureExceptionMock).toHaveBeenCalledWith(exception);
  });

  it('should catch unhandled runtime Error, log to Logger.error, sanitize 500 message, and capture in Sentry when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'https://mock@sentry.io/123';
    const loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const exception = new Error(
      'SELECT * FROM users WHERE password_hash = "secret"',
    );

    filter.catch(exception, mockArgumentsHost);

    expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(lastJsonPayload?.error.message).toBe(
      'An internal server error occurred. Please try again later.',
    );
    expect(lastJsonPayload?.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Unhandled Exception: SELECT * FROM users WHERE password_hash = "secret"',
      exception.stack,
    );
    expect(captureExceptionMock).toHaveBeenCalledWith(exception);
  });

  it('should gracefully fallback to Logger.error without calling Sentry when SENTRY_DSN is unset', () => {
    delete process.env.SENTRY_DSN;
    const loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const exception = new Error('Database unreachable');

    filter.catch(exception, mockArgumentsHost);

    expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('should handle Sentry capture errors gracefully without throwing', () => {
    process.env.SENTRY_DSN = 'https://mock@sentry.io/123';
    captureExceptionMock.mockImplementationOnce(() => {
      throw new Error('Sentry network failure');
    });

    const exception = new Error('Fatal crash');

    expect(() => {
      filter.catch(exception, mockArgumentsHost);
    }).not.toThrow();

    expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(lastJsonPayload?.success).toBe(false);
  });

  describe('Domain Exception Hierarchy Mapping', () => {
    it('should map EntityNotFoundException to 404 with ENTITY_NOT_FOUND code', () => {
      const exception = new EntityNotFoundException('Booking', 'b-123');

      filter.catch(exception, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.NOT_FOUND);
      expect(lastJsonPayload?.error.code).toBe('ENTITY_NOT_FOUND');
      expect(lastJsonPayload?.error.message).toBe(
        'Booking with id "b-123" was not found.',
      );
      expect(captureExceptionMock).not.toHaveBeenCalled();
    });

    it('should map BookingConflictException to 409 with BOOKING_CONFLICT code', () => {
      const exception = new BookingConflictException();

      filter.catch(exception, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.CONFLICT);
      expect(lastJsonPayload?.error.code).toBe('BOOKING_CONFLICT');
      expect(lastJsonPayload?.error.message).toBe(
        'The requested booking dates conflict with an existing reservation.',
      );
      expect(captureExceptionMock).not.toHaveBeenCalled();
    });

    it('should map InvalidStatusTransitionException to 400 with INVALID_STATUS_TRANSITION code', () => {
      const exception = new InvalidStatusTransitionException(
        'Invalid status transition from "cancelled" to "confirmed"',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.BAD_REQUEST);
      expect(lastJsonPayload?.error.code).toBe('INVALID_STATUS_TRANSITION');
      expect(lastJsonPayload?.error.message).toBe(
        'Invalid status transition from "cancelled" to "confirmed"',
      );
      expect(captureExceptionMock).not.toHaveBeenCalled();
    });

    it('should map ForbiddenDomainException to 403 with FORBIDDEN code', () => {
      const exception = new ForbiddenDomainException(
        'Not authorized to update this booking',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.FORBIDDEN);
      expect(lastJsonPayload?.error.code).toBe('FORBIDDEN');
      expect(lastJsonPayload?.error.message).toBe(
        'Not authorized to update this booking',
      );
      expect(captureExceptionMock).not.toHaveBeenCalled();
    });
  });

  describe('PostgreSQL & Database Error Shielding', () => {
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
    });

    it('should shield unique_violation (23505) and return 409 Conflict', () => {
      const dbErr = new DatabaseException(
        'Key (email)=(test@example.com) already exists in table users',
        null,
        '23505',
      );

      filter.catch(dbErr, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.CONFLICT);
      expect(lastJsonPayload?.error.code).toBe('RESOURCE_ALREADY_EXISTS');
      expect(lastJsonPayload?.error.message).toBe(
        'A record with the specified details already exists.',
      );
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should shield foreign_key_violation (23503) and return 400 Bad Request', () => {
      const rawPostgresErr = {
        code: '23503',
        message:
          'insert or update on table "bookings" violates foreign key constraint "bookings_item_id_fkey"',
      };

      filter.catch(rawPostgresErr, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.BAD_REQUEST);
      expect(lastJsonPayload?.error.code).toBe('FOREIGN_KEY_VIOLATION');
      expect(lastJsonPayload?.error.message).toBe(
        'The referenced entity does not exist.',
      );
    });

    it('should shield check_violation (23514) and return 400 Bad Request', () => {
      const dbErr = new DatabaseException(
        'check constraint violation',
        null,
        '23514',
      );

      filter.catch(dbErr, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.BAD_REQUEST);
      expect(lastJsonPayload?.error.code).toBe('CHECK_VIOLATION');
      expect(lastJsonPayload?.error.message).toBe(
        'The provided data violates business constraints.',
      );
    });

    it('should shield insufficient_privilege / RLS (42501) and return 403 Forbidden', () => {
      const rawPostgresErr = {
        code: '42501',
        message:
          'new row violates row-level security policy for table "properties"',
      };

      filter.catch(rawPostgresErr, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.FORBIDDEN);
      expect(lastJsonPayload?.error.code).toBe('PERMISSION_DENIED');
      expect(lastJsonPayload?.error.message).toBe(
        'You do not have permission to perform this database operation.',
      );
    });

    it('should shield serialization_failure (40001) and return 409 Conflict', () => {
      const dbErr = new DatabaseException(
        'could not serialize access due to read/write dependencies',
        null,
        '40001',
      );

      filter.catch(dbErr, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.CONFLICT);
      expect(lastJsonPayload?.error.code).toBe('CONCURRENCY_CONFLICT');
      expect(lastJsonPayload?.error.message).toBe(
        'A concurrent database conflict occurred. Please retry your request.',
      );
    });

    it('should shield PGRST116 and return 404 Entity Not Found', () => {
      const rawPostgrestErr = {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
      };

      filter.catch(rawPostgrestErr, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.NOT_FOUND);
      expect(lastJsonPayload?.error.code).toBe('ENTITY_NOT_FOUND');
      expect(lastJsonPayload?.error.message).toBe(
        'The requested resource was not found.',
      );
    });

    it('should shield unmapped database errors and return generic 500 without leaking SQL internals', () => {
      process.env.SENTRY_DSN = 'https://mock@sentry.io/123';
      const rawDbErr = {
        code: 'XX000',
        message:
          'Internal DB engine crash: corrupted page 0x44 in table orders',
      };

      filter.catch(rawDbErr, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(lastJsonPayload?.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(lastJsonPayload?.error.message).toBe(
        'An internal server error occurred. Please try again later.',
      );
      expect(captureExceptionMock).toHaveBeenCalledWith(rawDbErr);
    });
  });
});

import { GlobalHttpExceptionFilter, SentrySdk } from './http-exception.filter';
import {
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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

  it('should catch unhandled runtime Error, log to Logger.error, and capture in Sentry when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'https://mock@sentry.io/123';
    const loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    const exception = new Error('Unexpected panic');

    filter.catch(exception, mockArgumentsHost);

    expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(loggerErrorSpy).toHaveBeenCalled();
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
});

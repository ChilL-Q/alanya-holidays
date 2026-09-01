import { GlobalHttpExceptionFilter, SentrySdk } from './http-exception.filter';
import {
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  InternalServerErrorException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
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

describe('GlobalHttpExceptionFilter - Adversarial Sentry & Error Fallback Tests', () => {
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
      url: '/api/v1/checkout/orders',
      method: 'POST',
      user: { id: 'guest-999', email: 'guest@example.com' },
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

  describe('Adversarial 4xx Status Exhaustion (Zero Sentry Reporting)', () => {
    const clientErrors = [
      new BadRequestException('Bad input'),
      new UnauthorizedException('Token expired'),
      new ForbiddenException('Insufficient permissions'),
      new NotFoundException('Product not found'),
      new ConflictException('Resource exists'),
      new UnprocessableEntityException('Validation failed'),
    ];

    clientErrors.forEach((err) => {
      it(`should never report ${err.constructor.name} (${err.getStatus()}) to Sentry`, () => {
        process.env.SENTRY_DSN = 'https://mock@sentry.io/456';
        filter.catch(err, mockArgumentsHost);

        expect(lastStatus).toBe(err.getStatus());
        expect(captureExceptionMock).not.toHaveBeenCalled();
        expect(withScopeMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('Adversarial 5xx Status Exhaustion (100% Sentry Reporting)', () => {
    const serverErrors = [
      new InternalServerErrorException('DB crash'),
      new BadGatewayException('Upstream unreachable'),
      new ServiceUnavailableException('Out of memory'),
      new GatewayTimeoutException('Upstream timeout'),
    ];

    serverErrors.forEach((err) => {
      it(`should report ${err.constructor.name} (${err.getStatus()}) to Sentry with context`, () => {
        process.env.SENTRY_DSN = 'https://mock@sentry.io/456';
        filter.catch(err, mockArgumentsHost);

        expect(lastStatus).toBe(err.getStatus());
        expect(captureExceptionMock).toHaveBeenCalledWith(err);
        expect(setTagMock).toHaveBeenCalledWith(
          'path',
          '/api/v1/checkout/orders',
        );
        expect(setTagMock).toHaveBeenCalledWith('method', 'POST');
        expect(setExtraMock).toHaveBeenCalledWith(
          'statusCode',
          err.getStatus(),
        );
      });
    });
  });

  describe('Adversarial Sentry DSN Edge Cases', () => {
    it('should not call Sentry when SENTRY_DSN is whitespace only', () => {
      process.env.SENTRY_DSN = '    ';
      const exception = new InternalServerErrorException(
        'Error with blank DSN',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(captureExceptionMock).not.toHaveBeenCalled();
    });

    it('should not throw or crash when withScope throws an exception', () => {
      process.env.SENTRY_DSN = 'https://mock@sentry.io/456';
      withScopeMock.mockImplementationOnce(() => {
        throw new Error('Sentry internal error during withScope');
      });

      const exception = new InternalServerErrorException('DB exploded');

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).not.toThrow();

      expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(lastJsonPayload?.success).toBe(false);
      expect(lastJsonPayload?.error?.statusCode).toBe(500);
    });

    it('should handle non-Error primitives thrown in application code', () => {
      process.env.SENTRY_DSN = 'https://mock@sentry.io/456';
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      filter.catch('Unexpected string thrown', mockArgumentsHost);

      expect(lastStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(lastJsonPayload?.success).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Unhandled Unknown Exception',
        'Unexpected string thrown',
      );
      expect(captureExceptionMock).toHaveBeenCalledWith(
        'Unexpected string thrown',
      );
    });
  });
});

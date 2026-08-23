import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException, DatabaseException } from '../domain/exceptions';

export interface SentryScope {
  setTag(key: string, value: string): void;
  setExtra(key: string, value: unknown): void;
  setUser(user: { id?: string; email?: string }): void;
}

export interface SentrySdk {
  withScope(callback: (scope: SentryScope) => void): void;
  captureException(error: unknown): string | void;
}

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    sub?: string;
    email?: string;
  };
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  constructor(private readonly sentry?: SentrySdk) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithUser>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] =
      'An internal server error occurred. Please try again later.';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    // 1. NestJS Standard HttpExceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        const rawMessage = resObj.message;
        if (typeof rawMessage === 'string') {
          message = rawMessage;
        } else if (
          Array.isArray(rawMessage) &&
          rawMessage.every((item): item is string => typeof item === 'string')
        ) {
          message = rawMessage;
        } else {
          message = exception.message;
        }
        errorCode =
          typeof resObj.error === 'string'
            ? resObj.error
            : exception.name || 'HTTP_ERROR';
      } else {
        message = exception.message;
      }
    }
    // 2. Custom Domain Exceptions
    else if (exception instanceof DomainException) {
      status = exception.httpStatus;
      message = exception.message;
      errorCode = exception.code;
    }
    // 3. Database Exceptions & PostgreSQL / PostgREST Error Codes
    else if (this.isDatabaseError(exception)) {
      const dbInfo = this.extractDatabaseErrorInfo(exception);
      this.logger.error(
        `Database Error [${dbInfo.code || 'UNKNOWN'}]: ${dbInfo.internalMessage}`,
        dbInfo.stack,
      );

      const mapping = this.mapDatabaseError(dbInfo.code);
      status = mapping.status;
      message = mapping.message;
      errorCode = mapping.code;
    }
    // 4. Generic Unhandled Runtime Errors
    else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An internal server error occurred. Please try again later.';
      errorCode = 'INTERNAL_SERVER_ERROR';
    }
    // 5. Unknown Non-Error Throwables
    else {
      this.logger.error('Unhandled Unknown Exception', String(exception));
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An internal server error occurred. Please try again later.';
      errorCode = 'INTERNAL_SERVER_ERROR';
    }

    // Capture 5xx server errors and unhandled runtime exceptions in Sentry
    const internalServerThreshold: number = HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= internalServerThreshold) {
      this.captureToSentry(exception, request, status);
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        code: errorCode,
        message: message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private isDatabaseError(err: unknown): boolean {
    if (err instanceof DatabaseException) return true;
    if (typeof err === 'object' && err !== null) {
      const obj = err as Record<string, unknown>;
      return (
        typeof obj.code === 'string' &&
        (obj.code.startsWith('23') ||
          obj.code.startsWith('42') ||
          obj.code.startsWith('PGRST') ||
          obj.code === '40001')
      );
    }
    return false;
  }

  private extractDatabaseErrorInfo(err: unknown): {
    code?: string;
    internalMessage: string;
    stack?: string;
  } {
    if (err instanceof DatabaseException) {
      return {
        code: err.dbCode,
        internalMessage: err.internalMessage,
        stack: err.stack,
      };
    }
    const errorObj = err as Record<string, unknown>;
    return {
      code: typeof errorObj.code === 'string' ? errorObj.code : undefined,
      internalMessage:
        typeof errorObj.message === 'string' ? errorObj.message : String(err),
      stack: typeof errorObj.stack === 'string' ? errorObj.stack : undefined,
    };
  }

  private mapDatabaseError(code?: string): {
    status: number;
    code: string;
    message: string;
  } {
    switch (code) {
      case '23505': // unique_violation
        return {
          status: HttpStatus.CONFLICT,
          code: 'RESOURCE_ALREADY_EXISTS',
          message: 'A record with the specified details already exists.',
        };
      case '23503': // foreign_key_violation
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'The referenced entity does not exist.',
        };
      case '23514': // check_violation
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'CHECK_VIOLATION',
          message: 'The provided data violates business constraints.',
        };
      case '42501': // insufficient_privilege / RLS
        return {
          status: HttpStatus.FORBIDDEN,
          code: 'PERMISSION_DENIED',
          message:
            'You do not have permission to perform this database operation.',
        };
      case '40001': // serialization_failure
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONCURRENCY_CONFLICT',
          message:
            'A concurrent database conflict occurred. Please retry your request.',
        };
      case 'PGRST116': // Single row expected but none returned
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'ENTITY_NOT_FOUND',
          message: 'The requested resource was not found.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: 'A database operation failed. Please try again later.',
        };
    }
  }

  private captureToSentry(
    exception: unknown,
    request: RequestWithUser,
    status: number,
  ): void {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn || dsn.trim() === '') {
      return;
    }

    try {
      const sentryClient =
        this.sentry || (globalThis as unknown as { Sentry?: SentrySdk }).Sentry;

      if (sentryClient && typeof sentryClient.withScope === 'function') {
        sentryClient.withScope((scope: SentryScope) => {
          scope.setTag('path', request.url || 'unknown');
          scope.setTag('method', request.method || 'unknown');
          scope.setExtra('statusCode', status);
          scope.setExtra('timestamp', new Date().toISOString());

          if (request.user) {
            scope.setUser({
              id: request.user.id || request.user.sub,
              email: request.user.email,
            });
          }

          sentryClient.captureException(exception);
        });
      }
    } catch (err) {
      this.logger.warn(
        `Failed to report exception to Sentry: ${(err as Error).message}`,
      );
    }
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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

    const isHttpException = exception instanceof HttpException;
    const status: number = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (isHttpException) {
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
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unhandled Unknown Exception', String(exception));
    }

    // Capture 5xx server errors and unhandled runtime exceptions in Sentry
    const internalServerThreshold: number = HttpStatus.INTERNAL_SERVER_ERROR;
    if (!isHttpException || status >= internalServerThreshold) {
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

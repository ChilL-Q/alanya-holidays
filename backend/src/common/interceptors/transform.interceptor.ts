import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T> | T> {
    return next.handle().pipe(
      map((data: T): ResponseEnvelope<T> | T => {
        // If data is null/undefined or primitive/object not already formatted with success key
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          typeof (data as Record<string, unknown>).success === 'boolean'
        ) {
          return data;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

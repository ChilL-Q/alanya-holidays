import { TransformInterceptor } from './transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    mockExecutionContext = {} as ExecutionContext;
  });

  it('should wrap response data in envelope', (done) => {
    mockCallHandler = {
      handle: () => of({ message: 'hello' }),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual(
          expect.objectContaining({
            success: true,
            data: { message: 'hello' },
          }),
        );
        done();
      },
    });
  });

  it('should leave pre-formatted response envelope untouched', (done) => {
    const existing = { success: true, data: [1, 2, 3] };
    mockCallHandler = {
      handle: () => of(existing),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual(existing);
        done();
      },
    });
  });
});

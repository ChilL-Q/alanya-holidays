import { GlobalHttpExceptionFilter } from './http-exception.filter';
import { HttpStatus, BadRequestException, ArgumentsHost } from '@nestjs/common';
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

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;
  let mockResponse: {
    status: jest.Mock<unknown, [number]>;
    json: jest.Mock<unknown, [FilterErrorResponse]>;
  };
  let mockRequest: {
    url: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalHttpExceptionFilter();
    mockResponse = {
      status: jest.fn<unknown, [number]>().mockReturnThis(),
      json: jest.fn<unknown, [FilterErrorResponse]>().mockReturnThis(),
    };
    mockRequest = {
      url: '/api/test',
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as unknown as Response,
        getRequest: () => mockRequest as unknown as Request,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should catch HttpException and format JSON response correctly', () => {
    const exception = new BadRequestException('Invalid payload');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const jsonPayload = mockResponse.json.mock.calls[0][0];
    expect(jsonPayload.success).toBe(false);
    expect(jsonPayload.error.statusCode).toBe(400);
    expect(jsonPayload.error.message).toBe('Invalid payload');
    expect(jsonPayload.error.path).toBe('/api/test');
  });

  it('should catch unknown Error and return 500 status', () => {
    const exception = new Error('Database connection failed');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const jsonPayload = mockResponse.json.mock.calls[0][0];
    expect(jsonPayload.success).toBe(false);
    expect(jsonPayload.error.statusCode).toBe(500);
    expect(jsonPayload.error.message).toBe('Database connection failed');
    expect(jsonPayload.error.path).toBe('/api/test');
  });
});

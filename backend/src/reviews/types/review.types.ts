import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface PaginatedReviewsResponse {
  data: Record<string, unknown>[];
  total: number;
}

export interface ReviewOperationResult {
  success: boolean;
}

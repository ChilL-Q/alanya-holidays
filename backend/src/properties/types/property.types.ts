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

export interface ICalSyncResult {
  feedId: string;
  success: boolean;
  count?: unknown;
  error?: unknown;
}

export interface PropertiesListResponse {
  data: Record<string, unknown>[];
  count?: number | null;
  total?: number | null;
}

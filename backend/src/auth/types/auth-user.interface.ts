export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  aud?: string;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

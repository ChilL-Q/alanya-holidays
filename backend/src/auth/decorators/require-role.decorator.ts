import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'required_role';

/**
 * Declares the minimum role required on a route (audit 1.2).
 * Enforced by RolesGuard; the role is resolved from the DB, never from
 * client-supplied token claims.
 */
export const RequireRole = (...roles: string[]) => SetMetadata(ROLE_KEY, roles);

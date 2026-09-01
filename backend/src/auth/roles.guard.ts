import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLE_KEY } from './decorators/require-role.decorator';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

interface RequestWithUser extends Request {
  user?: { id?: string };
}

/**
 * Centralised role-based authorization (audit 1.2).
 * Replaces manual `getUserRole() !== 'admin'` checks scattered through
 * services. Fail-closed: missing user or unresolvable role denies access.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRolesRepository: UserRolesRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(ROLE_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request?.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Not authorized');
    }

    const role = await this.userRolesRepository.getRole(userId);
    if (!role || !requiredRoles.includes(role)) {
      throw new UnauthorizedException('Not authorized');
    }

    return true;
  }
}

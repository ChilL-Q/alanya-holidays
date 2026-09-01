import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types/auth-user.interface';

interface RequestWithUser {
  user?: AuthUser;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | string | undefined, ctx: ExecutionContext) => {
    if (!ctx || typeof ctx.switchToHttp !== 'function') {
      return undefined;
    }
    const http = ctx.switchToHttp();
    if (!http || typeof http.getRequest !== 'function') {
      return undefined;
    }
    const request = http.getRequest<RequestWithUser | undefined>();
    const user = request?.user;

    if (!user) {
      return undefined;
    }

    return data !== undefined && data !== ''
      ? (user as Record<string, unknown>)[data]
      : user;
  },
);

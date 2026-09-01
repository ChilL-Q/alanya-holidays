import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return this.authTokenService.authenticateRequest(context, {
      optional: false,
    });
  }
}

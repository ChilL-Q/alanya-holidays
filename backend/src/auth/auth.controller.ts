import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenService } from './auth-token.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authTokenService: AuthTokenService) {}

  /**
   * Purges the server-side token cache on logout (audit 1.6) so the session
   * stops authenticating immediately instead of living up to the cache TTL.
   */
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() request: Request): Promise<{ success: true }> {
    const token = this.authTokenService.extractTokenFromHeader(request);
    if (token) {
      await this.authTokenService.invalidateToken(token);
    }
    return { success: true };
  }
}

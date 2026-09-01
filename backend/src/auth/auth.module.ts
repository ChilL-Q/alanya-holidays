import { Module, Global } from '@nestjs/common';
import { RedisModule } from '../common/redis/redis.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { AuthTokenService } from './auth-token.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { OptionalAuthGuard } from './optional-auth.guard';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  imports: [RedisModule, SupabaseModule],
  controllers: [AuthController],
  providers: [
    AuthTokenService,
    AuthGuard,
    OptionalAuthGuard,
    RolesGuard,
    UserRolesRepository,
  ],
  exports: [
    AuthTokenService,
    AuthGuard,
    OptionalAuthGuard,
    RolesGuard,
    UserRolesRepository,
  ],
})
export class AuthModule {}

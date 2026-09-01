import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminController } from './users-admin.controller';
import { UsersRepository } from './users.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [UsersService, UsersRepository],
  // Admin controller MUST stay first: UsersController declares routes that
  // would otherwise shadow GET /users/admin (guarded handler never runs).
  controllers: [UsersAdminController, UsersController],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}

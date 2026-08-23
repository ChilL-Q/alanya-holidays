import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminController } from './users-admin.controller';
import { UsersRepository } from './users.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController, UsersAdminController],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}

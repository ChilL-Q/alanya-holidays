import { Global, Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { UserRolesRepository } from './auth/user-roles.repository';

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [UserRolesRepository],
  exports: [UserRolesRepository],
})
export class CommonModule {}

import { Injectable } from '@nestjs/common';
import { SupabaseServicesRepository } from './infrastructure/repositories/supabase-services.repository';

/**
 * Backward compatibility wrapper around SupabaseServicesRepository.
 */
@Injectable()
export class ServicesRepository extends SupabaseServicesRepository {}

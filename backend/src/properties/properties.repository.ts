import { Injectable } from '@nestjs/common';
import { SupabasePropertiesRepository } from './infrastructure/repositories/supabase-properties.repository';

/**
 * Backward compatibility wrapper around SupabasePropertiesRepository.
 */
@Injectable()
export class PropertiesRepository extends SupabasePropertiesRepository {}

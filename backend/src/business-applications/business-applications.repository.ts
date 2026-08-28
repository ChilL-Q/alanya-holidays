import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBusinessApplicationDto } from './dto/create-business-application.dto';
import {
  BusinessApplication,
  BusinessApplicationsPage,
  BusinessApplicationAccountType,
} from './business-applications.types';

const APPLICATION_PROJECTION =
  'id,applicant_user_id,account_type,business_name,contact_email,contact_phone,website,status,rejection_reason,reviewed_by,reviewed_at,created_at,updated_at';

interface PersistenceError {
  code?: string;
  message: string;
}

interface QueryResult<T> {
  data: T;
  error: PersistenceError | null;
  count?: number | null;
}

interface ApplicationRow {
  id: string;
  applicant_user_id: string;
  account_type: BusinessApplicationAccountType;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface QueryBuilder {
  select(columns: string, options?: { count: 'exact' }): QueryBuilder;
  insert(values: Record<string, unknown>): QueryBuilder;
  eq(column: string, value: string): QueryBuilder;
  order(column: string, options: { ascending: boolean }): QueryBuilder;
  range(from: number, to: number): Promise<QueryResult<ApplicationRow[]>>;
  limit(count: number): QueryBuilder;
  maybeSingle(): Promise<QueryResult<ApplicationRow | null>>;
  single(): Promise<QueryResult<ApplicationRow | null>>;
}

interface BusinessApplicationsClient {
  from(table: string): QueryBuilder;
  rpc(
    name: string,
    params: Record<string, string | null>,
  ): Promise<QueryResult<ApplicationRow | ApplicationRow[] | null>>;
}

export class BusinessApplicationsPersistenceException extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

@Injectable()
export class BusinessApplicationsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client(): BusinessApplicationsClient {
    return this.supabaseService.getClient() as unknown as BusinessApplicationsClient;
  }

  async findMine(userId: string): Promise<BusinessApplication | null> {
    const { data, error } = await this.client
      .from('business_account_applications')
      .select(APPLICATION_PROJECTION)
      .eq('applicant_user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) this.throwPersistenceError(error);
    return data ? this.toDomain(data) : null;
  }

  async create(
    userId: string,
    dto: CreateBusinessApplicationDto,
  ): Promise<BusinessApplication> {
    const optional = (value?: string) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    };
    const payload = {
      applicant_user_id: userId,
      account_type: dto.accountType,
      business_name: dto.businessName.trim(),
      contact_email: dto.contactEmail.trim(),
      contact_phone: optional(dto.contactPhone),
      website: optional(dto.website),
      status: 'pending',
    };
    const { data, error } = await this.client
      .from('business_account_applications')
      .insert(payload)
      .select(APPLICATION_PROJECTION)
      .single();

    if (error) this.throwPersistenceError(error);
    if (!data) {
      throw new BusinessApplicationsPersistenceException(
        'Application insert returned no row',
      );
    }
    return this.toDomain(data);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<BusinessApplicationsPage> {
    const from = (page - 1) * limit;
    const { data, error, count } = await this.client
      .from('business_account_applications')
      .select(APPLICATION_PROJECTION, { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) this.throwPersistenceError(error);
    return {
      items: (data ?? []).map((row) => this.toDomain(row)),
      page,
      limit,
      total: count ?? 0,
    };
  }

  approve(id: string, reviewerId: string): Promise<BusinessApplication> {
    return this.review('transition_business_account_application', {
      p_application_id: id,
      p_status: 'approved',
      p_reviewed_by: reviewerId,
      p_rejection_reason: null,
    });
  }

  reject(
    id: string,
    reviewerId: string,
    reason: string,
  ): Promise<BusinessApplication> {
    return this.review('transition_business_account_application', {
      p_application_id: id,
      p_status: 'rejected',
      p_reviewed_by: reviewerId,
      p_rejection_reason: reason,
    });
  }

  private async review(
    rpc: string,
    params: Record<string, string | null>,
  ): Promise<BusinessApplication> {
    const { data, error } = await this.client.rpc(rpc, params);
    if (error) this.throwPersistenceError(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new BusinessApplicationsPersistenceException(
        'Application review returned no row',
      );
    }
    return this.toDomain(row);
  }

  private throwPersistenceError(error: PersistenceError): never {
    throw new BusinessApplicationsPersistenceException(
      error.message,
      error.code,
    );
  }

  private toDomain(row: ApplicationRow): BusinessApplication {
    return {
      id: row.id,
      userId: row.applicant_user_id,
      accountType: row.account_type,
      businessName: row.business_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      website: row.website,
      status: row.status,
      rejectionReason: row.rejection_reason,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

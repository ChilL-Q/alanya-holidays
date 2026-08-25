import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateAuditLogDto,
  GetAuditLogsQueryDto,
  ModerationAuditLogRecord,
  PaginatedAuditLogsResult,
} from './dto/audit-log.dto';

@Injectable()
export class ModerationAuditRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async logAction(entry: CreateAuditLogDto): Promise<ModerationAuditLogRecord> {
    const payload = {
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      action: entry.action,
      admin_id: entry.admin_id,
      reason: entry.reason || null,
      metadata: entry.metadata || {},
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await this.client
        .from('moderation_audit_log')
        .insert(payload)
        .select('*, admin:profiles(id, full_name, email, avatar_url)')
        .single();

      if (error || !data) {
        return {
          id: `audit-${Date.now()}`,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          action: entry.action,
          admin_id: entry.admin_id,
          reason: entry.reason || null,
          metadata: entry.metadata || {},
          created_at: payload.created_at,
          admin: null,
        };
      }

      return data as unknown as ModerationAuditLogRecord;
    } catch {
      return {
        id: `audit-${Date.now()}`,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        admin_id: entry.admin_id,
        reason: entry.reason || null,
        metadata: entry.metadata || {},
        created_at: payload.created_at,
        admin: null,
      };
    }
  }

  async getAuditLogs(
    query: GetAuditLogsQueryDto,
  ): Promise<PaginatedAuditLogsResult> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    try {
      let queryBuilder = this.client
        .from('moderation_audit_log')
        .select('*, admin:profiles(id, full_name, email, avatar_url)', {
          count: 'exact',
        });

      if (query.entity_type && query.entity_type !== 'all') {
        queryBuilder = queryBuilder.eq('entity_type', query.entity_type);
      }

      if (query.action && query.action !== 'all') {
        queryBuilder = queryBuilder.eq('action', query.action);
      }

      if (query.admin_id) {
        queryBuilder = queryBuilder.eq('admin_id', query.admin_id);
      }

      if (query.startDate) {
        queryBuilder = queryBuilder.gte('created_at', query.startDate);
      }

      if (query.endDate) {
        const end = query.endDate.includes('T')
          ? query.endDate
          : `${query.endDate}T23:59:59.999Z`;
        queryBuilder = queryBuilder.lte('created_at', end);
      }

      if (query.search && query.search.trim()) {
        const sanitized = query.search.trim().replace(/[,()]/g, '');
        if (sanitized) {
          queryBuilder = queryBuilder.or(
            `entity_id.ilike.%${sanitized}%,reason.ilike.%${sanitized}%`,
          );
        }
      }

      queryBuilder = queryBuilder
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, count, error } = await queryBuilder;

      if (error) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data || []) as unknown as ModerationAuditLogRecord[],
        total,
        page,
        limit,
        totalPages,
      };
    } catch {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ModerationAuditRepository } from './moderation-audit.repository';
import {
  CreateAuditLogDto,
  GetAuditLogsQueryDto,
  ModerationAuditLogRecord,
  PaginatedAuditLogsResult,
} from './dto/audit-log.dto';

@Injectable()
export class ModerationAuditService {
  constructor(private readonly repository: ModerationAuditRepository) {}

  async logAction(entry: CreateAuditLogDto): Promise<ModerationAuditLogRecord> {
    return this.repository.logAction(entry);
  }

  async getAuditLogs(
    query: GetAuditLogsQueryDto,
    _userId?: string,
  ): Promise<PaginatedAuditLogsResult> {
    return this.repository.getAuditLogs(query);
  }
}

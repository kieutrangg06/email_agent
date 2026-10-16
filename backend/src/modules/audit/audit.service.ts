import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface CreateAuditLogDto {
  event_type: string;
  workflow_id?: string;
  description?: string;
  payload_snapshot?: any;
  payload?: any;
  source?: string;
}

@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.ensureAuditTable();
  }

  private async ensureAuditTable(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS system_audit_logs (
          id BIGSERIAL PRIMARY KEY,
          source VARCHAR(50) DEFAULT 'm1-system',
          event_type VARCHAR(100) NOT NULL,
          workflow_id VARCHAR(50),
          description TEXT,
          payload JSONB,
          payload_snapshot JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_system_audit_logs_workflow_id ON system_audit_logs (workflow_id);
        CREATE INDEX IF NOT EXISTS idx_system_audit_logs_event_type ON system_audit_logs (event_type);
        CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at ON system_audit_logs (created_at DESC);
      `);
    } catch (err: any) {
      this.logger.error(`Failed to ensure system_audit_logs table: ${err.message}`, err.stack);
    }
  }

  async createLog(dto: CreateAuditLogDto): Promise<any> {
    await this.ensureAuditTable();

    const eventType = dto.event_type || 'SYSTEM_EVENT';
    const workflowId = dto.workflow_id || null;
    const description = dto.description || '';
    const source = dto.source || 'm1-system';
    
    // Normalize payload snapshot
    const snapshot = dto.payload_snapshot !== undefined 
      ? (typeof dto.payload_snapshot === 'string' ? dto.payload_snapshot : JSON.stringify(dto.payload_snapshot))
      : (dto.payload !== undefined ? (typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload)) : null);

    const payload = dto.payload !== undefined 
      ? (typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload))
      : snapshot;

    const res = await this.db.query(
      `INSERT INTO system_audit_logs (event_type, workflow_id, description, payload_snapshot, payload, source)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
       RETURNING *`,
      [eventType, workflowId, description, snapshot, payload, source],
    );

    return res.rows[0];
  }

  async getLogs(workflowId?: string, eventType?: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    await this.ensureAuditTable();

    let sql = 'SELECT * FROM system_audit_logs WHERE 1=1';
    const params: any[] = [];

    if (workflowId) {
      params.push(workflowId);
      sql += ` AND workflow_id = $${params.length}`;
    }

    if (eventType) {
      params.push(eventType);
      sql += ` AND event_type = $${params.length}`;
    }

    const safeLimit = Math.min(Math.max(1, limit || 50), 200);
    const safeOffset = Math.max(0, offset || 0);

    params.push(safeLimit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    if (safeOffset > 0) {
      params.push(safeOffset);
      sql += ` OFFSET $${params.length}`;
    }

    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async getCountsByEventType(): Promise<{ total: number; by_event_type: Record<string, number>; items: Array<{ event_type: string; count: number }> }> {
    await this.ensureAuditTable();

    const groupRes = await this.db.query(`
      SELECT event_type, COUNT(*)::int AS count
      FROM system_audit_logs
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const byEventType: Record<string, number> = {};
    let total = 0;

    for (const row of groupRes.rows) {
      byEventType[row.event_type] = row.count;
      total += row.count;
    }

    return {
      total,
      by_event_type: byEventType,
      items: groupRes.rows,
    };
  }
}

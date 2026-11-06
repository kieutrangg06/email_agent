import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  onModuleInit() {
    const config: any = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
        }
      : {
          host: process.env.DB_HOST || '127.0.0.1',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          user: process.env.DB_USER || 'admin',
          password: process.env.DB_PASSWORD || 'SecretPassword123!',
          database: process.env.DB_DATABASE || process.env.POSTGRES_DB || 'email_automation_db',
        };

    this.pool = new Pool({
      ...config,
      max: 20,
      idleTimeoutMillis: 30000,
    });

    // Tự động chuẩn hóa toàn bộ dữ liệu P1, P2, P3, P4 và SLA chuẩn ITIL
    this.pool.query(`
      -- 1. Chuẩn hóa sự cố kỹ thuật khẩn cấp (kể cả không dấu) sang Technical P1 - Critical (SLA 1h)
      UPDATE email_triage_logs
      SET category = 'Technical',
          classified_department = 'TECH',
          priority = 'P1 - Critical',
          sentiment = 'Khan cap',
          urgency_reason = 'Sự cố hệ thống không thể truy cập',
          sla_deadline = created_at + INTERVAL '1 hour',
          status = 'PROCESSED'
      WHERE subject ILIKE '%he thong%' OR subject ILIKE '%su co%' OR subject ILIKE '%504%' OR subject ILIKE '%sap%' OR subject ILIKE '%outage%';

      -- 2. Chuẩn hóa P1 - Critical (SLA 1h)
      UPDATE email_triage_logs 
      SET priority = 'P1 - Critical', 
          sla_deadline = created_at + INTERVAL '1 hour',
          status = 'PROCESSED'
      WHERE priority = 'P1' OR (priority ILIKE '%P1%' AND priority != 'P1 - Critical');

      UPDATE tickets
      SET priority = 'P1 - Critical',
          sla_due_at = created_at + INTERVAL '1 hour'
      WHERE priority = 'P1' OR (priority ILIKE '%P1%' AND priority != 'P1 - Critical');

      -- 3. Chuẩn hóa P2 - High (SLA 4h)
      UPDATE email_triage_logs 
      SET priority = 'P2 - High', 
          sla_deadline = created_at + INTERVAL '4 hours'
      WHERE priority = 'P2' OR (priority ILIKE '%P2%' AND priority != 'P2 - High');

      UPDATE tickets
      SET priority = 'P2 - High',
          sla_due_at = created_at + INTERVAL '4 hours'
      WHERE priority = 'P2' OR (priority ILIKE '%P2%' AND priority != 'P2 - High');

      -- 4. Chuẩn hóa P3 - Medium (SLA 24h)
      UPDATE email_triage_logs 
      SET priority = 'P3 - Medium', 
          sla_deadline = created_at + INTERVAL '24 hours'
      WHERE (priority = 'P3' OR (priority ILIKE '%P3%' AND priority != 'P3 - Medium')) AND category != 'General';

      UPDATE tickets
      SET priority = 'P3 - Medium',
          sla_due_at = created_at + INTERVAL '24 hours'
      WHERE (priority = 'P3' OR (priority ILIKE '%P3%' AND priority != 'P3 - Medium')) AND category != 'General';

      -- 5. Chuẩn hóa General / P4 - Low (SLA 48h)
      UPDATE email_triage_logs 
      SET priority = 'P4 - Low', 
          sla_deadline = created_at + INTERVAL '48 hours'
      WHERE priority = 'P4' OR (priority ILIKE '%P4%' AND priority != 'P4 - Low') OR category = 'General';

      UPDATE tickets
      SET priority = 'P4 - Low',
          sla_due_at = created_at + INTERVAL '48 hours'
      WHERE priority = 'P4' OR (priority ILIKE '%P4%' AND priority != 'P4 - Low') OR category = 'General';
    `).catch(() => {});
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

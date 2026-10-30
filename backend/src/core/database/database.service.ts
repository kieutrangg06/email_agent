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

    // Tự động chuẩn hóa dữ liệu General sang P4 - Low (SLA 48h) chuẩn ITIL
    this.pool.query(`
      UPDATE email_triage_logs 
      SET priority = 'P4 - Low', 
          sla_deadline = created_at + INTERVAL '48 hours'
      WHERE category = 'General' AND priority = 'P3 - Medium';
      UPDATE tickets
      SET priority = 'P4 - Low',
          sla_due_at = created_at + INTERVAL '48 hours'
      WHERE category = 'General' AND priority LIKE '%P3%';
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

import { Controller, Get, Post } from '@nestjs/common';
import { DatabaseService } from './core/database/database.service';

@Controller()
export class AppController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getRoot() {
    return {
      status: 'online',
      service: 'Enterprise AI Email Automation & Helpdesk CRM API',
      version: '1.0.0',
      cloud: 'Render Cloud (Tokyo Supabase PostgreSQL 16 + pgvector)',
      system_time: new Date().toISOString(),
      endpoints: {
        triage_stats: '/api/v1/triage/stats',
        tickets: '/api/v1/tickets',
        drafts: '/api/v1/drafts',
        crm_customers: '/api/v1/crm/customers',
        finance_invoices: '/api/v1/finance/invoices',
      },
    };
  }

  @Get('health')
  getHealth() {
    return { status: 'healthy', timestamp: Date.now() };
  }

  @Post('api/v1/admin/reset-database')
  async resetDatabase() {
    await this.db.query(`
      TRUNCATE TABLE email_quarantine_vault RESTART IDENTITY CASCADE;
      TRUNCATE TABLE email_triage_logs RESTART IDENTITY CASCADE;
      TRUNCATE TABLE ticket_comments RESTART IDENTITY CASCADE;
      TRUNCATE TABLE email_drafts RESTART IDENTITY CASCADE;
      TRUNCATE TABLE tickets RESTART IDENTITY CASCADE;
      TRUNCATE TABLE crm_deals RESTART IDENTITY CASCADE;
      TRUNCATE TABLE crm_customers RESTART IDENTITY CASCADE;
      TRUNCATE TABLE finance_invoices RESTART IDENTITY CASCADE;
      TRUNCATE TABLE daily_summaries RESTART IDENTITY CASCADE;
      TRUNCATE TABLE system_audit_logs RESTART IDENTITY CASCADE;
    `);
    return {
      status: 'success',
      message: 'Toàn bộ dữ liệu giao dịch trên Database Supabase Host đã được xóa sạch 100%.',
      timestamp: new Date().toISOString(),
    };
  }
}

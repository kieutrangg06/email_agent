import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { DraftsModule } from './modules/drafts/drafts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CrmModule } from './modules/crm/crm.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    DatabaseModule,
    // Member 1: Triage & Helpdesk SLA
    TicketsModule,
    // Member 2: Knowledge RAG & Executive Analytics
    DraftsModule,
    AnalyticsModule,
    // Member 3: CRM Growth & Finance Invoices
    CrmModule,
    FinanceModule,
    // Enterprise Core Modules
    AuthModule,
    AuditModule,
    KnowledgeModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { DraftsModule } from './modules/drafts/drafts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CrmModule } from './modules/crm/crm.module';
import { FinanceModule } from './modules/finance/finance.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

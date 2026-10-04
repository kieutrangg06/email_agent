import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { CrmModule } from './modules/crm/crm.module';
import { InvoicesModule } from './modules/invoices/invoices.module';

@Module({
  imports: [
    DatabaseModule,
    // Member 1 Module
    TicketsModule,
    // Member 2 Module
    KnowledgeModule,
    // Member 3 Modules
    CrmModule,
    InvoicesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

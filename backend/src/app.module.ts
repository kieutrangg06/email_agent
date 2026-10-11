import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { DraftsModule } from './modules/drafts/drafts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    DatabaseModule,
    TicketsModule,
    DraftsModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

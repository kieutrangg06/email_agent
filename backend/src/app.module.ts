import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { TicketsModule } from './modules/tickets/tickets.module';

@Module({
  imports: [
    DatabaseModule,
    TicketsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

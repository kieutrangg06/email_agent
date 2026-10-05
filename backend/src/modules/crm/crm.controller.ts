import { Body, Controller, Get, Post } from '@nestjs/common';
import { CrmService } from './crm.service';
import { InvoicesService } from '../invoices/invoices.service';

@Controller('api/v1/crm')
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Get('customers')
  async getAllCustomers() {
    return this.crmService.getAllCustomers();
  }

  @Post('leads')
  async createOrUpdateLead(@Body() body: any) {
    return this.crmService.upsertLead(body);
  }

  // Node 14 Luồng 6 webhook endpoint alias: POST /api/v1/crm/invoices
  @Post('invoices')
  async syncAccountingInvoice(@Body() body: any) {
    return this.invoicesService.createInvoice(body);
  }

  // Node 19 Luồng 6 toast notification endpoint: POST /api/v1/crm/notifications
  @Post('notifications')
  async pushToastAlert(@Body() body: any) {
    return this.crmService.addNotification(body);
  }

  @Get('notifications')
  async getNotifications() {
    return this.crmService.getNotifications();
  }
}

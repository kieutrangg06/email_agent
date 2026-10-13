import { Body, Controller, Get, Post } from '@nestjs/common';
import { FinanceService, InvoiceDto } from './finance.service';

@Controller('api/v1')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // 1. Standard finance endpoints
  @Get('finance/invoices')
  async getAllInvoices() {
    return this.financeService.getAllInvoices();
  }

  @Post('finance/invoices')
  async saveInvoice(@Body() body: InvoiceDto) {
    return this.financeService.saveInvoice(body);
  }

  // 2. Direct /invoices aliases
  @Get('invoices')
  async getAllInvoicesAlias() {
    return this.financeService.getAllInvoices();
  }

  @Post('invoices')
  async saveInvoiceAlias(@Body() body: InvoiceDto) {
    return this.financeService.saveInvoice(body);
  }

  // 3. CRM invoices webhook alias (for Node 14 Luồng 6)
  @Post('crm/invoices')
  async saveCrmInvoiceAlias(@Body() body: InvoiceDto) {
    return this.financeService.saveInvoice(body);
  }

  @Get('finance/audit-logs')
  async getAuditLogs() {
    return this.financeService.getAuditLogs();
  }

  @Get('invoices/audit-logs')
  async getAuditLogsAlias() {
    return this.financeService.getAuditLogs();
  }
}

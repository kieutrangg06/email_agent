import { Body, Controller, Get, Post } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('api/v1/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async getAllInvoices() {
    return this.invoicesService.getAllInvoices();
  }

  @Post()
  async createInvoice(@Body() body: any) {
    return this.invoicesService.createInvoice(body);
  }
}

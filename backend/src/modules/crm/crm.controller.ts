import { Body, Controller, Get, Post } from '@nestjs/common';
import { CrmService } from './crm.service';

@Controller('api/v1/crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('customers')
  async getAllCustomers() {
    return this.crmService.getAllCustomers();
  }

  @Post('leads')
  async createOrUpdateLead(@Body() body: any) {
    return this.crmService.upsertLead(body);
  }
}

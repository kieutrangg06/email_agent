import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CrmService, CrmCustomerDto, CrmDealDto } from './crm.service';

@Controller('api/v1/crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('customers')
  async getAllCustomers() {
    return this.crmService.getAllCustomers();
  }

  @Post('customers')
  async upsertCustomer(@Body() body: CrmCustomerDto) {
    return this.crmService.upsertCustomer(body);
  }

  // Alias for legacy compatibility
  @Post('leads')
  async upsertLeadAlias(@Body() body: any) {
    return this.crmService.upsertCustomer(body);
  }

  @Get('deals')
  async getAllDeals() {
    return this.crmService.getAllDeals();
  }

  @Post('deals')
  async createDeal(@Body() body: CrmDealDto) {
    return this.crmService.createDeal(body);
  }

  @Patch('deals/:id/activity')
  async updateDealActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { stage?: string; note?: string }
  ) {
    return this.crmService.updateDealActivity(id, body);
  }
}

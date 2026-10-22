import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CrmService, CrmCustomerDto, CrmDealDto } from './crm.service';

@Controller('api/v1/crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('customers')
  async getAllCustomers() {
    return this.crmService.getAllCustomers();
  }

  @Get('customers/by-email')
  async getCustomerByEmail(@Query('email') email: string) {
    if (!email || !email.trim()) {
      return { id: null, email: '', full_name: null, lead_score: 50 };
    }
    return this.crmService.getCustomerByEmail(email);
  }

  @Post('customers')
  async upsertCustomer(@Body() body: CrmCustomerDto) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body is required');
    }
    const rawEmail = body.email || body.sender_email || body.customer_email;
    if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
      throw new BadRequestException('Email is required and must be a valid non-empty string');
    }
    return this.crmService.upsertCustomer({
      ...body,
      email: rawEmail.trim().toLowerCase(),
    });
  }

  // Alias for legacy compatibility
  @Post('leads')
  async upsertLeadAlias(@Body() body: any) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body is required');
    }
    const rawEmail = body.email || body.sender_email || body.customer_email;
    if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
      throw new BadRequestException('Email is required and must be a valid non-empty string');
    }
    return this.crmService.upsertCustomer({
      ...body,
      email: rawEmail.trim().toLowerCase(),
    });
  }

  @Get('deals')
  async getAllDeals() {
    return this.crmService.getAllDeals();
  }

  @Get('deals/stale')
  async getStaleDeals(@Query('limit') limit?: number) {
    return this.crmService.getStaleDeals(limit ? Number(limit) : 10);
  }

  @Get('deals/:id')
  async getDealById(@Param('id', ParseIntPipe) id: number) {
    return this.crmService.getDealById(id);
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


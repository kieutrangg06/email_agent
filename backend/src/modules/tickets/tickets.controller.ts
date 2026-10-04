import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('api/v1')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('triage/departments')
  async getDepartments() {
    return this.ticketsService.getDepartments();
  }

  @Get('tickets')
  async getAllTickets() {
    return this.ticketsService.getAllTickets();
  }

  @Get('tickets/:code')
  async getTicketByCode(@Param('code') code: string) {
    return this.ticketsService.getTicketByCode(code);
  }

  @Post('tickets')
  async createTicket(@Body() body: any) {
    return this.ticketsService.createTicket(body);
  }

  @Patch('tickets/:code/status')
  async updateStatus(@Param('code') code: string, @Body('status') status: string) {
    return this.ticketsService.updateTicketStatus(code, status);
  }
}

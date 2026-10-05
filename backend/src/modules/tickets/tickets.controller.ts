import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('api/v1')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // 1. Triage Endpoints (Luồng 1 & Triage Page)
  @Get('triage/departments')
  async getDepartments() {
    return this.ticketsService.getDepartments();
  }

  @Get('departments')
  async getDepartmentsAlias() {
    return this.ticketsService.getDepartments();
  }

  @Get('triage/logs')
  async getTriageLogs(
    @Query('category') category?: string,
    @Query('priority') priority?: string,
  ) {
    return this.ticketsService.getRecentLogs(category, priority);
  }

  @Patch('triage/logs/:id/status')
  async updateLogStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.ticketsService.updateTriageStatus(id, status);
  }

  @Get('triage/stats')
  async getTriageStats() {
    return this.ticketsService.getStats();
  }

  @Post('triage/in-app-alert')
  async inAppAlert(@Body() body: any) {
    return { status: 'acknowledged', received: body };
  }

  // 2. Ticket Endpoints (Luồng 2 & Tickets Page)
  @Get('tickets')
  async getAllTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.ticketsService.getAllTickets(status, priority);
  }

  // Alias for compatibility with older frontend calls
  @Get('triage/tickets')
  async getAllTicketsAlias(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.ticketsService.getAllTickets(status, priority);
  }

  @Get('tickets/stats/sla')
  async getSlaStats() {
    return this.ticketsService.getSlaStats();
  }

  @Get('tickets/agents')
  async getAgents(@Query('category') category?: string) {
    return this.ticketsService.getAvailableAgents(category);
  }

  @Get('tickets/:code')
  async getTicketByCode(@Param('code') code: string) {
    return this.ticketsService.getTicketByCode(code);
  }

  @Post('tickets')
  async createTicket(@Body() body: any) {
    return this.ticketsService.createTicket(body);
  }

  @Post('triage/tickets')
  async createTicketAlias(@Body() body: any) {
    return this.ticketsService.createTicket(body);
  }

  @Patch('tickets/:code/status')
  async updateStatus(
    @Param('code') code: string,
    @Body('status') status: string,
  ) {
    return this.ticketsService.updateTicketStatus(code, status);
  }

  @Patch('tickets/:code/resolve')
  async resolveTicket(@Param('code') code: string) {
    return this.ticketsService.resolveTicket(code);
  }

  @Patch('triage/tickets/:code/resolve')
  async resolveTicketAlias(@Param('code') code: string) {
    return this.ticketsService.resolveTicket(code);
  }
}

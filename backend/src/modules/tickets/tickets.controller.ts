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

  // 1. Triage Endpoints (Luồng 1 & 2)
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

  @Get('triage/quarantine')
  async getQuarantineLogs() {
    return this.ticketsService.getQuarantineLogs();
  }

  @Post('triage/in-app-alert')
  async inAppAlert(@Body() body: any) {
    return { status: 'acknowledged', received: body };
  }

  // 2. Ticket Endpoints (Luồng 3 & Tickets Page)
  @Get('tickets')
  async getAllTickets(
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

  @Post('tickets/comments')
  async addComment(@Body() body: any) {
    return this.ticketsService.addTicketComment(body);
  }

  @Get('tickets/:code/comments')
  async getComments(@Param('code') code: string) {
    return this.ticketsService.getTicketComments(code);
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
}


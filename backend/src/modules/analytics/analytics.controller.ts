import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/v1')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('digest')
  async saveDigest(@Body() body: any) {
    return this.analyticsService.saveDigest(body);
  }

  @Get('digest')
  async getLatestDigests(@Query('limit') limit?: number) {
    return this.analyticsService.getLatestDigests(limit ? Number(limit) : 10);
  }

  @Get('analytics/daily-summaries')
  async getDailySummaries(@Query('limit') limit?: number) {
    return this.analyticsService.getLatestDigests(limit ? Number(limit) : 10);
  }

  @Get('analytics/stats')
  async getDailyStats() {
    return this.analyticsService.getDailyStats();
  }

  @Get('digest/inbound-volume')
  async getInboundVolume() {
    return this.analyticsService.getInboundVolume();
  }

  @Get('digest/ticket-stats')
  async getTicketStats() {
    return this.analyticsService.getTicketStats();
  }

  @Get('digest/recipients')
  async getDigestRecipients() {
    return this.analyticsService.getDigestRecipients();
  }
}


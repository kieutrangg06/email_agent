import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('api/v1')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // ==========================================
  // Knowledge Base RAG APIs (Luồng 3 RAG)
  // ==========================================
  @Get('knowledge')
  async getKnowledge(@Query('q') query?: string) {
    return this.knowledgeService.searchKnowledge(query);
  }

  @Post('knowledge')
  async createKnowledge(@Body() body: { topic: string; keywords?: string; content: string }) {
    return this.knowledgeService.createKnowledge(body);
  }

  // ==========================================
  // Email Drafts Human-in-the-Loop APIs (Luồng 3)
  // ==========================================
  @Get('drafts')
  async getAllDrafts(@Query('status') status?: string) {
    return this.knowledgeService.getAllDrafts(status);
  }

  @Get('drafts/:id')
  async getDraftById(@Param('id') id: string) {
    return this.knowledgeService.getDraftById(parseInt(id, 10));
  }

  @Post('drafts')
  async createDraft(@Body() body: any) {
    return this.knowledgeService.createDraft(body);
  }

  @Patch('drafts/:id/status')
  async updateDraftStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reviewed_by') reviewed_by?: string,
    @Body('proposed_subject') proposed_subject?: string,
    @Body('proposed_body') proposed_body?: string,
  ) {
    return this.knowledgeService.updateDraftStatus(parseInt(id, 10), {
      status,
      reviewed_by,
      proposed_subject,
      proposed_body,
    });
  }

  // ==========================================
  // Webhook Callbacks & Notifications (n8n Luồng 3)
  // ==========================================
  @Post('notifications/email-draft')
  async notifyDraftCreated(@Body() body: any) {
    return this.knowledgeService.recordDraftNotification(body);
  }

  @Post('dashboard/email-draft-status')
  async syncDraftStatus(@Body() body: any) {
    return this.knowledgeService.syncDraftStatus(body);
  }

  // ==========================================
  // Daily Digest APIs (Luồng 4)
  // ==========================================
  @Get('digest')
  async getSummaries(@Query('limit') limit?: string) {
    return this.knowledgeService.getDailySummaries(limit ? parseInt(limit, 10) : 30);
  }

  @Post('digest')
  async pushStats(@Body() body: any) {
    return this.knowledgeService.saveDailySummary(body);
  }

  @Post('dashboard/daily-summary')
  async pushDashboardSummary(@Body() body: any) {
    return this.knowledgeService.saveDailySummary(body);
  }

  @Get('digest/recipients')
  async getRecipients() {
    return this.knowledgeService.getDigestRecipients();
  }
}

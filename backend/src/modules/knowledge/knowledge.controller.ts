import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('api/v1')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('knowledge')
  async getKnowledge(@Query('q') query?: string) {
    return this.knowledgeService.searchKnowledge(query);
  }

  @Get('drafts')
  async getAllDrafts() {
    return this.knowledgeService.getAllDrafts();
  }

  @Post('drafts')
  async createDraft(@Body() body: any) {
    return this.knowledgeService.createDraft(body);
  }

  @Patch('drafts/:id/status')
  async updateDraftStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reviewed_by') reviewed_by?: string
  ) {
    return this.knowledgeService.updateDraftStatus(parseInt(id, 10), status, reviewed_by);
  }

  @Get('digest')
  async getSummaries() {
    return this.knowledgeService.getDailySummaries();
  }

  @Post('digest')
  async pushStats(@Body() body: any) {
    return this.knowledgeService.saveDailySummary(body);
  }
}

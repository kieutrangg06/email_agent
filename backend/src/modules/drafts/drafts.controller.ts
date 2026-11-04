import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  Query,
  Sse,
} from '@nestjs/common';
import { DraftsService, DraftNotificationEvent } from './drafts.service';
import { Observable } from 'rxjs';

@Controller('api/v1')
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  // 1. Dual-Mode Settings (HUMAN vs AI_FULL)
  @Get('drafts/settings/mode')
  async getApprovalMode() {
    return this.draftsService.getApprovalMode();
  }

  @Post('drafts/settings/mode')
  async setApprovalMode(@Body() body: any) {
    return this.draftsService.setApprovalMode(body);
  }

  // 2. Draft Creation & Retrieval
  @Post('drafts')
  async createDraft(@Body() body: any) {
    return this.draftsService.createDraft(body);
  }

  @Get('drafts')
  async getAllDrafts(@Query('status') status?: string) {
    return this.draftsService.getAllDrafts(status);
  }

  @Get('drafts/pending')
  async getPendingDrafts() {
    return this.draftsService.getPendingDrafts();
  }

  @Get('drafts/:id')
  async getDraftById(@Param('id', ParseIntPipe) id: number) {
    return this.draftsService.getDraftById(id);
  }

  @Patch('drafts/:id/status')
  async updateDraftStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.draftsService.updateDraftStatus(id, body);
  }

  @Post('drafts/:id/resend')
  async resendApprovedReply(@Param('id', ParseIntPipe) id: number) {
    return this.draftsService.resendApprovedReply(id);
  }

  // 3. Multi-Turn Simulation for Teacher's Scenario
  @Post('drafts/simulate-multi-turn')
  async simulateMultiTurn(@Body() body: any) {
    return this.draftsService.simulateMultiTurnEmail(body);
  }

  // 4. Reviewer validation
  @Post('reviewers/validate')
  validateReviewer(@Body('reviewer_email') reviewerEmail: string) {
    return this.draftsService.validateReviewer(reviewerEmail);
  }

  @Post('auth/validate-reviewer')
  validateReviewerAlias(@Body('reviewer_email') reviewerEmail: string) {
    return this.draftsService.validateReviewer(reviewerEmail);
  }

  @Post('notifications/email-draft')
  pushNotification(@Body() body: any) {
    return this.draftsService.pushNotification(body);
  }

  // 5. Realtime SSE Streams
  @Sse('drafts/events')
  draftEvents(): Observable<DraftNotificationEvent> {
    return this.draftsService.getEventStream();
  }

  @Sse('events')
  systemEvents(): Observable<DraftNotificationEvent> {
    return this.draftsService.getEventStream();
  }
}

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

  @Sse('drafts/events')
  draftEvents(): Observable<DraftNotificationEvent> {
    return this.draftsService.getEventStream();
  }

  @Sse('events')
  systemEvents(): Observable<DraftNotificationEvent> {
    return this.draftsService.getEventStream();
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Sse,
  BadRequestException,
} from '@nestjs/common';
import {
  NotificationsService,
  PushNotificationDto,
  SseNotificationEvent,
} from './notifications.service';
import { Observable } from 'rxjs';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push')
  async pushNotification(@Body() body: PushNotificationDto) {
    if (!body || !body.type) {
      throw new BadRequestException('Trường "type" thông báo là bắt buộc (ví dụ: ticket_created, draft_ready, p1_alert, sla_breach)');
    }
    const result = this.notificationsService.emitNotification(body.type, body);
    return {
      success: true,
      result,
      data: body,
    };
  }

  @Get('health')
  getHealth() {
    return this.notificationsService.getHealth();
  }

  @Sse('stream')
  sseStream(): Observable<SseNotificationEvent> {
    return this.notificationsService.getEventStream();
  }
}

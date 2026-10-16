import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { Subject, Observable } from 'rxjs';

export interface PushNotificationDto {
  type: string;
  title?: string;
  message?: string;
  data?: any;
  ticket_id?: number;
  ticket_code?: string;
  draft_id?: number;
  priority?: string;
}

export interface SseNotificationEvent {
  data: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sseSubject = new Subject<SseNotificationEvent>();

  constructor(private readonly gateway: NotificationsGateway) {}

  emitNotification(type: string, payload: any): { success: boolean; event: string; recipients: number } {
    const timestamp = new Date().toISOString();
    const enrichedPayload = {
      type,
      ...payload,
      timestamp,
    };

    this.logger.log(`Emitting notification [${type}]: ${JSON.stringify(payload)}`);

    switch (type) {
      case 'ticket_created':
        this.gateway.emitTicketCreated(enrichedPayload);
        break;
      case 'draft_ready':
        this.gateway.emitDraftReady(enrichedPayload);
        break;
      case 'p1_alert':
        this.gateway.emitP1Alert(enrichedPayload);
        break;
      case 'sla_breach':
        this.gateway.emitSlaBreach(enrichedPayload);
        break;
      default:
        this.gateway.emitCustom(type, enrichedPayload);
        break;
    }

    // Always emit on general 'notification' topic as well
    this.gateway.emitCustom('notification', enrichedPayload);

    // Also push to SSE stream
    this.sseSubject.next({ data: enrichedPayload });

    return {
      success: true,
      event: type,
      recipients: this.gateway.getConnectedCount(),
    };
  }

  getEventStream(): Observable<SseNotificationEvent> {
    return this.sseSubject.asObservable();
  }

  getHealth(): { status: string; connected_clients: number; namespace: string; timestamp: string } {
    return {
      status: 'healthy',
      connected_clients: this.gateway.getConnectedCount(),
      namespace: '/notifications',
      timestamp: new Date().toISOString(),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface SseNotificationEvent {
  data: any;
}

@Injectable()
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly eventBus$ = new Subject<{ event: string; payload: any }>();
  private activeConnections: number = 0;

  constructor() {
    this.logger.log('Notifications Gateway initialized');
  }

  incrementConnections() {
    this.activeConnections++;
  }

  decrementConnections() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  getConnectedCount(): number {
    return this.activeConnections;
  }

  emit(event: string, payload: any) {
    this.logger.log(`Gateway emit event [${event}]: ${JSON.stringify(payload)}`);
    this.eventBus$.next({ event, payload });
  }

  emitTicketCreated(payload: any) {
    this.emit('ticket_created', payload);
  }

  emitDraftReady(payload: any) {
    this.emit('draft_ready', payload);
  }

  emitP1Alert(payload: any) {
    this.emit('p1_alert', payload);
  }

  emitSlaBreach(payload: any) {
    this.emit('sla_breach', payload);
  }

  emitCustom(event: string, payload: any) {
    this.emit(event, payload);
  }

  getEventBus(): Observable<{ event: string; payload: any }> {
    return this.eventBus$.asObservable();
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DraftNotificationEvent {
  data: {
    type: string;
    draft_id?: number;
    ticket_code?: string;
    recipient_email?: string;
    subject?: string;
    timestamp: string;
  };
}

@Injectable()
export class DraftsService {
  private readonly logger = new Logger(DraftsService.name);
  private readonly notifications$ = new Subject<any>();

  constructor(private readonly db: DatabaseService) {}

  async createDraft(payload: any) {
    this.logger.log(`Creating new email draft for ticket ${payload.ticket_code}`);
    const query = `
      INSERT INTO email_drafts (
        ticket_code, recipient_email, subject, proposed_subject, 
        proposed_body, html_content, confidence_score, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;
    const values = [
      payload.ticket_code,
      payload.recipient_email,
      payload.subject || payload.proposed_subject,
      payload.proposed_subject || payload.subject,
      payload.proposed_body || payload.body || payload.content || '',
      payload.html_content || `<p>${payload.proposed_body || payload.body || ''}</p>`,
      payload.confidence_score || 95.0,
      payload.status || 'PENDING_APPROVAL',
    ];

    const res = await this.db.query(query, values);
    const created = res.rows[0];

    // Emit notification event
    this.notifications$.next({
      type: 'DRAFT_CREATED',
      draft_id: created.id,
      ticket_code: created.ticket_code,
      recipient_email: created.recipient_email,
      subject: created.subject,
      timestamp: new Date().toISOString(),
    });

    return created;
  }

  async getAllDrafts() {
    const res = await this.db.query(
      `SELECT d.*, t.priority, t.assigned_to 
       FROM email_drafts d 
       LEFT JOIN tickets t ON d.ticket_code = t.ticket_code 
       ORDER BY d.created_at DESC LIMIT 100;`
    );
    return res.rows;
  }

  async getPendingDrafts() {
    const res = await this.db.query(
      `SELECT d.*, 
              COALESCE(t.priority, 'P2 - High') as priority, 
              t.assigned_to, 
              t.title as ticket_title,
              t.status as ticket_status,
              t.sla_due_at
       FROM email_drafts d 
       LEFT JOIN tickets t ON d.ticket_code = t.ticket_code 
       WHERE d.status = 'PENDING_APPROVAL' 
       ORDER BY d.created_at DESC;`
    );
    return res.rows;
  }

  async getDraftById(id: number) {
    const res = await this.db.query(
      `SELECT d.*, t.priority, t.assigned_to, t.title as ticket_title 
       FROM email_drafts d 
       LEFT JOIN tickets t ON d.ticket_code = t.ticket_code 
       WHERE d.id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  async updateDraftStatus(id: number, payload: any) {
    this.logger.log(`Updating status for draft #${id} to ${payload.status}`);
    const query = `
      UPDATE email_drafts
      SET status = $1,
          reviewed_by = COALESCE($2, reviewed_by),
          reviewed_at = NOW(),
          sent_at = CASE WHEN $1 = 'SENT' THEN NOW() ELSE sent_at END,
          proposed_subject = COALESCE($3, proposed_subject),
          proposed_body = COALESCE($4, proposed_body)
      WHERE id = $5
      RETURNING *;
    `;
    const res = await this.db.query(query, [
      payload.status,
      payload.reviewed_by || 'reviewer@company.com',
      payload.proposed_subject,
      payload.proposed_body,
      id,
    ]);

    const updated = res.rows[0];

    // Emit SSE event
    this.notifications$.next({
      type: 'DRAFT_STATUS_UPDATED',
      draft_id: id,
      status: payload.status,
      reviewed_by: payload.reviewed_by,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  validateReviewer(reviewerEmail: string) {
    const valid = !!reviewerEmail && reviewerEmail.includes('@');
    return {
      valid,
      reviewer_email: reviewerEmail,
      role: 'AGENT_REVIEWER',
      permissions: ['APPROVE_SEND', 'REJECT_DRAFT', 'EDIT_DRAFT'],
      validated_at: new Date().toISOString(),
    };
  }

  pushNotification(data: any) {
    this.notifications$.next({
      type: 'NOTIFICATION_PUSHED',
      ...data,
      timestamp: new Date().toISOString(),
    });
    return { success: true, message: 'Notification emitted to stream' };
  }

  getEventStream(): Observable<DraftNotificationEvent> {
    return this.notifications$.asObservable().pipe(
      map((event) => ({
        data: event,
      }))
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { MailService } from '../../core/mail/mail.service';
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

  constructor(
    private readonly db: DatabaseService,
    private readonly mailService: MailService,
  ) {}

  async createDraft(payload: any) {
    const ticketCode = payload.ticket_code || payload.ticketCode || null;
    let ticketId = payload.ticket_id ? Number(payload.ticket_id) : null;
    let ticketData: any = null;

    // 1. Fetch ticket information if ticket_code or ticket_id is provided
    if (ticketCode || ticketId) {
      try {
        const ticketRes = await this.db.query(
          `SELECT id, ticket_code, sender_email, customer_email, title, subject 
           FROM tickets 
           WHERE ticket_code = $1 OR id = $2 
           LIMIT 1`,
          [ticketCode || '', ticketId || 0],
        );
        if (ticketRes.rows.length > 0) {
          ticketData = ticketRes.rows[0];
          if (!ticketId) ticketId = ticketData.id;
        }
      } catch (err: any) {
        this.logger.warn(`Could not lookup ticket details for draft creation: ${err.message}`);
      }
    }

    // 2. Resolve recipient_email with robust cascading fallback
    let recipientEmail =
      payload.recipient_email ||
      payload.recipient ||
      payload.sender_email ||
      payload.customer_email ||
      payload.client_email ||
      payload.email ||
      payload.toEmail ||
      payload.to ||
      ticketData?.sender_email ||
      ticketData?.customer_email;

    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.trim()) {
      recipientEmail = 'trangltk.24it@vku.udn.vn'; // Fallback client email as per project specification
    }
    recipientEmail = recipientEmail.trim().toLowerCase();

    // 3. Resolve subject and proposed subject
    const subject =
      payload.subject ||
      payload.proposed_subject ||
      (ticketData?.title ? `Phản hồi yêu cầu hỗ trợ: ${ticketData.title}` : null) ||
      (ticketCode ? `Phản hồi yêu cầu hỗ trợ [${ticketCode}]` : 'Phản hồi yêu cầu hỗ trợ từ Enterprise Helpdesk');

    const proposedSubject = payload.proposed_subject || subject;
    const proposedBody = payload.proposed_body || payload.body || payload.content || '';
    const htmlContent =
      payload.html_content ||
      `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>${proposedBody.replace(/\n/g, '<br/>') || 'Kính gửi Quý khách, chúng tôi đã tiếp nhận và đang xử lý yêu cầu của bạn.'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 13px; color: #777;">Trân trọng,<br/><strong>Enterprise Support Team</strong></p>
      </div>`;

    const confidenceScore = Number(payload.confidence_score) || 95.0;
    const status = payload.status || 'PENDING_APPROVAL';

    this.logger.log(`Creating new email draft for ticket ${ticketCode || 'N/A'}, recipient: ${recipientEmail}`);

    const query = `
      INSERT INTO email_drafts (
        ticket_id, ticket_code, recipient_email, subject, proposed_subject, 
        proposed_body, html_content, confidence_score, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `;
    const values = [
      ticketId,
      ticketCode,
      recipientEmail,
      subject,
      proposedSubject,
      proposedBody,
      htmlContent,
      confidenceScore,
      status,
    ];

    const res = await this.db.query(query, values);
    const created = res.rows[0];

    // Auto-link draft_id to ticket if ticket exists and draft_id is not set
    if (ticketCode) {
      try {
        await this.db.query(
          `UPDATE tickets SET draft_id = $1 WHERE ticket_code = $2 AND (draft_id IS NULL OR draft_id = 0)`,
          [created.id, ticketCode],
        );
      } catch (err: any) {
        this.logger.warn(`Could not auto-link draft_id to ticket: ${err.message}`);
      }
    }

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

  async getAllDrafts(status?: string) {
    let query = `
      SELECT d.*, 
             COALESCE(t.priority, 'P2 - High') as priority, 
             t.assigned_to, 
             t.title as ticket_title,
             t.status as ticket_status,
             t.sla_due_at
      FROM email_drafts d 
      LEFT JOIN tickets t ON (d.ticket_code = t.ticket_code OR d.ticket_id = t.id)
    `;
    const params: any[] = [];
    if (status && status !== 'ALL' && status !== 'All') {
      params.push(status);
      query += ` WHERE d.status = $1`;
    }
    query += ` ORDER BY d.created_at DESC LIMIT 100;`;
    const res = await this.db.query(query, params);
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
      `SELECT d.*, 
              t.id AS t_id, 
              t.ticket_code AS t_code, 
              t.created_at AS ticket_created_at, 
              t.sla_due_at, 
              t.first_response_sla, 
              t.priority, 
              t.assigned_to, 
              t.title as ticket_title 
       FROM email_drafts d 
       LEFT JOIN tickets t ON (d.ticket_code = t.ticket_code OR d.ticket_id = t.id)
       WHERE d.id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  async updateDraftStatus(id: number, payload: any) {
    this.logger.log(`Updating status for draft #${id} to ${payload.status}`);
    const isSent = payload.status === 'SENT';
    const query = `
      UPDATE email_drafts
      SET status = $1::text,
          reviewed_by = COALESCE($2::text, reviewed_by),
          reviewed_at = NOW(),
          sent_at = ${isSent ? 'NOW()' : 'sent_at'},
          proposed_subject = COALESCE($3::text, proposed_subject),
          proposed_body = COALESCE($4::text, proposed_body),
          subject = COALESCE($5::text, subject),
          html_content = COALESCE($6::text, html_content)
      WHERE id = $7::int
      RETURNING *;
    `;
    const res = await this.db.query(query, [
      payload.status,
      payload.reviewed_by || 'reviewer@company.com',
      payload.proposed_subject || payload.subject || null,
      payload.proposed_body || payload.html_content || null,
      payload.subject || payload.proposed_subject || null,
      payload.html_content || payload.proposed_body || null,
      id,
    ]);

    const updated = res.rows[0];

    // If status is SENT, update ticket status to RESOLVED
    if (updated && updated.ticket_code && isSent) {
      try {
        const tRes = await this.db.query(
          "UPDATE tickets SET status = 'RESOLVED', resolved_at = NOW() WHERE ticket_code = $1 RETURNING *;",
          [updated.ticket_code]
        );
        if (tRes.rows.length > 0 && tRes.rows[0].agent_email) {
          await this.db.query(
            'UPDATE support_agents SET active_tickets_count = GREATEST(active_tickets_count - 1, 0) WHERE email = $1;',
            [tRes.rows[0].agent_email]
          ).catch(() => {});
        }
      } catch (err: any) {
        this.logger.warn(`Could not resolve ticket ${updated.ticket_code}: ${err.message}`);
      }
    }

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

  async resendApprovedReply(id: number) {
    const draft = await this.getDraftById(id);
    if (!draft) {
      throw new Error(`Draft #${id} not found`);
    }
    if (!draft.recipient_email && draft.ticket_code) {
      const tRes = await this.db.query(
        'SELECT customer_email, sender_email FROM tickets WHERE ticket_code = $1',
        [draft.ticket_code],
      );
      if (tRes.rows.length > 0) {
        draft.recipient_email = tRes.rows[0].customer_email || tRes.rows[0].sender_email;
      }
    }
    const result = await this.mailService.sendApprovedReplyToCustomer(draft);
    return {
      success: true,
      message: `Đã gửi lại email phản hồi tới ${draft.recipient_email || 'khách hàng'}`,
      result,
    };
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

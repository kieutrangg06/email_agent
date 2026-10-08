import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface EmailDraftPayload {
  ticket_code?: string;
  recipient_email: string;
  sender_name?: string;
  original_subject?: string;
  original_body?: string;
  proposed_subject: string;
  proposed_body: string;
  confidence_score?: number;
  knowledge_context?: any[];
  approval_resume_url?: string;
  n8n_execution_id?: string;
  received_at?: string;
}

export interface UpdateDraftStatusPayload {
  status: string;
  reviewed_by?: string;
  proposed_subject?: string;
  proposed_body?: string;
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private readonly db: DatabaseService) {}

  async searchKnowledge(query?: string) {
    if (!query || !query.trim()) {
      const res = await this.db.query('SELECT * FROM knowledge_base ORDER BY id ASC');
      return res.rows;
    }
    const sanitized = `%${query.trim()}%`;
    const res = await this.db.query(
      `SELECT * FROM knowledge_base 
       WHERE keywords ILIKE $1 OR content ILIKE $1 OR topic ILIKE $1
       ORDER BY id ASC`,
      [sanitized]
    );
    return res.rows;
  }

  async createKnowledge(data: { topic: string; keywords?: string; content: string }) {
    const res = await this.db.query(
      `INSERT INTO knowledge_base (topic, keywords, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.topic, data.keywords || '', data.content]
    );
    return res.rows[0];
  }

  async getAllDrafts(status?: string) {
    if (status && status.trim()) {
      const res = await this.db.query(
        'SELECT * FROM email_drafts WHERE status = $1 ORDER BY created_at DESC',
        [status.trim()]
      );
      return res.rows;
    }
    const res = await this.db.query('SELECT * FROM email_drafts ORDER BY created_at DESC');
    return res.rows;
  }

  async getDraftById(id: number) {
    const res = await this.db.query('SELECT * FROM email_drafts WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Email draft #${id} not found`);
    }
    return res.rows[0];
  }

  async createDraft(payload: EmailDraftPayload) {
    const ticketCode =
      payload.ticket_code && payload.ticket_code.trim()
        ? payload.ticket_code.trim()
        : `TICK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await this.db.query(
      `INSERT INTO email_drafts (
        ticket_code, recipient_email, sender_name, original_subject, original_body,
        proposed_subject, proposed_body, confidence_score, status, knowledge_context,
        approval_resume_url, n8n_execution_id, received_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_APPROVAL', $9::jsonb, $10, $11, COALESCE($12::timestamp, CURRENT_TIMESTAMP))
      RETURNING *`,
      [
        ticketCode,
        payload.recipient_email,
        payload.sender_name || null,
        payload.original_subject || '',
        payload.original_body || '',
        payload.proposed_subject,
        payload.proposed_body,
        payload.confidence_score !== undefined ? payload.confidence_score : 85.0,
        JSON.stringify(payload.knowledge_context || []),
        payload.approval_resume_url || null,
        payload.n8n_execution_id || null,
        payload.received_at || null,
      ]
    );
    return res.rows[0];
  }

  async updateDraftStatus(id: number, payload: UpdateDraftStatusPayload) {
    const existing = await this.getDraftById(id);

    const reviewerEmail =
      payload.reviewed_by && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.reviewed_by.trim())
        ? payload.reviewed_by.trim()
        : 'admin-evaluator@enterprise.vn';

    const finalSubject = payload.proposed_subject?.trim() || existing.proposed_subject;
    const finalBody = payload.proposed_body?.trim() || existing.proposed_body;
    const targetStatus = payload.status || 'APPROVED';

    const res = await this.db.query(
      `UPDATE email_drafts 
       SET status = $1, reviewed_by = $2, proposed_subject = $3, proposed_body = $4, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [targetStatus, reviewerEmail, finalSubject, finalBody, id]
    );

    const updated = res.rows[0];

    // Wake up n8n Wait Node via resume webhook
    let n8nResumeTriggered = false;
    let n8nResumeMessage = '';

    const action = targetStatus === 'MODIFIED' ? 'MODIFY' : (targetStatus === 'REJECTED' ? 'REJECT' : 'APPROVE');
    const resumePayload = {
      draft_id: id,
      action,
      reviewed_by: reviewerEmail,
      subject: finalSubject,
      body: finalBody,
    };

    // 1. Try draft's specific approval_resume_url if present
    if (existing.approval_resume_url) {
      try {
        let resumeUrl = existing.approval_resume_url;
        if (!resumeUrl.includes('email-reply-approval')) {
          resumeUrl = resumeUrl.includes('?')
            ? resumeUrl.replace('?', '/email-reply-approval?')
            : `${resumeUrl}/email-reply-approval`;
        }
        const response = await fetch(resumeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resumePayload),
        });
        if (response.ok) {
          n8nResumeTriggered = true;
          n8nResumeMessage = 'Successfully resumed n8n via execution resume URL';
        }
      } catch (err: any) {
        this.logger.warn(`Failed to resume n8n via resumeUrl: ${err.message}`);
      }
    }

    // 2. Also attempt general n8n approval resume webhook
    if (!n8nResumeTriggered) {
      const webhookUrls = [
        'http://localhost:5678/webhook/approval-resume',
        'http://127.0.0.1:5678/webhook/approval-resume',
        'http://localhost:5678/webhook-waiting/email-reply-approval',
      ];

      for (const webhookUrl of webhookUrls) {
        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resumePayload),
          });
          if (response.ok) {
            n8nResumeTriggered = true;
            n8nResumeMessage = `Successfully notified n8n webhook at ${webhookUrl}`;
            break;
          }
        } catch {
          // Ignore and continue fallback
        }
      }
    }

    return {
      ...updated,
      n8n_resumed: n8nResumeTriggered,
      n8n_message: n8nResumeMessage || 'Status updated in DB. n8n will process on next trigger or active wait.',
    };
  }

  async recordDraftNotification(data: {
    draft_id: number;
    ticket_code?: string;
    recipient_email?: string;
    confidence?: number;
    resume_url?: string;
    execution_id?: string;
  }) {
    if (data.draft_id) {
      const res = await this.db.query(
        `UPDATE email_drafts 
         SET approval_resume_url = COALESCE($1, approval_resume_url),
             n8n_execution_id = COALESCE($2, n8n_execution_id)
         WHERE id = $3
         RETURNING *`,
        [data.resume_url || null, data.execution_id || null, data.draft_id]
      );
      return res.rows[0];
    }
    return { success: true };
  }

  async syncDraftStatus(data: { draft_id: number; status: string }) {
    if (data.draft_id) {
      const res = await this.db.query(
        `UPDATE email_drafts 
         SET status = $1, sent_at = CASE WHEN $1 = 'SENT' THEN CURRENT_TIMESTAMP ELSE sent_at END
         WHERE id = $2
         RETURNING *`,
        [data.status, data.draft_id]
      );
      return res.rows[0];
    }
    return { success: true };
  }

  async saveDailySummary(payload: any) {
    const summaryDate = payload.summary_date || new Date().toISOString().slice(0, 10);
    const totalReceived = Number(payload.total_received) || 0;
    const totalP1 = Number(payload.total_p1) || 0;
    const pendingTickets = Number(payload.pending_tickets || payload.total_pending_tickets) || 0;
    const keyInsights =
      typeof payload.key_insights === 'string'
        ? payload.key_insights
        : JSON.stringify(payload.key_insights || '');
    const riskSummary = payload.risk_summary || '';
    const recommendations = JSON.stringify(payload.recommendations || []);
    const negativeIssues = JSON.stringify(payload.negative_issues || []);
    const categories = JSON.stringify(payload.categories || {});
    const priorities = JSON.stringify(payload.priorities || {});
    const incidentSpike = Boolean(payload.incident_spike);
    const incidentCount = Number(payload.incident_count) || 0;
    const baselineCount = payload.baseline_count !== undefined && payload.baseline_count !== null ? Number(payload.baseline_count) : null;
    const increasePercent = payload.increase_percent !== undefined && payload.increase_percent !== null ? Number(payload.increase_percent) : null;
    const recipientCount = Number(payload.recipient_count) || 0;
    const sentCount = Number(payload.sent_count) || 0;
    const failedCount = Number(payload.failed_count) || 0;

    const res = await this.db.query(
      `INSERT INTO daily_summaries (
        summary_date, total_received, total_p1, total_pending_tickets, key_insights,
        risk_summary, recommendations, negative_issues, categories, priorities,
        incident_spike, incident_count, baseline_count, increase_percent,
        recipient_count, sent_count, failed_count
      ) VALUES (
        $1::date, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb,
        $11, $12, $13, $14, $15, $16, $17
      )
      ON CONFLICT (summary_date) DO UPDATE SET
        total_received = EXCLUDED.total_received,
        total_p1 = EXCLUDED.total_p1,
        total_pending_tickets = EXCLUDED.total_pending_tickets,
        key_insights = EXCLUDED.key_insights,
        risk_summary = EXCLUDED.risk_summary,
        recommendations = EXCLUDED.recommendations,
        negative_issues = EXCLUDED.negative_issues,
        incident_spike = EXCLUDED.incident_spike,
        incident_count = EXCLUDED.incident_count,
        baseline_count = EXCLUDED.baseline_count,
        increase_percent = EXCLUDED.increase_percent,
        recipient_count = EXCLUDED.recipient_count,
        sent_count = EXCLUDED.sent_count,
        failed_count = EXCLUDED.failed_count
      RETURNING *`,
      [
        summaryDate,
        totalReceived,
        totalP1,
        pendingTickets,
        keyInsights,
        riskSummary,
        recommendations,
        negativeIssues,
        categories,
        priorities,
        incidentSpike,
        incidentCount,
        baselineCount,
        increasePercent,
        recipientCount,
        sentCount,
        failedCount,
      ]
    );
    return res.rows[0];
  }

  async getDailySummaries(limit = 30) {
    const res = await this.db.query(
      'SELECT * FROM daily_summaries ORDER BY summary_date DESC LIMIT $1',
      [limit]
    );
    return res.rows;
  }

  async getDigestRecipients() {
    const res = await this.db.query(
      'SELECT * FROM daily_digest_recipients WHERE is_active = true ORDER BY id ASC'
    );
    return res.rows;
  }
}

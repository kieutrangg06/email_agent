import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class KnowledgeService {
  constructor(private readonly db: DatabaseService) {}

  async searchKnowledge(query?: string) {
    if (!query) {
      const res = await this.db.query('SELECT * FROM knowledge_base ORDER BY id ASC');
      return res.rows;
    }
    const res = await this.db.query(
      `SELECT * FROM knowledge_base 
       WHERE keywords ILIKE $1 OR content ILIKE $1 OR topic ILIKE $1`,
      [`%${query}%`]
    );
    return res.rows;
  }

  async getAllDrafts() {
    const res = await this.db.query('SELECT * FROM email_drafts ORDER BY created_at DESC');
    return res.rows;
  }

  async createDraft(payload: {
    ticket_code?: string;
    recipient_email: string;
    proposed_subject: string;
    proposed_body: string;
    confidence_score?: number;
  }) {
    const res = await this.db.query(
      `INSERT INTO email_drafts (ticket_code, recipient_email, proposed_subject, proposed_body, confidence_score, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING_APPROVAL')
       RETURNING *`,
      [
        payload.ticket_code || null,
        payload.recipient_email,
        payload.proposed_subject,
        payload.proposed_body,
        payload.confidence_score || 85.0,
      ]
    );
    return res.rows[0];
  }

  async updateDraftStatus(id: number, status: string, reviewed_by?: string) {
    const res = await this.db.query(
      `UPDATE email_drafts 
       SET status = $1, reviewed_by = $2 
       WHERE id = $3 
       RETURNING *`,
      [status, reviewed_by || 'Admin Evaluator', id]
    );
    return res.rows[0];
  }

  async saveDailySummary(payload: {
    summary_date?: string;
    total_received: number;
    total_p1: number;
    key_insights: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO daily_summaries (summary_date, total_received, total_p1, key_insights)
       VALUES (COALESCE($1::date, CURRENT_DATE), $2, $3, $4)
       RETURNING *`,
      [payload.summary_date || null, payload.total_received, payload.total_p1, payload.key_insights]
    );
    return res.rows[0];
  }

  async getDailySummaries() {
    const res = await this.db.query('SELECT * FROM daily_summaries ORDER BY summary_date DESC LIMIT 30');
    return res.rows;
  }
}

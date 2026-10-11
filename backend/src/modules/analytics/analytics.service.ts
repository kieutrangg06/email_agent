import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly db: DatabaseService) {}

  async saveDigest(payload: any) {
    this.logger.log(`Saving daily digest for date: ${payload.report_date || payload.summary_date}`);
    const reportDate = payload.report_date || payload.summary_date || new Date().toISOString().slice(0, 10);
    const query = `
      INSERT INTO daily_summaries (
        report_date, total_emails_received, total_tickets_created, 
        sla_compliance_rate, executive_summary, anomaly_detected, 
        incident_spike, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (report_date) DO UPDATE SET
        total_emails_received = EXCLUDED.total_emails_received,
        total_tickets_created = EXCLUDED.total_tickets_created,
        sla_compliance_rate = EXCLUDED.sla_compliance_rate,
        executive_summary = EXCLUDED.executive_summary,
        anomaly_detected = EXCLUDED.anomaly_detected,
        incident_spike = EXCLUDED.incident_spike
      RETURNING *;
    `;
    const values = [
      reportDate,
      Number(payload.total_emails_received || payload.total_received || 0),
      Number(payload.total_tickets_created || payload.total_tickets || 0),
      Number(payload.sla_compliance_rate || 100.0),
      payload.executive_summary || payload.key_insights || 'Hệ thống vận hành ổn định',
      Boolean(payload.anomaly_detected || payload.incident_spike || false),
      Boolean(payload.incident_spike || payload.anomaly_detected || false),
    ];

    const res = await this.db.query(query, values);
    return res.rows[0];
  }

  async getLatestDigests(limit = 10) {
    const res = await this.db.query(
      `SELECT * FROM daily_summaries ORDER BY report_date DESC LIMIT $1;`,
      [limit]
    );
    return res.rows;
  }

  async getDailyStats() {
    const inboundRes = await this.db.query(
      `SELECT 
         (SELECT COUNT(*) FROM email_triage_logs WHERE created_at >= CURRENT_DATE) as total_emails_today,
         (SELECT COUNT(*) FROM email_quarantine_vault WHERE created_at >= CURRENT_DATE) as spam_blocked_today;`
    );
    const ticketsRes = await this.db.query(
      `SELECT 
         COUNT(*) as total_tickets,
         COUNT(*) FILTER (WHERE status = 'RESOLVED' OR status = 'CLOSED') as resolved_tickets,
         COUNT(*) FILTER (WHERE priority ILIKE '%P1%') as p1_count,
         COALESCE(ROUND((COUNT(*) FILTER (WHERE status = 'RESOLVED' OR status = 'CLOSED')::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 2), 100.0) as sla_compliance_rate
       FROM tickets 
       WHERE created_at >= NOW() - INTERVAL '24 hours';`
    );

    return {
      inbound: inboundRes.rows[0] || { total_emails_today: 0, spam_blocked_today: 0 },
      tickets: ticketsRes.rows[0] || { total_tickets: 0, resolved_tickets: 0, p1_count: 0, sla_compliance_rate: 100.0 },
      generated_at: new Date().toISOString(),
    };
  }
}

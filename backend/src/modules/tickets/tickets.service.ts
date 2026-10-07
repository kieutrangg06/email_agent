import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly db: DatabaseService) {}

  async getDepartments() {
    const res = await this.db.query('SELECT id, name, description, head_email FROM departments ORDER BY id ASC;');
    return res.rows;
  }

  async getRecentLogs(category?: string, priority?: string) {
    let query = 'SELECT * FROM email_triage_logs WHERE 1=1';
    const params: any[] = [];
    if (category && category !== 'All') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (priority && priority !== 'All') {
      params.push(`%${priority}%`);
      query += ` AND priority ILIKE $${params.length}`;
    }
    query += ' ORDER BY created_at DESC LIMIT 100;';
    const res = await this.db.query(query, params);
    return res.rows;
  }

  async getStats() {
    const [totalRes, p1Res, techRes, pendingRes, ticketsRes] = await Promise.all([
      this.db.query('SELECT COUNT(*) FROM email_triage_logs;'),
      this.db.query("SELECT COUNT(*) FROM email_triage_logs WHERE priority ILIKE '%P1%';"),
      this.db.query("SELECT COUNT(*) FROM email_triage_logs WHERE category = 'Technical';"),
      this.db.query("SELECT COUNT(*) FROM email_triage_logs WHERE status = 'PENDING';"),
      this.db.query("SELECT COUNT(*) FROM tickets WHERE status = 'OPEN';"),
    ]);

    return {
      total: parseInt(totalRes.rows[0]?.count || '0', 10),
      p1Count: parseInt(p1Res.rows[0]?.count || '0', 10),
      techCount: parseInt(techRes.rows[0]?.count || '0', 10),
      pendingCount: parseInt(pendingRes.rows[0]?.count || '0', 10),
      openTicketsCount: parseInt(ticketsRes.rows[0]?.count || '0', 10),
    };
  }

  async updateTriageStatus(id: number, status: string) {
    const res = await this.db.query(
      'UPDATE email_triage_logs SET status = $1 WHERE id = $2 RETURNING *;',
      [status, id]
    );
    return res.rows[0];
  }

  async createTicket(data: any) {
    const code = data.ticket_code || `TICK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const category = data.category || 'Technical';
    const priority = data.priority || 'P1 - Critical';
    const assignedTo = data.assigned_to || 'Nguyễn Văn An';
    const agentEmail = data.agent_email || 'tranglee12306@gmail.com';
    const senderEmail = data.sender_email || 'guest@enterprise.com';
    const title = data.title || 'Yêu cầu hỗ trợ';
    const description = data.description || '';
    const summary = data.summary || description.substring(0, 200);

    const res = await this.db.query(
      `INSERT INTO tickets 
       (ticket_code, sender_email, title, description, summary, category, priority, assigned_to, agent_email, first_response_sla, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '2 hours', 'OPEN')
       ON CONFLICT (ticket_code) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         summary = EXCLUDED.summary,
         category = EXCLUDED.category,
         priority = EXCLUDED.priority,
         assigned_to = EXCLUDED.assigned_to,
         agent_email = EXCLUDED.agent_email
       RETURNING *;`,
      [code, senderEmail, title, description, summary, category, priority, assignedTo, agentEmail]
    );

    // Cập nhật tăng số lượng ticket của agent
    if (agentEmail) {
      await this.db.query(
        'UPDATE support_agents SET active_tickets_count = active_tickets_count + 1 WHERE email = $1;',
        [agentEmail]
      ).catch((err) => this.logger.warn(`Could not update agent tickets count: ${err.message}`));
    }

    return { status: 'created', ticket: res.rows[0] };
  }

  async getAllTickets(status?: string, priority?: string) {
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params: any[] = [];
    if (status && status !== 'All') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (priority && priority !== 'All') {
      params.push(`%${priority}%`);
      query += ` AND priority ILIKE $${params.length}`;
    }
    query += ' ORDER BY id DESC;';
    const res = await this.db.query(query, params);
    return res.rows;
  }

  async getTicketByCode(ticketCode: string) {
    const res = await this.db.query('SELECT * FROM tickets WHERE ticket_code = $1;', [ticketCode]);
    return res.rows[0] || null;
  }

  async updateTicketStatus(ticketCode: string, status: string) {
    const res = await this.db.query(
      'UPDATE tickets SET status = $1 WHERE ticket_code = $2 RETURNING *;',
      [status, ticketCode]
    );
    return res.rows[0];
  }

  async resolveTicket(code: string) {
    const res = await this.db.query(
      "UPDATE tickets SET status = 'RESOLVED', resolved_at = NOW() WHERE ticket_code = $1 RETURNING *;",
      [code]
    );
    if (res.rows.length > 0 && res.rows[0].agent_email) {
      await this.db.query(
        'UPDATE support_agents SET active_tickets_count = GREATEST(active_tickets_count - 1, 0) WHERE email = $1;',
        [res.rows[0].agent_email]
      ).catch((err) => this.logger.warn(`Could not decrement agent ticket count: ${err.message}`));
    }
    return res.rows[0];
  }

  async getAvailableAgents(category?: string) {
    let query = "SELECT * FROM support_agents WHERE status = 'AVAILABLE'";
    const params: any[] = [];
    if (category) {
      params.push(category);
      query += ` AND category = $1`;
    }
    query += ' ORDER BY active_tickets_count ASC;';
    const res = await this.db.query(query, params);
    return res.rows;
  }

  async getSlaStats() {
    const res = await this.db.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'OPEN' AND first_response_sla < NOW() THEN 1 END) AS breached,
        COUNT(CASE WHEN status = 'OPEN' AND first_response_sla >= NOW() THEN 1 END) AS on_track,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) AS resolved
      FROM tickets;
    `);
    return res.rows[0];
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly db: DatabaseService) {}

  async getDepartments() {
    const res = await this.db.query(
      `SELECT id, 
              COALESCE(code, UPPER(SUBSTRING(name FROM 1 FOR 4))) as code, 
              name, 
              description, 
              COALESCE(manager_email, head_email, 'tranglee12306@gmail.com') as manager_email, 
              COALESCE(head_email, manager_email, 'tranglee12306@gmail.com') as head_email,
              COALESCE(is_active, true) as is_active 
       FROM departments 
       ORDER BY id ASC;`
    );
    if (!res.rows || res.rows.length === 0) {
      return [
        { id: 1, code: 'TECH', name: 'Technical', description: 'Khắc phục sự cố API, hạ tầng kỹ thuật', manager_email: 'tranglee12306@gmail.com', head_email: 'tranglee12306@gmail.com', is_active: true },
        { id: 2, code: 'SALES', name: 'Sales', description: 'Tư vấn kinh doanh & báo giá giải pháp', manager_email: 'tranglee12306@gmail.com', head_email: 'tranglee12306@gmail.com', is_active: true },
        { id: 3, code: 'FINANCE', name: 'Finance', description: 'Đối soát hóa đơn & thanh toán', manager_email: 'tranglee12306@gmail.com', head_email: 'tranglee12306@gmail.com', is_active: true },
        { id: 4, code: 'GENERAL', name: 'General', description: 'Hỗ trợ giải đáp chung & thông tin', manager_email: 'tranglee12306@gmail.com', head_email: 'tranglee12306@gmail.com', is_active: true },
      ];
    }
    return res.rows;
  }

  async getRecentLogs(category?: string, priority?: string) {
    let query = 'SELECT * FROM email_triage_logs WHERE 1=1';
    const params: any[] = [];
    if (category && category !== 'All') {
      params.push(category);
      query += ` AND (category = $${params.length} OR classified_department = $${params.length})`;
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
      this.db.query("SELECT COUNT(*) FROM email_triage_logs WHERE category = 'Technical' OR classified_department = 'TECH';"),
      this.db.query("SELECT COUNT(*) FROM email_triage_logs WHERE status = 'PENDING';"),
      this.db.query("SELECT COUNT(*) FROM tickets WHERE status IN ('OPEN', 'PENDING');"),
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
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = data.ticket_code || `TK-${today}-${Math.floor(1000 + Math.random() * 9000)}`;
    const category = data.category || 'Technical';
    const priority = data.priority || 'P1 - Critical';
    const assignedTo = data.assigned_to || 'Nguyễn Văn An';
    const agentEmail = data.agent_email || 'tranglee12306@gmail.com';
    const senderEmail = data.customer_email || data.sender_email || 'guest@enterprise.com';
    const title = data.title || data.subject || 'Yêu cầu hỗ trợ kỹ thuật';
    const description = data.description || '';
    const summary = data.summary || description.substring(0, 200);
    const assignedAgentId = data.assigned_agent_id ? parseInt(String(data.assigned_agent_id), 10) : null;
    const ticketStatus = data.status || 'PENDING';

    const pri = String(priority);
    let slaInterval = '8 hours';
    if (pri.includes('P1')) slaInterval = '2 hours';
    else if (pri.includes('P2')) slaInterval = '4 hours';
    else if (pri.includes('P3')) slaInterval = '8 hours';
    else if (pri.includes('P4')) slaInterval = '24 hours';

    const res = await this.db.query(
      `INSERT INTO tickets 
       (ticket_code, customer_email, sender_email, subject, title, description, summary, category, priority, assigned_agent_id, assigned_to, agent_email, sla_due_at, first_response_sla, status)
       VALUES ($1, $2, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '${slaInterval}', NOW() + INTERVAL '${slaInterval}', $11)
       ON CONFLICT (ticket_code) DO UPDATE SET
         subject = EXCLUDED.subject,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         summary = EXCLUDED.summary,
         category = EXCLUDED.category,
         priority = EXCLUDED.priority,
         assigned_to = EXCLUDED.assigned_to,
         agent_email = EXCLUDED.agent_email,
         assigned_agent_id = EXCLUDED.assigned_agent_id,
         status = EXCLUDED.status
       RETURNING *;`,
      [code, senderEmail, title, description, summary, category, priority, assignedAgentId, assignedTo, agentEmail, ticketStatus]
    );

    if (agentEmail) {
      await this.db.query(
        'UPDATE support_agents SET active_tickets_count = active_tickets_count + 1 WHERE email = $1;',
        [agentEmail]
      ).catch((err) => this.logger.warn(`Could not update agent tickets count: ${err.message}`));
    }

    // Tự động thêm comment phân tích ban đầu nếu có reproduce steps
    if (data.reproduce_steps || data.affected_module) {
      const commentText = `🤖 [AI Ticket Extractor Agent 3 - Khởi tạo tự động]\n- Module ảnh hưởng: ${data.affected_module || 'Hạ tầng / Ứng dụng'}\n- Các bước tái hiện:\n${Array.isArray(data.reproduce_steps) ? data.reproduce_steps.map((s: string, idx: number) => `  ${idx + 1}. ${s}`).join('\n') : data.reproduce_steps}\n- Tóm tắt: ${summary}`;
      await this.addTicketComment({
        ticket_code: code,
        ticket_id: res.rows[0]?.id,
        author_type: 'AI_AGENT',
        content: commentText,
      }).catch((e) => this.logger.warn(`Could not insert initial AI comment: ${e.message}`));
    }

    return { status: 'created', ticket: res.rows[0] };
  }

  async addTicketComment(data: { ticket_code?: string; ticket_id?: number; author_type: string; content: string }) {
    let ticketId = data.ticket_id;
    if (!ticketId && data.ticket_code) {
      const tRes = await this.db.query('SELECT id FROM tickets WHERE ticket_code = $1;', [data.ticket_code]);
      ticketId = tRes.rows[0]?.id;
    }

    const res = await this.db.query(
      `INSERT INTO ticket_comments (ticket_id, ticket_code, author_type, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [ticketId || null, data.ticket_code || '', data.author_type || 'SYSTEM', data.content]
    );

    return res.rows[0];
  }

  async getTicketComments(ticketCode: string) {
    const res = await this.db.query(
      'SELECT * FROM ticket_comments WHERE ticket_code = $1 ORDER BY created_at ASC;',
      [ticketCode]
    );
    return res.rows;
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
    let query = "SELECT id, full_name, name, email, active_tickets_count, category, status, is_active FROM support_agents WHERE (status = 'AVAILABLE' OR is_active = true)";
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
        COUNT(CASE WHEN status IN ('OPEN', 'PENDING') AND COALESCE(sla_due_at, first_response_sla) < NOW() THEN 1 END) AS breached,
        COUNT(CASE WHEN status IN ('OPEN', 'PENDING') AND COALESCE(sla_due_at, first_response_sla) >= NOW() THEN 1 END) AS on_track,
        COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END) AS resolved
      FROM tickets;
    `);
    return res.rows[0];
  }

  async getQuarantineLogs() {
    const res = await this.db.query(`
      SELECT id, sender_email, subject, quarantine_reason as reason, raw_payload as payload, created_at, 'email_quarantine_vault' as source
      FROM email_quarantine_vault
      UNION ALL
      SELECT id, COALESCE(payload->>'sender_email', payload->>'from', 'unknown') as sender_email, 
             COALESCE(payload->>'subject', event_type) as subject,
             event_type as reason, payload, created_at, source
      FROM system_audit_logs 
      WHERE event_type LIKE '%QUARANTINE%' OR event_type LIKE '%BLACKLIST%' OR event_type LIKE '%SPAM%'
      ORDER BY created_at DESC 
      LIMIT 100;
    `);
    return res.rows;
  }
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class TicketsService {
  constructor(private readonly db: DatabaseService) {}

  async getDepartments() {
    const res = await this.db.query('SELECT * FROM departments ORDER BY id ASC');
    return res.rows;
  }

  async getAllTickets() {
    const res = await this.db.query('SELECT * FROM tickets ORDER BY created_at DESC');
    return res.rows;
  }

  async getTicketByCode(ticketCode: string) {
    const res = await this.db.query('SELECT * FROM tickets WHERE ticket_code = $1', [ticketCode]);
    return res.rows[0] || null;
  }

  async createTicket(payload: {
    ticket_code?: string;
    sender_email: string;
    title: string;
    description: string;
    category?: string;
    assigned_to?: string;
    priority?: string;
    first_response_sla?: Date;
  }) {
    const code = payload.ticket_code || `TICK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await this.db.query(
      `INSERT INTO tickets (ticket_code, sender_email, title, description, category, assigned_to, priority, status, first_response_sla)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', $8)
       RETURNING *`,
      [
        code,
        payload.sender_email,
        payload.title,
        payload.description,
        payload.category || 'General',
        payload.assigned_to || 'Unassigned',
        payload.priority || 'P3',
        payload.first_response_sla || new Date(Date.now() + 2 * 60 * 60 * 1000),
      ]
    );
    return res.rows[0];
  }

  async updateTicketStatus(ticketCode: string, status: string) {
    const res = await this.db.query(
      'UPDATE tickets SET status = $1 WHERE ticket_code = $2 RETURNING *',
      [status, ticketCode]
    );
    return res.rows[0];
  }
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class CrmService {
  constructor(private readonly db: DatabaseService) {}

  async getAllCustomers() {
    const res = await this.db.query('SELECT * FROM crm_customers ORDER BY created_at DESC');
    return res.rows;
  }

  async upsertLead(payload: {
    email: string;
    full_name?: string;
    company?: string;
    phone?: string;
    lead_score?: number;
    status?: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO crm_customers (email, full_name, company, phone, lead_score, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE SET
         full_name = COALESCE(EXCLUDED.full_name, crm_customers.full_name),
         company = COALESCE(EXCLUDED.company, crm_customers.company),
         phone = COALESCE(EXCLUDED.phone, crm_customers.phone),
         lead_score = EXCLUDED.lead_score,
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        payload.email,
        payload.full_name || null,
        payload.company || null,
        payload.phone || null,
        payload.lead_score || 0,
        payload.status || 'NEW',
      ]
    );
    return res.rows[0];
  }
}

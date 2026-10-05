import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface CrmNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  invoiceNumber?: string;
  createdAt: string;
}

@Injectable()
export class CrmService {
  private notifications: CrmNotification[] = [];

  constructor(private readonly db: DatabaseService) {}

  async getAllCustomers() {
    const res = await this.db.query(
      'SELECT * FROM crm_customers ORDER BY created_at DESC'
    );
    return res.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name || '',
      company: row.company || '',
      phone: row.phone || '',
      lead_score: Number(row.lead_score || 0),
      status: row.status || 'NEW',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async upsertLead(payload: any) {
    const email = payload.email || payload.senderEmail || payload.sender_email;
    if (!email) {
      throw new Error('Email is required for CRM Lead');
    }

    const fullName =
      payload.full_name ||
      payload.fullName ||
      payload.sender_name ||
      payload.senderName ||
      'Khách hàng tiềm năng';

    const company =
      payload.company ||
      payload.companyName ||
      payload.sender_company ||
      'Doanh nghiệp liên hệ';

    const phone = payload.phone || payload.phoneNumber || null;

    let leadScore = 50;
    if (payload.lead_score !== undefined) {
      leadScore = Number(payload.lead_score);
    } else if (payload.leadScore !== undefined) {
      leadScore = Number(payload.leadScore);
    } else if (payload.score !== undefined) {
      leadScore = Number(payload.score);
    } else {
      // Calculate dynamic score if budget or dealValue is provided
      const dealValue = Number(
        payload.dealValue || payload.deal_value || payload.budget || 0
      );
      if (dealValue >= 50000000) leadScore += 40;
      if (phone) leadScore += 10;
    }

    const status =
      payload.status || (leadScore >= 80 ? 'PRIORITY_SALES' : 'QUALIFIED');

    const res = await this.db.query(
      `INSERT INTO crm_customers (email, full_name, company, phone, lead_score, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE SET
         full_name = COALESCE(EXCLUDED.full_name, crm_customers.full_name),
         company = COALESCE(EXCLUDED.company, crm_customers.company),
         phone = COALESCE(EXCLUDED.phone, crm_customers.phone),
         lead_score = GREATEST(EXCLUDED.lead_score, crm_customers.lead_score),
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [email, fullName, company, phone, leadScore, status]
    );

    return res.rows[0];
  }

  async addNotification(payload: any) {
    const notif: CrmNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: payload.type || 'INFO',
      title: payload.title || 'Thông báo hệ thống',
      message: payload.message || '',
      invoiceNumber: payload.invoiceNumber || payload.invoice_number,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    if (this.notifications.length > 50) {
      this.notifications.pop();
    }
    return { success: true, notification: notif };
  }

  async getNotifications() {
    return this.notifications;
  }
}

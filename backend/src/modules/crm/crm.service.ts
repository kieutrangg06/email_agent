import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface CrmCustomerDto {
  fullName?: string;
  full_name?: string;
  email: string;
  phone?: string;
  companyName?: string;
  company_name?: string;
  company?: string;
  leadScore?: number;
  lead_score?: number;
  isUnsubscribed?: boolean;
  is_unsubscribed?: boolean;
}

export interface CrmDealDto {
  customerId?: number;
  customer_id?: number;
  email?: string;
  dealName?: string;
  deal_name?: string;
  expectedBudget?: number;
  expected_budget?: number;
  stage?: string;
  campaignTag?: string;
  campaign_tag?: string;
  assignedSalesRep?: string;
  assigned_sales_rep?: string;
}

@Injectable()
export class CrmService {
  constructor(private readonly db: DatabaseService) {}

  async getAllCustomers() {
    const res = await this.db.query(
      `SELECT * FROM crm_customers ORDER BY created_at DESC`
    );
    return res.rows.map((row: any) => ({
      id: row.id,
      full_name: row.full_name || '',
      email: row.email,
      phone: row.phone || '',
      company_name: row.company_name || row.company || 'Doanh nghiệp đối tác',
      lead_score: Number(row.lead_score || 0),
      is_unsubscribed: Boolean(row.is_unsubscribed),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async upsertCustomer(dto: CrmCustomerDto) {
    const email = dto.email;
    if (!email) throw new Error('Email is required');

    const fullName = dto.fullName || dto.full_name || 'Khách hàng tiềm năng';
    const phone = dto.phone || null;
    const company = dto.companyName || dto.company_name || dto.company || 'Doanh nghiệp đối tác';
    const leadScore = Number(dto.leadScore ?? dto.lead_score ?? 65);
    const isUnsubscribed = Boolean(dto.isUnsubscribed ?? dto.is_unsubscribed ?? false);

    const res = await this.db.query(
      `INSERT INTO crm_customers (email, full_name, phone, company_name, company, lead_score, is_unsubscribed, updated_at)
       VALUES ($1, $2, $3, $4, $4, $5, $6, NOW())
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         phone = COALESCE(EXCLUDED.phone, crm_customers.phone),
         company_name = EXCLUDED.company_name,
         company = EXCLUDED.company_name,
         lead_score = GREATEST(EXCLUDED.lead_score, crm_customers.lead_score),
         is_unsubscribed = EXCLUDED.is_unsubscribed,
         updated_at = NOW()
       RETURNING *`,
      [email, fullName, phone, company, leadScore, isUnsubscribed]
    );

    return res.rows[0];
  }

  async getAllDeals() {
    const res = await this.db.query(
      `SELECT d.*, c.full_name as customer_name, c.email as customer_email, c.phone as customer_phone, c.lead_score
       FROM crm_deals d
       LEFT JOIN crm_customers c ON d.customer_id = c.id
       ORDER BY d.created_at DESC`
    );
    return res.rows;
  }

  async createDeal(dto: CrmDealDto) {
    let customerId = dto.customerId || dto.customer_id;

    if (!customerId && dto.email) {
      const cust = await this.upsertCustomer({ email: dto.email });
      customerId = cust.id;
    }

    const dealName = dto.dealName || dto.deal_name || 'Cơ hội tư vấn giải pháp CRM';
    const expectedBudget = Number(dto.expectedBudget ?? dto.expected_budget ?? 20000000);
    const stage = dto.stage || 'NEW_INQUIRY';
    const campaignTag = dto.campaignTag || dto.campaign_tag || 'ORGANIC';
    const assignedSalesRep = dto.assignedSalesRep || dto.assigned_sales_rep || 'Nguyễn Văn An';

    const res = await this.db.query(
      `INSERT INTO crm_deals (customer_id, deal_name, expected_budget, stage, campaign_tag, assigned_sales_rep, followup_count, last_contacted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, NOW(), NOW(), NOW())
       RETURNING *`,
      [customerId, dealName, expectedBudget, stage, campaignTag, assignedSalesRep]
    );

    return res.rows[0];
  }

  async updateDealActivity(dealId: number, data: { stage?: string; note?: string }) {
    const res = await this.db.query(
      `UPDATE crm_deals
       SET followup_count = followup_count + 1,
           last_contacted_at = NOW(),
           stage = COALESCE($2, stage),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [dealId, data.stage || null]
    );
    return res.rows[0];
  }
}

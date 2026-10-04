import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly db: DatabaseService) {}

  async getAllInvoices() {
    const res = await this.db.query('SELECT * FROM finance_invoices ORDER BY created_at DESC');
    return res.rows;
  }

  async createInvoice(payload: {
    invoice_number: string;
    vendor_name: string;
    tax_code: string;
    subtotal: number;
    vat_amount: number;
    total_amount: number;
    is_valid?: boolean;
    file_path?: string;
  }) {
    const isValid = payload.is_valid !== undefined 
      ? payload.is_valid 
      : (Math.abs((payload.subtotal + payload.vat_amount) - payload.total_amount) < 0.01);

    const res = await this.db.query(
      `INSERT INTO finance_invoices (invoice_number, vendor_name, tax_code, subtotal, vat_amount, total_amount, is_valid, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (invoice_number) DO UPDATE SET
         vendor_name = EXCLUDED.vendor_name,
         tax_code = EXCLUDED.tax_code,
         subtotal = EXCLUDED.subtotal,
         vat_amount = EXCLUDED.vat_amount,
         total_amount = EXCLUDED.total_amount,
         is_valid = EXCLUDED.is_valid,
         file_path = EXCLUDED.file_path
       RETURNING *`,
      [
        payload.invoice_number,
        payload.vendor_name,
        payload.tax_code,
        payload.subtotal,
        payload.vat_amount,
        payload.total_amount,
        isValid,
        payload.file_path || null,
      ]
    );
    return res.rows[0];
  }
}

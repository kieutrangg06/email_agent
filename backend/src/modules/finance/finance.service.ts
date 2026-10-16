import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

export interface InvoiceDto {
  invoiceNumber?: string;
  invoice_number?: string;
  sellerTaxId?: string;
  seller_tax_id?: string;
  taxCode?: string;
  tax_code?: string;
  sellerName?: string;
  seller_name?: string;
  vendorName?: string;
  vendor_name?: string;
  buyerName?: string;
  buyer_name?: string;
  buyerEmail?: string;
  buyer_email?: string;
  issueDate?: string;
  issue_date?: string;
  subtotal?: number;
  vatAmount?: number;
  vat_amount?: number;
  totalAmount?: number;
  total_amount?: number;
  mathStatus?: string;
  math_status?: string;
  status?: string;
  fileStoragePath?: string;
  file_storage_path?: string;
  storagePath?: string;
  storage_path?: string;
  filePath?: string;
  file_path?: string;
}

@Injectable()
export class FinanceService {
  constructor(private readonly db: DatabaseService) {}

  async getAllInvoices() {
    const res = await this.db.query(
      `SELECT * FROM finance_invoices ORDER BY created_at DESC`
    );
    return res.rows.map((row: any) => {
      const subtotal = Number(row.subtotal || 0);
      const vatAmount = Number(row.vat_amount || 0);
      const totalAmount = Number(row.total_amount || 0);
      const calculatedTotal = subtotal + vatAmount;
      const discrepancy = Math.abs(calculatedTotal - totalAmount);
      const isMathValid = row.math_status === 'VALIDATED' || discrepancy <= 1.0;

      return {
        id: row.id,
        invoice_number: row.invoice_number,
        seller_tax_id: row.seller_tax_id || row.tax_code || '0402123456',
        tax_code: row.seller_tax_id || row.tax_code || '0402123456',
        seller_name: row.seller_name || row.vendor_name || 'Doanh nghiệp phát hành',
        vendor_name: row.seller_name || row.vendor_name || 'Doanh nghiệp phát hành',
        buyer_name: row.buyer_name || 'Khách hàng',
        buyer_email: row.buyer_email || '',
        issue_date: row.issue_date,
        subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        calculated_total: calculatedTotal,
        discrepancy,
        is_math_valid: isMathValid,
        math_status: row.math_status || (isMathValid ? 'VALIDATED' : 'DISCREPANCY_FLAGGED'),
        status: isMathValid ? 'VALID' : 'FLAGGED_SUSPICIOUS',
        file_storage_path: row.file_storage_path || row.storage_path || row.file_path || '',
        storage_path: row.file_storage_path || row.storage_path || row.file_path || '',
        created_at: row.created_at,
      };
    });
  }

  async saveInvoice(dto: InvoiceDto) {
    const invoiceNumber =
      dto.invoiceNumber ||
      dto.invoice_number ||
      `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const sellerTaxId =
      dto.sellerTaxId || dto.seller_tax_id || dto.taxCode || dto.tax_code || '0402123456';
    const sellerName =
      dto.sellerName || dto.seller_name || dto.vendorName || dto.vendor_name || 'Doanh nghiệp phát hành';
    const buyerName = dto.buyerName || dto.buyer_name || 'Khách hàng đối tác';
    const buyerEmail = dto.buyerEmail || dto.buyer_email || '';
    const issueDate = dto.issueDate || dto.issue_date || new Date().toISOString().split('T')[0];

    const subtotal = Number(dto.subtotal ?? 0);
    const vatAmount = Number(dto.vatAmount ?? dto.vat_amount ?? 0);
    const totalAmount = Number(dto.totalAmount ?? dto.total_amount ?? subtotal + vatAmount);

    const calculatedTotal = subtotal + vatAmount;
    const discrepancy = Math.abs(calculatedTotal - totalAmount);
    const isMathValid = discrepancy <= 1.0;

    const mathStatus =
      dto.mathStatus ||
      dto.math_status ||
      (isMathValid ? 'VALIDATED' : 'DISCREPANCY_FLAGGED');
    const status = isMathValid ? 'VALID' : 'FLAGGED_SUSPICIOUS';

    const fileStoragePath =
      dto.fileStoragePath ||
      dto.file_storage_path ||
      dto.storagePath ||
      dto.storage_path ||
      dto.filePath ||
      dto.file_path ||
      `/var/storage/invoices/${invoiceNumber}.pdf`;

    const res = await this.db.query(
      `INSERT INTO finance_invoices (
         invoice_number, seller_tax_id, seller_name,
         buyer_name, buyer_email, issue_date, subtotal, vat_amount, total_amount,
         math_status, file_storage_path, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (invoice_number) DO UPDATE SET
         seller_tax_id = EXCLUDED.seller_tax_id,
         seller_name = EXCLUDED.seller_name,
         buyer_name = EXCLUDED.buyer_name,
         buyer_email = EXCLUDED.buyer_email,
         issue_date = EXCLUDED.issue_date,
         subtotal = EXCLUDED.subtotal,
         vat_amount = EXCLUDED.vat_amount,
         total_amount = EXCLUDED.total_amount,
         math_status = EXCLUDED.math_status,
         file_storage_path = EXCLUDED.file_storage_path
       RETURNING *`,
      [
        invoiceNumber,
        sellerTaxId,
        sellerName,
        buyerName,
        buyerEmail,
        issueDate,
        subtotal,
        vatAmount,
        totalAmount,
        mathStatus,
        fileStoragePath,
      ]
    );

    // Record audit log
    try {
      const eventType = isMathValid ? 'INVOICE_OCR_PROCESSED' : 'INVOICE_DISCREPANCY_FLAGGED';
      const desc = isMathValid
        ? `Chứng từ hợp lệ: ${subtotal.toLocaleString('vi-VN')} + ${vatAmount.toLocaleString('vi-VN')} = ${totalAmount.toLocaleString('vi-VN')} VNĐ.`
        : `Cảnh báo sai lệch số học: Tiền hàng ${subtotal.toLocaleString('vi-VN')} + VAT ${vatAmount.toLocaleString('vi-VN')} = ${calculatedTotal.toLocaleString('vi-VN')} != Tổng tiền ${totalAmount.toLocaleString('vi-VN')} (Lệch ${discrepancy.toLocaleString('vi-VN')} VNĐ).`;

      await this.db.query(
        `INSERT INTO system_audit_logs (event_type, workflow_id, description, payload_snapshot, created_at)
         VALUES ($1, 'flow09_invoice_multimodal_ocr', $2, $3, NOW())`,
        [eventType, desc, JSON.stringify({ invoiceNumber, discrepancy, isMathValid })]
      );
    } catch (e: any) {
      console.warn('[FinanceService] Could not insert system audit log:', e?.message || e);
    }

    return {
      ...res.rows[0],
      calculated_total: calculatedTotal,
      discrepancy,
      is_math_valid: isMathValid,
    };
  }

  async getAuditLogs() {
    const res = await this.db.query(
      `SELECT * FROM system_audit_logs ORDER BY created_at DESC LIMIT 50`
    );
    return res.rows;
  }
}

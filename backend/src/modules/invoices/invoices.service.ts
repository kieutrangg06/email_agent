import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly db: DatabaseService) {}

  async getAllInvoices() {
    const res = await this.db.query(
      'SELECT * FROM finance_invoices ORDER BY created_at DESC'
    );
    return res.rows.map((row: any) => {
      const subtotal = Number(row.subtotal || 0);
      const vatAmount = Number(row.vat_amount || 0);
      const totalAmount = Number(row.total_amount || 0);
      const calculatedTotal = subtotal + vatAmount;
      const discrepancy = Math.abs(calculatedTotal - totalAmount);
      const isValid =
        row.is_valid !== undefined && row.is_valid !== null
          ? Boolean(row.is_valid)
          : row.status === 'VALID' || discrepancy < 0.01;

      return {
        id: row.id,
        invoice_number: row.invoice_number,
        issue_date: row.issue_date,
        vendor_name: row.vendor_name || row.seller_name || 'Doanh nghiệp phát hành',
        seller_name: row.seller_name || row.vendor_name || 'Doanh nghiệp phát hành',
        tax_code: row.tax_code || '',
        buyer_name: row.buyer_name || 'Khách hàng',
        buyer_email: row.buyer_email || '',
        subtotal: subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        calculated_total: calculatedTotal,
        discrepancy: discrepancy,
        is_valid: isValid,
        file_path: row.file_path || row.storage_path || '',
        storage_path: row.storage_path || row.file_path || '',
        status: row.status || (isValid ? 'VALID' : 'FLAGGED_SUSPICIOUS'),
        created_at: row.created_at,
      };
    });
  }

  async createInvoice(payload: any) {
    const invoiceNumber =
      payload.invoice_number ||
      payload.invoiceNumber ||
      `INV-${Date.now().toString().slice(-6)}`;

    const vendorName =
      payload.vendor_name ||
      payload.vendorName ||
      payload.seller_name ||
      payload.sellerName ||
      'Doanh nghiệp phát hành';

    const taxCode = payload.tax_code || payload.taxCode || '0402123456';
    const buyerName = payload.buyer_name || payload.buyerName || 'Khách hàng';
    const buyerEmail = payload.buyer_email || payload.buyerEmail || '';
    const issueDate = payload.issue_date || payload.issueDate || new Date().toISOString().split('T')[0];

    const subtotal = Number(payload.subtotal || 0);
    const vatAmount = Number(
      payload.vat_amount !== undefined
        ? payload.vat_amount
        : payload.vatAmount !== undefined
        ? payload.vatAmount
        : 0
    );
    const totalAmount = Number(
      payload.total_amount !== undefined
        ? payload.total_amount
        : payload.totalAmount !== undefined
        ? payload.totalAmount
        : subtotal + vatAmount
    );

    const calculatedTotal = subtotal + vatAmount;
    const discrepancy = Math.abs(calculatedTotal - totalAmount);

    const isValid =
      payload.is_valid !== undefined
        ? Boolean(payload.is_valid)
        : payload.status === 'VALID'
        ? true
        : discrepancy <= 1.0;

    const status = isValid ? 'VALID' : 'FLAGGED_SUSPICIOUS';
    const filePath =
      payload.file_path ||
      payload.filePath ||
      payload.storage_path ||
      payload.storagePath ||
      `/var/storage/invoices/${invoiceNumber}.pdf`;

    const res = await this.db.query(
      `INSERT INTO finance_invoices (
         invoice_number, issue_date, vendor_name, seller_name, tax_code,
         buyer_name, buyer_email, subtotal, vat_amount, total_amount,
         is_valid, file_path, storage_path, status, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
       ON CONFLICT (invoice_number) DO UPDATE SET
         issue_date = EXCLUDED.issue_date,
         vendor_name = EXCLUDED.vendor_name,
         seller_name = EXCLUDED.seller_name,
         tax_code = EXCLUDED.tax_code,
         buyer_name = EXCLUDED.buyer_name,
         buyer_email = EXCLUDED.buyer_email,
         subtotal = EXCLUDED.subtotal,
         vat_amount = EXCLUDED.vat_amount,
         total_amount = EXCLUDED.total_amount,
         is_valid = EXCLUDED.is_valid,
         file_path = EXCLUDED.file_path,
         storage_path = EXCLUDED.storage_path,
         status = EXCLUDED.status
       RETURNING *`,
      [
        invoiceNumber,
        issueDate,
        vendorName,
        vendorName,
        taxCode,
        buyerName,
        buyerEmail,
        subtotal,
        vatAmount,
        totalAmount,
        isValid,
        filePath,
        filePath,
        status,
      ]
    );

    // Ghi nhận nhật ký đối soát vào finance_audit_logs
    try {
      const auditStatus = isValid ? 'AUDIT_PASSED' : 'AUDIT_FLAGGED_MATH_MISMATCH';
      const auditNote = isValid
        ? `Chứng từ hợp lệ: ${subtotal.toLocaleString('vi-VN')} + ${vatAmount.toLocaleString('vi-VN')} = ${totalAmount.toLocaleString('vi-VN')} VNĐ.`
        : `Cảnh báo sai lệch số học: Tiền hàng ${subtotal.toLocaleString('vi-VN')} + VAT ${vatAmount.toLocaleString('vi-VN')} = ${calculatedTotal.toLocaleString('vi-VN')} != Tổng tiền ${totalAmount.toLocaleString('vi-VN')} (Lệch ${discrepancy.toLocaleString('vi-VN')} VNĐ).`;

      await this.db.query(
        `INSERT INTO finance_audit_logs (invoice_number, audit_status, notes)
         VALUES ($1, $2, $3)`,
        [invoiceNumber, auditStatus, auditNote]
      );
    } catch (e: any) {
      console.warn('[InvoicesService] Could not insert finance audit log:', e?.message || e);
    }

    return {
      ...res.rows[0],
      is_valid: isValid,
      calculated_total: calculatedTotal,
      discrepancy: discrepancy,
    };
  }

  async getAuditLogs() {
    const res = await this.db.query(
      'SELECT * FROM finance_audit_logs ORDER BY created_at DESC LIMIT 50'
    );
    return res.rows;
  }

  async getSummary() {
    const invoices = await this.getAllInvoices();
    const totalCount = invoices.length;
    const validCount = invoices.filter((i) => i.is_valid).length;
    const flaggedCount = totalCount - validCount;
    const totalSubtotal = invoices.reduce((sum, i) => sum + Number(i.subtotal || 0), 0);
    const totalVat = invoices.reduce((sum, i) => sum + Number(i.vat_amount || 0), 0);
    const totalAmount = invoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

    return {
      totalCount,
      validCount,
      flaggedCount,
      totalSubtotal,
      totalVat,
      totalAmount,
    };
  }
}

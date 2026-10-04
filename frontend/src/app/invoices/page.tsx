'use client';

import React, { useState, useEffect } from 'react';

interface Invoice {
  id: number;
  invoice_number: string;
  vendor_name: string;
  tax_code: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  is_valid: boolean;
  created_at: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/invoices')
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(() => {
        setInvoices([
          {
            id: 1,
            invoice_number: 'INV-2026-0899',
            vendor_name: 'Cong Ty TNHH Thiet Bi Dien Tu',
            tax_code: '0101234567',
            subtotal: 10000000,
            vat_amount: 1000000,
            total_amount: 11000000,
            is_valid: true,
            created_at: '2026-10-04T10:15:00Z',
          },
          {
            id: 2,
            invoice_number: 'INV-2026-0900',
            vendor_name: 'Cong Ty Co Phan Logistics Global',
            tax_code: '0309876543',
            subtotal: 5000000,
            vat_amount: 500000,
            total_amount: 5800000, // Discrepancy!
            is_valid: false,
            created_at: '2026-10-04T11:45:00Z',
          },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-400"></span>
            Member 3: AI Attachment OCR &amp; Invoice Verification
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Luồng 6 (AI Attachment OCR &amp; Math Integrity Audit - 21 nodes)
          </p>
        </div>
        <span className="px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded-full text-xs font-mono">
          Branch: feature/m3-crm-ocr
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Sổ Hóa đơn chứng từ đã bóc tách</span>
          <span className="text-xs text-slate-500 font-mono">Tổng: {invoices.length} chứng từ</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Đang tải danh sách hóa đơn...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Số Hóa Đơn</th>
                  <th className="py-3 px-4">Đơn vị phát hành</th>
                  <th className="py-3 px-4">Mã số thuế</th>
                  <th className="py-3 px-4">Tiền hàng (VND)</th>
                  <th className="py-3 px-4">Thuế VAT (VND)</th>
                  <th className="py-3 px-4">Tổng cộng (VND)</th>
                  <th className="py-3 px-4">Đối soát VAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.invoice_number} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-pink-400 font-semibold">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{inv.vendor_name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">{inv.tax_code}</td>
                    <td className="py-3 px-4 font-mono">
                      {Number(inv.subtotal).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {Number(inv.vat_amount).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {Number(inv.total_amount).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      {inv.is_valid ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          HỢP LỆ (PASS)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                          SAI LỆCH (FAIL)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

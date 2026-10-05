'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface Invoice {
  id: number;
  invoice_number: string;
  issue_date?: string;
  vendor_name: string;
  seller_name?: string;
  tax_code: string;
  buyer_name?: string;
  buyer_email?: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  calculated_total?: number;
  discrepancy?: number;
  is_valid: boolean;
  file_path?: string;
  storage_path?: string;
  status?: string;
  created_at?: string;
}

interface AuditLog {
  id: number;
  invoice_number: string;
  audit_status: string;
  notes: string;
  created_at: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'logs'>('invoices');
  const [filterValidity, setFilterValidity] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for simulating invoice
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    vendorName: '',
    taxCode: '0402123456',
    subtotal: '20000000',
    vatAmount: '2000000',
    totalAmount: '22000000',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchInvoices = () => {
    setLoading(true);
    Promise.all([
      fetch('http://localhost:4000/api/v1/invoices')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch('http://localhost:4000/api/v1/invoices/audit-logs')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([invoicesData, logsData]) => {
        if (invoicesData && invoicesData.length > 0) {
          setInvoices(invoicesData);
        } else {
          // Fallback initial sample data
          setInvoices([
            {
              id: 1,
              invoice_number: 'INV-2026-0899',
              issue_date: '2026-10-02',
              vendor_name: 'Công ty TNHH Thiết Bị Điện Tử',
              tax_code: '0101234567',
              subtotal: 10000000,
              vat_amount: 1000000,
              total_amount: 11000000,
              is_valid: true,
              status: 'VALID',
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              invoice_number: 'INV-843950',
              issue_date: '2026-10-02',
              vendor_name: 'Công ty Cổ phần Giải pháp Số NovaCRM',
              tax_code: '0402123456',
              subtotal: 50000000,
              vat_amount: 5000000,
              total_amount: 55000000,
              is_valid: true,
              status: 'VALID',
              created_at: new Date().toISOString(),
            },
            {
              id: 3,
              invoice_number: 'INV-2026-0900',
              issue_date: '2026-10-03',
              vendor_name: 'Công ty Cổ phần Logistics Global',
              tax_code: '0309876543',
              subtotal: 5000000,
              vat_amount: 500000,
              total_amount: 5800000, // Discrepancy!
              is_valid: false,
              status: 'FLAGGED_SUSPICIOUS',
              created_at: new Date().toISOString(),
            },
          ]);
        }

        if (logsData && logsData.length > 0) {
          setAuditLogs(logsData);
        } else {
          setAuditLogs([
            {
              id: 1,
              invoice_number: 'INV-2026-0899',
              audit_status: 'AUDIT_PASSED',
              notes: 'Chứng từ hợp lệ: 10,000,000 + 1,000,000 = 11,000,000 VNĐ. Khớp 100% số liệu kế toán.',
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              invoice_number: 'INV-843950',
              audit_status: 'AUDIT_PASSED',
              notes: 'Chứng từ bóc tách OCR từ ảnh PNG hợp lệ: 50,000,000 + 5,000,000 = 55,000,000 VNĐ.',
              created_at: new Date().toISOString(),
            },
            {
              id: 3,
              invoice_number: 'INV-2026-0900',
              audit_status: 'AUDIT_FLAGGED_MATH_MISMATCH',
              notes: 'Cảnh báo sai lệch số học: Tiền hàng 5,000,000 + VAT 500,000 = 5,500,000 != Tổng thanh toán 5,800,000 (Lệch 300,000 VNĐ). Đã đánh dấu FLAGGED_SUSPICIOUS.',
              created_at: new Date().toISOString(),
            },
          ]);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleApplyPreset = (type: 'valid' | 'mismatch') => {
    if (type === 'valid') {
      const rand = Math.floor(100000 + Math.random() * 900000);
      setFormData({
        invoiceNumber: `INV-${rand}`,
        vendorName: 'Công ty Cổ phần Công nghệ VKU',
        taxCode: '0409988776',
        subtotal: '30000000',
        vatAmount: '3000000',
        totalAmount: '33000000',
      });
    } else {
      const rand = Math.floor(100000 + Math.random() * 900000);
      setFormData({
        invoiceNumber: `INV-${rand}`,
        vendorName: 'Công ty TNHH Cung Ứng Vật Tư Sao Mai',
        taxCode: '0105544332',
        subtotal: '45000000',
        vatAmount: '4500000',
        totalAmount: '52000000', // Sai lệch 2.5 triệu
      });
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const sub = Number(formData.subtotal) || 0;
      const vat = Number(formData.vatAmount) || 0;
      const total = Number(formData.totalAmount) || 0;
      const expectedTotal = sub + vat;
      const diff = Math.abs(expectedTotal - total);
      const isValid = diff <= 1.0;

      const payload = {
        invoiceNumber: formData.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        vendorName: formData.vendorName || 'Doanh nghiệp kiểm thử',
        taxCode: formData.taxCode,
        subtotal: sub,
        vatAmount: vat,
        totalAmount: total,
        isValid: isValid,
        status: isValid ? 'VALID' : 'FLAGGED_SUSPICIOUS',
      };

      const res = await fetch('http://localhost:4000/api/v1/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('API request failed');

      if (isValid) {
        showToast('✓ Hóa đơn HỢP LỆ! Tiền hàng + VAT khớp chính xác 100%.');
      } else {
        showToast(`⚠ Phát hiện sai lệch số học: Chênh lệch ${diff.toLocaleString('vi-VN')} VNĐ!`);
      }

      setIsModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      showToast('Có lỗi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview computation in modal
  const modalSubtotal = Number(formData.subtotal) || 0;
  const modalVat = Number(formData.vatAmount) || 0;
  const modalTotal = Number(formData.totalAmount) || 0;
  const modalCalculated = modalSubtotal + modalVat;
  const modalDiff = Math.abs(modalCalculated - modalTotal);
  const modalIsValid = modalDiff <= 1.0;

  // Filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesValidity =
        filterValidity === 'ALL' ||
        (filterValidity === 'VALID' && inv.is_valid) ||
        (filterValidity === 'INVALID' && !inv.is_valid);

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.vendor_name?.toLowerCase().includes(q) ||
        inv.seller_name?.toLowerCase().includes(q) ||
        inv.tax_code?.toLowerCase().includes(q);

      return matchesValidity && matchesQuery;
    });
  }, [invoices, filterValidity, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = invoices.length;
    const valid = invoices.filter((i) => i.is_valid).length;
    const invalid = total - valid;
    const totalAmount = invoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

    return { total, valid, invalid, totalAmount };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-pink-500 text-white font-medium px-4 py-2.5 rounded-lg shadow-xl border border-pink-400 flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-pink-400 animate-pulse"></span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Member 3: AI Attachment OCR &amp; Invoice Verification
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Luồng 6: Multi-format Attachment OCR &amp; VAT Arithmetic Integrity Audit (21 nodes n8n)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              handleApplyPreset('valid');
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-pink-500 hover:bg-pink-400 text-white font-semibold rounded-lg text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <span>+</span> Giả lập Hóa đơn OCR
          </button>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition"
          >
            {loading ? 'Đang tải...' : 'Làm mới ↻'}
          </button>
          <span className="px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded-full text-xs font-mono">
            feature/m3-crm-ocr
          </span>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase font-mono">Tổng Hóa Đơn</div>
          <div className="text-2xl font-bold text-white mt-1.5">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Chứng từ đã nạp vào hệ thống</div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4">
          <div className="text-xs text-emerald-400 uppercase font-mono font-medium">Hợp lệ (Pass)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5">{stats.valid}</div>
          <div className="text-xs text-emerald-500/80 mt-1">Tiền hàng + VAT = Tổng cộng</div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4">
          <div className="text-xs text-rose-400 uppercase font-mono font-medium">Sai lệch (Fail)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1.5">{stats.invalid}</div>
          <div className="text-xs text-rose-500/80 mt-1">Cảnh báo sai lệch số học</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase font-mono">Tổng Giá Trị Đối Soát</div>
          <div className="text-lg font-bold text-white mt-2 font-mono truncate">
            {stats.totalAmount.toLocaleString('vi-VN')} <span className="text-xs text-slate-400">VND</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Tổng số tiền thanh toán</div>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {/* Navigation Tabs & Search */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                activeTab === 'invoices'
                  ? 'bg-pink-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Sổ Hóa Đơn ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                activeTab === 'logs'
                  ? 'bg-pink-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Nhật Ký Kiểm Toán ({auditLogs.length})
            </button>

            {activeTab === 'invoices' && (
              <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-3">
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'VALID', label: 'Hợp lệ (Pass)' },
                  { id: 'INVALID', label: 'Sai lệch (Fail)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterValidity(f.id as any)}
                    className={`px-2.5 py-1 text-xs rounded transition ${
                      filterValidity === f.id
                        ? 'bg-slate-700 text-pink-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo số HĐ, MST, đơn vị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500/60"
            />
          </div>
        </div>

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="inline-block w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                <div>Đang tải danh sách hóa đơn...</div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Không có chứng từ nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Số Hóa Đơn</th>
                      <th className="py-3 px-4">Đơn vị phát hành</th>
                      <th className="py-3 px-4">Mã số thuế</th>
                      <th className="py-3 px-4 text-right">Tiền hàng (VND)</th>
                      <th className="py-3 px-4 text-right">Thuế VAT (VND)</th>
                      <th className="py-3 px-4 text-right">Tổng cộng (VND)</th>
                      <th className="py-3 px-4 text-center">Đối soát Số học VAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredInvoices.map((inv) => {
                      const sub = Number(inv.subtotal || 0);
                      const vat = Number(inv.vat_amount || 0);
                      const total = Number(inv.total_amount || 0);
                      const discrepancy = Math.abs((sub + vat) - total);

                      return (
                        <tr key={inv.invoice_number} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-mono text-pink-400 font-semibold text-xs">
                            <div>{inv.invoice_number}</div>
                            <div className="text-[10px] text-slate-500 font-sans">
                              {inv.issue_date || '2026-10-02'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-white text-xs">
                            <div>{inv.vendor_name || inv.seller_name || 'N/A'}</div>
                            {inv.buyer_name && (
                              <div className="text-[10px] text-slate-400">
                                Mua: {inv.buyer_name}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                            {inv.tax_code}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-right">
                            {sub.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-right text-slate-300">
                            {vat.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-right font-medium text-white">
                            {total.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {inv.is_valid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <span>✓</span> HỢP LỆ (PASS)
                              </span>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                                  ⚠ SAI LỆCH (FAIL)
                                </span>
                                {discrepancy > 0 && (
                                  <span className="text-[10px] text-rose-400/90 font-mono mt-0.5 font-semibold">
                                    Lệch: {discrepancy.toLocaleString('vi-VN')} đ
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Số Hóa Đơn</th>
                  <th className="py-3 px-4">Kết Quả Kiểm Toán</th>
                  <th className="py-3 px-4">Nội Dung Chi Tiết</th>
                  <th className="py-3 px-4">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-xs text-pink-400 font-semibold">
                      {log.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      {log.audit_status === 'AUDIT_PASSED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          AUDIT_PASSED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                          {log.audit_status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300 max-w-md">
                      {log.notes}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Giả lập Hóa đơn OCR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span>
                Giả lập Bóc tách OCR &amp; Đối soát Toán học VAT
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Chọn tình huống:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('valid')}
                className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/25"
              >
                ✓ Hóa đơn Hợp Lệ (Pass)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('mismatch')}
                className="px-2.5 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded hover:bg-rose-500/25"
              >
                ⚠ Hóa đơn Sai Lệch (Fail)
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Số Hóa Đơn</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    placeholder="INV-2026-XXXX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mã Số Thuế Bên Bán</label>
                  <input
                    type="text"
                    required
                    value={formData.taxCode}
                    onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                    placeholder="0402123456"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Đơn vị Phát hành (Vendor)</label>
                <input
                  type="text"
                  required
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="Công ty Cổ phần Công nghệ VKU"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tiền Hàng (VND)</label>
                  <input
                    type="number"
                    required
                    value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Thuế VAT (VND)</label>
                  <input
                    type="number"
                    required
                    value={formData.vatAmount}
                    onChange={(e) => setFormData({ ...formData, vatAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tổng Cộng (VND)</label>
                  <input
                    type="number"
                    required
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              {/* Real-time Validation Preview Box */}
              <div
                className={`p-3 rounded-lg border text-xs ${
                  modalIsValid
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>Kiểm tra đối soát số học:</span>
                  <span className="font-mono font-bold">
                    {modalIsValid ? '✓ HỢP LỆ (100% Khớp)' : '⚠ PHÁT HIỆN SAI LỆCH'}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-300 space-y-0.5">
                  <div>Tiền hàng + VAT: {modalCalculated.toLocaleString('vi-VN')} VND</div>
                  <div>Tổng thanh toán ghi trên HĐ: {modalTotal.toLocaleString('vi-VN')} VND</div>
                  {!modalIsValid && (
                    <div className="text-rose-400 font-bold">
                      Chênh lệch: {modalDiff.toLocaleString('vi-VN')} VND
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-lg text-xs transition"
                >
                  {isSubmitting ? 'Đang đối soát...' : 'Lưu Chứng Từ & Đối Soát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

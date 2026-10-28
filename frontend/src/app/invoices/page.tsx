'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';
import { FileText, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, XCircle, Search, Plus, X, Send, Paperclip } from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
  seller_tax_id: string;
  seller_name: string;
  buyer_name: string;
  buyer_email: string;
  issue_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  calculated_total: number;
  discrepancy: number;
  is_math_valid: boolean;
  math_status: string;
  file_storage_path: string;
  created_at: string;
}

interface AuditLog {
  id: number;
  event_type: string;
  workflow_id: string;
  description: string;
  created_at: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'logs'>('invoices');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VALIDATED' | 'DISCREPANCY_FLAGGED'>('ALL');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inbound Invoice Email Modal State (Luồng 9)
  const [showInvoiceEmailModal, setShowInvoiceEmailModal] = useState(false);
  const [isSubmittingInvoiceEmail, setIsSubmittingInvoiceEmail] = useState(false);

  // Email Fields
  const [emailSenderName, setEmailSenderName] = useState('Công ty CP Phần Mềm VKU');
  const [emailSenderAddress, setEmailSenderAddress] = useState('trangltk.24it@vku.udn.vn');
  const [emailSubject, setEmailSubject] = useState('[GỬI HÓA ĐƠN VAT] Quyết toán chi phí phần mềm HD-2026-001');
  const [emailBody, setEmailBody] = useState('Kính gửi bộ phận kế toán,\n\nCông ty CP Phần Mềm VKU (MST: 0402123456) gửi chứng từ hóa đơn số HD-2026-001 chi phí bản quyền giải pháp phần mềm:\n- Tiền hàng chưa thuế (Subtotal): 10.000.000 đ\n- Thuế suất GTGT 10% (VAT): 1.000.000 đ\n- Tổng tiền thanh toán (Total): 11.000.000 đ\n\nKính đề nghị kế toán kiểm tra đối soát số học và phê duyệt giải ngân.\n\nTrân trọng,\nKế toán trưởng - Công ty CP Phần Mềm VKU');
  const [emailAttachment, setEmailAttachment] = useState('hoa_don_vat_001.pdf');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleSendInvoiceEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingInvoiceEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/inbound/process-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: emailSenderName,
          sender_email: emailSenderAddress,
          subject: emailSubject,
          body: emailBody,
          attachment_name: emailAttachment,
        }),
      });
      const data = await res.json();
      const branch = data?.branch_result || {};
      if (branch.math_status === 'VALIDATED') {
        showToast(`✅ AI OCR đã bóc tách HĐ ${branch.invoice_number}: Số học KHỚP 100% ➔ Gắn nhãn VALIDATED!`);
      } else {
        showToast(`🛑 CẢNH BÁO: HĐ ${branch.invoice_number} bị LỆCH ${branch.discrepancy} ➔ Đã gửi mail cảnh báo gian lận cho Kế toán trưởng (tranngo170770@gmail.com)!`);
      }
      setShowInvoiceEmailModal(false);
      await fetchData();
    } catch {
      showToast('Lỗi khi gửi email hóa đơn đến hệ thống');
    } finally {
      setIsSubmittingInvoiceEmail(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, logRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/finance/invoices`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/api/v1/finance/audit-logs`).then((r) => (r.ok ? r.json() : [])),
      ]);
      setInvoices(Array.isArray(invRes) ? invRes : []);
      setAuditLogs(Array.isArray(logRes) ? logRes : []);
    } catch {
      setInvoices([]);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const filteredInvoices = invoices.filter((inv) => {
    const matchStatus = filterStatus === 'ALL' ? true : inv.math_status === filterStatus;
    const matchSearch =
      search === '' ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.seller_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyer_name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const validCount = invoices.filter((i) => i.math_status === 'VALIDATED').length;
  const flagCount = invoices.filter((i) => i.math_status === 'DISCREPANCY_FLAGGED').length;
  const totalVerifiedAmount = invoices
    .filter((i) => i.math_status === 'VALIDATED')
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl border border-rose-500/30 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-rose-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bóc Tách Hóa Đơn &amp; Kiểm Toán Đối Soát Số Học</h1>
          <p className="text-sm text-slate-500 mt-1">
            Nhận diện chứng từ tự động, kiểm tra tính đúng đắn số học: Tiền hàng + VAT = Tổng thanh toán.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInvoiceEmailModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-purple-200"
            title="Khách hàng / Đối tác gửi email đính kèm hóa đơn VAT (Luồng 9)"
          >
            <Send className="w-4 h-4" />
            <span>📧 KH Gửi Mail Hóa Đơn (Test Luồng 9)</span>
          </button>

          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-xs sm:text-sm font-medium transition shadow-xs"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4 text-rose-500" />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Số Chứng Từ OCR</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{invoices.length}</div>
          <div className="text-xs text-slate-400 mt-1">Đã bóc tách qua n8n Vision AI</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Chứng Từ Khớp 100%</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{validCount}</div>
          <div className="text-xs text-emerald-600/80 mt-1 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đã ghi sổ kế toán nội bộ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Sai Lệch Số Học / Báo Động</div>
          <div className="text-2xl font-black text-rose-600 mt-2">{flagCount}</div>
          <div className="text-xs text-rose-600/80 mt-1 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Đã gửi cảnh báo Kế toán trưởng</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Tiền Quyết Toán Hợp Lệ</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalVerifiedAmount.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">VNĐ</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Chứng từ sẵn sàng thanh toán</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`font-semibold text-sm transition pb-2 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'invoices' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Danh Sách Hóa Đơn ({invoices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`font-semibold text-sm transition pb-2 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Nhật Ký Kiểm Toán Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        {activeTab === 'invoices' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm số HĐ, đơn vị..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
            {(['ALL', 'VALIDATED', 'DISCREPANCY_FLAGGED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterStatus === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Tất cả' : st === 'VALIDATED' ? 'Hợp lệ' : 'Sai lệch'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-rose-100/70 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Đang tải dữ liệu hóa đơn kế toán...</div>
        ) : activeTab === 'invoices' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Số Hóa Đơn</th>
                  <th className="px-5 py-3.5">Đơn Vị Phát Hành (MST)</th>
                  <th className="px-5 py-3.5">Khách Hàng Nhận</th>
                  <th className="px-5 py-3.5">Tiền Hàng / VAT</th>
                  <th className="px-5 py-3.5">Tổng Thanh Toán</th>
                  <th className="px-5 py-3.5">Kiểm Toán Số Học</th>
                  <th className="px-5 py-3.5">Tệp Gốc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      Không tìm thấy chứng từ hóa đơn nào.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isOk = inv.math_status === 'VALIDATED';
                    return (
                      <tr key={inv.id} className="hover:bg-rose-50/20 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 font-mono">{inv.invoice_number}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(inv.issue_date).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{inv.seller_name}</div>
                          <div className="text-xs font-mono text-slate-500">MST: {inv.seller_tax_id}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-slate-800 font-medium">{inv.buyer_name}</div>
                          <div className="text-xs text-slate-400">{inv.buyer_email || 'N/A'}</div>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono">
                          <div>Hàng: {Number(inv.subtotal).toLocaleString('vi-VN')} đ</div>
                          <div className="text-slate-400">VAT: {Number(inv.vat_amount).toLocaleString('vi-VN')} đ</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 font-mono">
                            {Number(inv.total_amount).toLocaleString('vi-VN')} VNĐ
                          </div>
                          {!isOk && inv.discrepancy > 0 && (
                            <div className="text-xs text-rose-600 font-bold mt-0.5">
                              Lệch: {Number(inv.discrepancy).toLocaleString('vi-VN')} đ
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isOk ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Khớp 100%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" /> Sai lệch số học
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span className="text-slate-400 font-mono text-[11px] block truncate max-w-[140px]" title={inv.file_storage_path}>
                            {inv.file_storage_path.split('/').pop() || 'storage.pdf'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Mã Nhật Ký</th>
                  <th className="px-5 py-3.5">Sự Kiện Kiểm Toán</th>
                  <th className="px-5 py-3.5">Quy Trình (Workflow)</th>
                  <th className="px-5 py-3.5">Mô Tả Đối Soát</th>
                  <th className="px-5 py-3.5">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-rose-50/20 transition">
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">#{log.id}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-mono">{log.workflow_id || 'System'}</td>
                    <td className="px-5 py-4 text-xs text-slate-800">{log.description}</td>
                    <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL KHÁCH HÀNG GỬI EMAIL ĐÍNH KÈM HÓA ĐƠN (LUỒNG 9: INVOICE MULTIMODAL OCR) */}
      {showInvoiceEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-purple-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase flex items-center gap-1 w-fit">
                  <FileText className="w-3.5 h-3.5" /> Luồng 9: Inbound Invoice Processing
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">Gửi Thư Kèm Hóa Đơn VAT Để AI Đối Soát</h3>
              </div>
              <button
                onClick={() => setShowInvoiceEmailModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fill Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailSenderName('Công ty CP Phần Mềm VKU');
                  setEmailSubject('[GỬI HÓA ĐƠN VAT] Quyết toán chi phí phần mềm HD-2026-001');
                  setEmailBody('Kính gửi bộ phận kế toán,\n\nCông ty CP Phần Mềm VKU (MST: 0402123456) gửi chứng từ hóa đơn số HD-2026-001 chi phí bản quyền phần mềm:\n- Tiền hàng chưa thuế (Subtotal): 10.000.000 đ\n- Thuế suất GTGT 10% (VAT): 1.000.000 đ\n- Tổng tiền thanh toán (Total): 11.000.000 đ\n\nKính đề nghị kế toán kiểm tra đối soát số học và phê duyệt giải ngân.\n\nTrân trọng,\nKế toán trưởng');
                  setEmailAttachment('hoa_don_vat_001.pdf');
                }}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-left text-xs font-bold transition flex flex-col gap-0.5"
              >
                <span>⚡ Mẫu 1: Hóa Đơn Hợp Lệ</span>
                <span className="text-[10px] font-normal text-emerald-700">10tr + 1tr = 11tr (VALIDATED)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailSenderName('Nhà cung cấp lạ');
                  setEmailSubject('[GỬI HÓA ĐƠN VAT] Thanh toán dịch vụ bảo trì HD-FAKE-002');
                  setEmailBody('Kính gửi kế toán,\n\nGửi hóa đơn HD-FAKE-002: Tiền hàng 10.000.000 đ, thuế VAT 1.000.000 đ, tổng thanh toán là 15.000.000 đ (kê khống lệch 4 triệu).\n\nĐề nghị duyệt chi gấp.\n\nTrân trọng.');
                  setEmailAttachment('hoa_don_fake.pdf');
                }}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-left text-xs font-bold transition flex flex-col gap-0.5"
              >
                <span>⚡ Mẫu 2: Gian Lận / Lệch Tiền</span>
                <span className="text-[10px] font-normal text-rose-700">10tr + 1tr ≠ 15tr (Cảnh Báo KTT)</span>
              </button>
            </div>

            <form onSubmit={handleSendInvoiceEmail} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Đơn vị gửi (From Name):</label>
                  <input
                    type="text"
                    required
                    value={emailSenderName}
                    onChange={(e) => setEmailSenderName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-purple-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email gửi (From Address):</label>
                  <input
                    type="email"
                    required
                    value={emailSenderAddress}
                    onChange={(e) => setEmailSenderAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-purple-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Hòm thư tiếp nhận DN (To):</label>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs flex items-center justify-between">
                  <span>tranngo170770@gmail.com</span>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold">Inbound Gateway</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Tiêu đề thư (Subject):</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-purple-500 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Tệp đính kèm hóa đơn (Attachment):</label>
                <div className="flex items-center gap-2 p-2 rounded-xl border border-purple-200 bg-purple-50/50">
                  <Paperclip className="w-4 h-4 text-purple-600" />
                  <input
                    type="text"
                    value={emailAttachment}
                    onChange={(e) => setEmailAttachment(e.target.value)}
                    className="bg-transparent border-none text-xs font-mono text-purple-900 w-full focus:outline-none"
                    placeholder="tệp đính kèm: hoa_don.pdf"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Nội dung thư bóc tách (Email Body):</label>
                <textarea
                  rows={4}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-purple-500 text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceEmailModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvoiceEmail}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-purple-200 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmittingInvoiceEmail ? 'animate-pulse' : ''}`} />
                  <span>{isSubmittingInvoiceEmail ? 'AI Đang Đối Soát...' : 'Gửi Thư Kèm Hóa Đơn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

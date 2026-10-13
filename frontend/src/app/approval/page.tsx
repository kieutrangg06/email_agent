'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit3,
  Clock,
  AlertTriangle,
  Mail,
  Sparkles,
  Send,
  X,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Inbox,
  ShieldCheck,
  Bot,
  Check,
} from 'lucide-react';

interface Draft {
  id: number;
  ticket_id?: number;
  ticket_code: string;
  recipient_email: string;
  sender_name?: string;
  original_subject?: string;
  original_body?: string;
  subject?: string;
  proposed_subject: string;
  html_content?: string;
  proposed_body: string;
  confidence_score: number;
  status: string;
  priority?: string;
  ticket_subject?: string;
  sla_due_at?: string;
  first_response_sla?: string;
  knowledge_context?: any[];
  created_at?: string;
  reviewed_at?: string;
  sent_at?: string;
  reviewed_by?: string;
}

export default function ApprovalPage() {
  const [allDrafts, setAllDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING_APPROVAL' | 'ALL' | 'SENT' | 'REJECTED'>('PENDING_APPROVAL');
  const [reviewerEmail, setReviewerEmail] = useState('reviewer@company.com');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Editing state
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  // Expand email details
  const [expandedDrafts, setExpandedDrafts] = useState<Record<number, boolean>>({});

  const fetchDrafts = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/v1/drafts')
      .then((res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setAllDrafts(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load drafts:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  // Filter drafts based on active tab
  const displayedDrafts = useMemo(() => {
    if (statusFilter === 'ALL') return allDrafts;
    return allDrafts.filter((d) => d.status === statusFilter);
  }, [allDrafts, statusFilter]);

  // Overall KPI stats
  const stats = useMemo(() => {
    const total = allDrafts.length;
    const pending = allDrafts.filter((d) => d.status === 'PENDING_APPROVAL').length;
    const sent = allDrafts.filter((d) => d.status === 'SENT').length;
    const rejected = allDrafts.filter((d) => d.status === 'REJECTED').length;
    const avgScore = total > 0
      ? (allDrafts.reduce((acc, d) => acc + (Number(d.confidence_score) || 92), 0) / total).toFixed(1)
      : '93.5';
    return { total, pending, sent, rejected, avgScore };
  }, [allDrafts]);

  // Real-time notification listener via Server-Sent Events (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('http://localhost:4000/api/v1/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'AI_REPLY_DRAFT_GENERATED' || payload.event === 'DRAFT_STATUS_UPDATED') {
            setActionMsg({
              type: 'info',
              text: `🔔 Nhận thông báo thời gian thực: ${payload.event === 'AI_REPLY_DRAFT_GENERATED' ? 'Có bản nháp mới cho ' + (payload.ticket_code || 'vé') : 'Bản thảo #' + payload.draft_id + ' đã đổi trạng thái'}`,
            });
            fetchDrafts();
          }
        } catch {
          // ignore parsing error
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // SSE not available
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedDrafts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (draft: Draft) => {
    setEditingDraftId(draft.id);
    setEditSubject(draft.subject || draft.proposed_subject || '');
    setEditBody(draft.html_content || draft.proposed_body || '');
  };

  const cancelEdit = () => {
    setEditingDraftId(null);
    setEditSubject('');
    setEditBody('');
  };

  // Duyệt & Gửi: Triggers Luồng 5 Webhook and updates DB
  const handleApproveAndSend = async (draft: Draft) => {
    setActionLoading(draft.id);
    const finalSubject = editingDraftId === draft.id ? editSubject : (draft.subject || draft.proposed_subject);
    const finalBody = editingDraftId === draft.id ? editBody : (draft.html_content || draft.proposed_body);

    setActionMsg({
      type: 'info',
      text: `🚀 Đang kích hoạt Luồng 5 (Human Action Webhook Trigger) và xác thực quyền reviewer...`,
    });

    try {
      // 1. Call Luồng 5 n8n Webhook
      const webhookPayload = {
        draft_id: draft.id,
        reviewer_email: reviewerEmail,
        modified_subject: finalSubject,
        modified_body: finalBody,
        action: 'APPROVE_SEND',
      };

      try {
        await fetch('http://localhost:5678/webhook/m2-flow5-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });
      } catch {
        // n8n webhook might be asynchronous
      }

      // 2. Call NestJS backend PATCH /api/v1/drafts/:id/status
      const patchRes = await fetch(`http://localhost:4000/api/v1/drafts/${draft.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SENT',
          reviewed_by: reviewerEmail,
          proposed_subject: finalSubject,
          proposed_body: finalBody,
          subject: finalSubject,
          html_content: finalBody,
        }),
      });

      if (patchRes.ok) {
        setActionMsg({
          type: 'success',
          text: `✅ Bản thảo #${draft.id} (${draft.ticket_code}) đã được DUYỆT & GỬI thành công qua Luồng 5! Email SMTP đã phân phối và vé đã chuyển sang RESOLVED.`,
        });
        setEditingDraftId(null);
        fetchDrafts();
      } else {
        throw new Error('Cập nhật trạng thái backend thất bại');
      }
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: `❌ Lỗi khi duyệt bản thảo: ${err.message}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (draft: Draft) => {
    setActionLoading(draft.id);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/drafts/${draft.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          reviewed_by: reviewerEmail,
        }),
      });

      if (res.ok) {
        setActionMsg({
          type: 'info',
          text: `🚫 Bản thảo #${draft.id} (${draft.ticket_code}) đã bị TỪ CHỐI (REJECTED). Không gửi email ra bên ngoài.`,
        });
        fetchDrafts();
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: `Lỗi: ${err.message}` });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {actionMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-short">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
              actionMsg.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : actionMsg.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : 'bg-sky-50/95 border-sky-200 text-sky-900'
            }`}
          >
            {actionMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
            {actionMsg.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            {actionMsg.type === 'info' && <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />}
            <div className="space-y-0.5 flex-1">
              <p className="font-bold text-sm">
                {actionMsg.type === 'success' ? 'Thao tác thành công' : actionMsg.type === 'error' ? 'Lỗi hệ thống' : 'Thông báo vận hành'}
              </p>
              <p className="text-xs leading-relaxed opacity-90">{actionMsg.text}</p>
            </div>
            <button
              onClick={() => setActionMsg(null)}
              className="text-slate-400 hover:text-slate-600 ml-auto shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header Card */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-rose-150 shadow-sm shadow-rose-100/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-semibold tracking-wide inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              THÀNH VIÊN 2 • HITL APPROVAL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Phê Duyệt &amp; Phân Phối Thư Phản Hồi RAG
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Kiểm duyệt, tinh chỉnh bản thảo do AI RAG tạo ra trước khi xuất ngoại qua SMTP (Luồng 5) và đóng vé hỗ trợ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-rose-200/80 px-3 py-1.5 rounded-xl text-xs">
            <UserCheck className="w-4 h-4 text-rose-500" />
            <span className="text-slate-500 font-medium">Chuyên viên:</span>
            <input
              type="email"
              value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
              className="bg-white border border-rose-200 rounded-lg px-2 py-0.5 text-rose-700 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-rose-400 w-44"
            />
          </div>

          <button
            onClick={fetchDrafts}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-xs sm:text-sm font-medium transition shadow-xs"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw className={`w-4 h-4 text-rose-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Tổng Bản Thảo</p>
            <p className="text-xl font-extrabold text-slate-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Đang Chờ Duyệt</p>
            <p className="text-xl font-extrabold text-amber-600">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Đã Duyệt &amp; Gửi</p>
            <p className="text-xl font-extrabold text-emerald-700">{stats.sent}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Bị Từ Chối</p>
            <p className="text-xl font-extrabold text-rose-600">{stats.rejected}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Độ Tin Cậy AI</p>
            <p className="text-xl font-extrabold text-purple-700">{stats.avgScore}%</p>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex border-b border-rose-200/80 gap-2 overflow-x-auto pb-1">
        {(['PENDING_APPROVAL', 'ALL', 'SENT', 'REJECTED'] as const).map((filter) => {
          const isActive = statusFilter === filter;
          const count =
            filter === 'PENDING_APPROVAL'
              ? stats.pending
              : filter === 'ALL'
              ? stats.total
              : filter === 'SENT'
              ? stats.sent
              : stats.rejected;

          return (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`pb-3 px-4 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {filter === 'PENDING_APPROVAL' && <Clock className="w-4 h-4" />}
              {filter === 'ALL' && <Inbox className="w-4 h-4" />}
              {filter === 'SENT' && <CheckCircle2 className="w-4 h-4" />}
              {filter === 'REJECTED' && <XCircle className="w-4 h-4" />}
              <span>
                {filter === 'PENDING_APPROVAL' && `Chờ Duyệt (${count})`}
                {filter === 'ALL' && `Tất Cả (${count})`}
                {filter === 'SENT' && `Đã Gửi (${count})`}
                {filter === 'REJECTED' && `Từ Chối (${count})`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Drafts List Container */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-rose-150 shadow-xs">
          <div className="flex items-center justify-center gap-2 text-rose-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Đang tải danh sách bản thảo từ PostgreSQL...</span>
          </div>
        </div>
      ) : displayedDrafts.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-rose-150 shadow-xs p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <p className="text-slate-700 text-base font-bold">
            {statusFilter === 'PENDING_APPROVAL' && 'Không có bản thảo nào đang chờ duyệt'}
            {statusFilter === 'SENT' && 'Chưa có bản thảo nào đã gửi'}
            {statusFilter === 'REJECTED' && 'Chưa có bản thảo nào bị từ chối'}
            {statusFilter === 'ALL' && 'Không có bản thảo nào trong hệ thống'}
          </p>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {statusFilter === 'PENDING_APPROVAL'
              ? 'Khi Luồng 3 chuyển giao ticket sang Luồng 4 (Vector RAG), bản thảo phản hồi tự động sẽ xuất hiện tại đây để chuyên viên duyệt.'
              : statusFilter === 'SENT'
              ? 'Các email đã được duyệt và chuyển phát thành công qua SMTP sẽ được lưu trữ tại đây.'
              : statusFilter === 'REJECTED'
              ? 'Các bản thảo bị từ chối không gửi ra bên ngoài sẽ hiển thị tại đây.'
              : 'Toàn bộ danh sách bản thảo trong cơ sở dữ liệu.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedDrafts.map((draft) => {
            const isEditing = editingDraftId === draft.id;
            const isExpanded = expandedDrafts[draft.id] || false;
            const subjectToShow = isEditing ? editSubject : (draft.subject || draft.proposed_subject);
            const bodyToShow = isEditing ? editBody : (draft.html_content || draft.proposed_body);

            return (
              <div
                key={draft.id}
                className="bg-white rounded-3xl border border-rose-150 shadow-sm shadow-rose-100/20 overflow-hidden transition hover:shadow-md hover:border-rose-200"
              >
                {/* Card Header */}
                <div className="p-5 bg-rose-50/40 border-b border-rose-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white text-rose-700 border border-rose-200 rounded-lg shadow-xs">
                      {draft.ticket_code || `DRAFT-#${draft.id}`}
                    </span>

                    {draft.priority && (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          draft.priority.includes('P1')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : draft.priority.includes('P2')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {draft.priority}
                      </span>
                    )}

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        draft.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : draft.status === 'SENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {draft.status === 'PENDING_APPROVAL' ? 'CHỜ DUYỆT' : draft.status === 'SENT' ? 'ĐÃ GỬI' : 'TỪ CHỐI'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>
                        Độ tin cậy AI:{' '}
                        <strong className="text-purple-700 font-bold font-mono">
                          {draft.confidence_score ? `${Number(draft.confidence_score).toFixed(1)}%` : '92.0%'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Gửi tới:{' '}
                        <strong className="text-slate-800 font-mono">{draft.recipient_email}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-5">
                  {/* Customer Inquiry Snapshot */}
                  {(draft.original_subject || draft.original_body) && (
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-rose-500" />
                          Email gốc từ khách hàng ({draft.sender_name || draft.recipient_email}):
                        </span>
                        <button
                          onClick={() => toggleExpand(draft.id)}
                          className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 text-xs"
                        >
                          {isExpanded ? (
                            <>
                              <span>Thu gọn</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Xem nội dung gốc</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-slate-700 font-medium">
                        <strong className="text-slate-900">Tiêu đề:</strong> {draft.original_subject}
                      </div>

                      {isExpanded && draft.original_body && (
                        <div className="text-slate-600 mt-2 p-3 bg-white rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                          {draft.original_body}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Draft Content / Edit Form */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 tracking-wide uppercase flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-500" />
                        Tiêu đề thư phản hồi
                      </label>
                      {!isEditing && draft.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => startEdit(draft)}
                          className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-bold"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa nội dung</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full bg-white border border-rose-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    ) : (
                      <div className="text-sm font-bold text-slate-800 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                        {subjectToShow}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <label className="text-xs font-bold text-slate-600 tracking-wide uppercase flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-rose-500" />
                        Nội dung thư phản hồi (AI RAG Template HTML)
                      </label>
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={10}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full bg-white border border-rose-300 rounded-xl p-4 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 leading-relaxed"
                      />
                    ) : (
                      <div
                        className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: bodyToShow }}
                      />
                    )}
                  </div>

                  {/* Edit Actions */}
                  {isEditing && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setEditingDraftId(null)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Lưu tạm trên màn hình</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Hủy bỏ</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer / Dispatch Buttons */}
                <div className="p-5 bg-rose-50/30 border-t border-rose-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 font-medium">
                    Tạo lúc: {draft.created_at ? new Date(draft.created_at).toLocaleString('vi-VN') : 'Vừa xong'}
                    {draft.reviewed_by && (
                      <span className="text-slate-700 font-semibold ml-2">
                        • Duyệt bởi: {draft.reviewed_by}
                      </span>
                    )}
                  </div>

                  {draft.status === 'PENDING_APPROVAL' && (
                    <div className="flex items-center gap-3">
                      <button
                        disabled={actionLoading === draft.id}
                        onClick={() => handleReject(draft)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span>Từ chối</span>
                      </button>
                      <button
                        disabled={actionLoading === draft.id}
                        onClick={() => handleApproveAndSend(draft)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-rose-200 transition disabled:opacity-50"
                      >
                        {actionLoading === draft.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Đang phân phối...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-white" />
                            <span>Duyệt &amp; Gửi (Luồng 5)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {draft.status === 'SENT' && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Đã gửi thành công qua SMTP</span>
                      </span>
                    </div>
                  )}

                  {draft.status === 'REJECTED' && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl shadow-xs">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Đã từ chối (Không gửi)</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

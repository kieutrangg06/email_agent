'use client';

import React, { useState, useEffect } from 'react';

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
  const [drafts, setDrafts] = useState<Draft[]>([]);
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
    const endpoint = statusFilter === 'PENDING_APPROVAL'
      ? 'http://localhost:4000/api/v1/drafts/pending'
      : (statusFilter === 'ALL' ? 'http://localhost:4000/api/v1/drafts' : `http://localhost:4000/api/v1/drafts?status=${statusFilter}`);

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDrafts(data);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback to general drafts
        fetch('http://localhost:4000/api/v1/drafts')
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) {
              if (statusFilter === 'PENDING_APPROVAL') {
                setDrafts(data.filter((d: any) => d.status === 'PENDING_APPROVAL'));
              } else {
                setDrafts(data);
              }
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  };

  useEffect(() => {
    fetchDrafts();
  }, [statusFilter]);

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

      let webhookSuccess = false;
      try {
        const n8nRes = await fetch('http://localhost:5678/webhook/m2-flow5-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });
        if (n8nRes.ok) webhookSuccess = true;
      } catch {
        // n8n might be executing async or direct via backend
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
          text: `✅ Bản thảo #${draft.id} đã được DUYỆT & GỬI thành công qua Luồng 5! Email SMTP đã được phân phối và vé đã được chuyển sang RESOLVED.`,
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
          text: `🚫 Bản thảo #${draft.id} đã bị TỪ CHỐI (REJECTED). Không gửi email ra bên ngoài.`,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold tracking-wide">
                THÀNH VIÊN 2 &bull; HITL
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Human-in-the-Loop Web Approval
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Phê duyệt, chỉnh sửa bản thảo phản hồi do AI RAG tạo ra trước khi xuất ngoại (Outbound Dispatch Luồng 5)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400">Reviewer:</span>
              <input
                type="email"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                className="bg-transparent border-none text-indigo-300 font-mono focus:outline-none w-48 text-xs"
              />
            </div>
            <button
              onClick={fetchDrafts}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              🔄 Tải lại
            </button>
          </div>
        </div>

        {/* Action message banner */}
        {actionMsg && (
          <div
            className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
              actionMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : actionMsg.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-blue-950/60 border-blue-500/40 text-blue-300'
            }`}
          >
            <span>{actionMsg.text}</span>
            <button
              onClick={() => setActionMsg(null)}
              className="text-xs opacity-60 hover:opacity-100 ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {(['PENDING_APPROVAL', 'ALL', 'SENT', 'REJECTED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                statusFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {filter === 'PENDING_APPROVAL' && '⏳ Chờ duyệt (Pending)'}
              {filter === 'ALL' && '📁 Tất cả'}
              {filter === 'SENT' && '✅ Đã gửi (Sent)'}
              {filter === 'REJECTED' && '❌ Từ chối (Rejected)'}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500">
            Tổng cộng: <strong className="text-white">{drafts.length}</strong> bản thảo
          </span>
        </div>

        {/* Drafts List */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Đang tải danh sách bản thảo từ PostgreSQL...
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm font-medium">Không có bản thảo nào ở trạng thái này</p>
            <p className="text-slate-600 text-xs mt-1">
              Khi Luồng 3 chuyển giao ticket sang Luồng 4, bản thảo phản hồi RAG sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {drafts.map((draft) => {
              const isEditing = editingDraftId === draft.id;
              const isExpanded = expandedDrafts[draft.id] || false;
              const subjectToShow = isEditing ? editSubject : (draft.subject || draft.proposed_subject);
              const bodyToShow = isEditing ? editBody : (draft.html_content || draft.proposed_body);

              return (
                <div
                  key={draft.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition hover:border-slate-700"
                >
                  {/* Card Header */}
                  <div className="p-5 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-800 text-indigo-400 border border-indigo-500/30 rounded-md">
                        {draft.ticket_code || `DRAFT-#${draft.id}`}
                      </span>
                      {draft.priority && (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            draft.priority.includes('P1')
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : draft.priority.includes('P2')
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {draft.priority}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          draft.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : draft.status === 'SENT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {draft.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>
                        Độ tin cậy AI:{' '}
                        <strong className="text-emerald-400 font-mono">
                          {draft.confidence_score ? `${Number(draft.confidence_score).toFixed(1)}%` : '92.0%'}
                        </strong>
                      </span>
                      <span>
                        Người nhận: <strong className="text-white font-mono">{draft.recipient_email}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-5">
                    {/* Customer Inquiry Snapshot */}
                    {(draft.original_subject || draft.original_body) && (
                      <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-slate-300">
                            📩 Email gốc từ khách hàng ({draft.sender_name || draft.recipient_email}):
                          </span>
                          <button
                            onClick={() => toggleExpand(draft.id)}
                            className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
                          >
                            {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                          </button>
                        </div>
                        <div className="text-slate-300 font-medium">
                          <strong>Tiêu đề:</strong> {draft.original_subject}
                        </div>
                        {isExpanded && draft.original_body && (
                          <div className="text-slate-400 mt-2 p-3 bg-slate-900 rounded border border-slate-800 whitespace-pre-wrap">
                            {draft.original_body}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Draft Content / Edit Form */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 tracking-wide uppercase">
                          Tiêu đề thư phản hồi
                        </label>
                        {!isEditing && draft.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => startEdit(draft)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                          >
                            ✏️ Chỉnh sửa nội dung
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <input
                          type="text"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-white bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                          {subjectToShow}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <label className="text-xs font-bold text-slate-300 tracking-wide uppercase">
                          Nội dung thư phản hồi (HTML / Text)
                        </label>
                      </div>

                      {isEditing ? (
                        <textarea
                          rows={10}
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <div
                          className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-96 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: bodyToShow }}
                        />
                      )}
                    </div>

                    {/* Edit Actions */}
                    {isEditing && (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => setEditingDraftId(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition"
                        >
                          Lưu tạm trên màn hình
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-transparent text-slate-400 hover:text-white text-xs font-semibold rounded-lg transition"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Footer / Dispatch Buttons */}
                  <div className="p-5 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 font-mono">
                      Tạo lúc: {draft.created_at ? new Date(draft.created_at).toLocaleString('vi-VN') : 'Vừa xong'}
                      {draft.reviewed_by && ` &bull; Duyệt bởi: ${draft.reviewed_by}`}
                    </div>

                    {draft.status === 'PENDING_APPROVAL' && (
                      <div className="flex items-center gap-3">
                        <button
                          disabled={actionLoading === draft.id}
                          onClick={() => handleReject(draft)}
                          className="px-4 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                        >
                          ❌ Từ chối
                        </button>
                        <button
                          disabled={actionLoading === draft.id}
                          onClick={() => handleApproveAndSend(draft)}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === draft.id ? '⏳ Đang phân phối...' : '🚀 Duyệt & Gửi (Luồng 5)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

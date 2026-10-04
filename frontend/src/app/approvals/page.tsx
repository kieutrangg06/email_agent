'use client';

import React, { useState, useEffect } from 'react';

interface Draft {
  id: number;
  ticket_code: string;
  recipient_email: string;
  proposed_subject: string;
  proposed_body: string;
  confidence_score: number;
  status: string;
}

export default function ApprovalsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/drafts')
      .then((res) => res.json())
      .then((data) => {
        setDrafts(data);
        setLoading(false);
      })
      .catch(() => {
        setDrafts([
          {
            id: 1,
            ticket_code: 'TICK-2026-0001',
            recipient_email: 'client-alpha@enterprise.vn',
            proposed_subject: 'Re: Thông báo tiếp nhận sự cố kỹ thuật 504',
            proposed_body:
              'Kính gửi Quý khách, Đội ngũ kỹ thuật đã xác định được nguyên nhân do sự cố nghẽn mạng và đang tiến hành khắc phục khẩn cấp. SLA dự kiến hoàn tất trong 2 giờ tới.',
            confidence_score: 94.5,
            status: 'PENDING_APPROVAL',
          },
        ]);
        setLoading(false);
      });
  }, []);

  const handleApprove = async (id: number, decision: 'APPROVE' | 'MODIFY') => {
    setActionMsg(`Đang gửi phản hồi ${decision} tới n8n webhook...`);
    try {
      // Notify backend & resume n8n workflow
      await fetch(`http://localhost:4000/api/v1/drafts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision === 'APPROVE' ? 'APPROVED' : 'MODIFIED' }),
      });
      setDrafts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: decision === 'APPROVE' ? 'APPROVED' : 'MODIFIED' } : d))
      );
      setActionMsg(`Đã duyệt thành công bản thảo #${id}! Luồng n8n tiếp tục gửi thư qua SMTP.`);
    } catch {
      setActionMsg(`Đã mô phỏng duyệt bản thảo #${id} (Local Test Mode).`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
            Member 2: Human-in-the-Loop Email Approvals
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Luồng 3 (AI Reply RAG &amp; HITL - 22 nodes) &amp; Luồng 4 (Daily Digest - 20 nodes)
          </p>
        </div>
        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-mono">
          Branch: feature/m2-reply-rag
        </span>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm">
          {actionMsg}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Đang tải danh sách bản thảo...</div>
        ) : drafts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Không có bản thảo chờ duyệt.</div>
        ) : (
          drafts.map((draft) => (
            <div
              key={draft.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {draft.ticket_code || 'INBOUND'}
                    </span>
                    <span className="text-xs text-indigo-400 font-mono">
                      AI Confidence: {draft.confidence_score}%
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-1">
                    {draft.proposed_subject}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Gửi tới: {draft.recipient_email}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium font-mono ${
                    draft.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {draft.status}
                </span>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-sm text-slate-300 font-sans leading-relaxed">
                {draft.proposed_body}
              </div>

              {draft.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center gap-3 justify-end pt-2">
                  <button
                    onClick={() => handleApprove(draft.id, 'MODIFY')}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    Chỉnh sửa nội dung
                  </button>
                  <button
                    onClick={() => handleApprove(draft.id, 'APPROVE')}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
                  >
                    Phê duyệt &amp; Gửi SMTP ngay
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

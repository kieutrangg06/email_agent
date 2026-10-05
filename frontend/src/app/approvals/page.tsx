'use client';

import React, { useState, useEffect } from 'react';

interface Draft {
  id: number;
  ticket_code: string;
  recipient_email: string;
  sender_name?: string;
  original_subject?: string;
  original_body?: string;
  proposed_subject: string;
  proposed_body: string;
  confidence_score: number;
  status: string;
  knowledge_context?: any[];
  approval_resume_url?: string;
  n8n_execution_id?: string;
  created_at?: string;
  reviewed_at?: string;
  sent_at?: string;
  reviewed_by?: string;
}

interface KnowledgeItem {
  id: number;
  topic: string;
  keywords: string;
  content: string;
  created_at: string;
}

interface DigestItem {
  id: number;
  summary_date: string;
  total_received: number;
  total_pending_tickets: number;
  total_p1: number;
  key_insights: any;
  risk_summary: string;
  recommendations: any;
  incident_spike: boolean;
  incident_count: number;
  increase_percent: number | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'approvals' | 'knowledge' | 'digest'>('approvals');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [digestList, setDigestList] = useState<DigestItem[]>([]);

  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [loadingDigest, setLoadingDigest] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Editing state for inline modification
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  // Expand original email preview
  const [expandedContext, setExpandedContext] = useState<Record<number, boolean>>({});

  // Simulation modal
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simSender, setSimSender] = useState('enterprise-client@acme.corp');
  const [simSubject, setSimSubject] = useState('Yêu cầu hướng dẫn chính sách bảo mật DKIM & SSL');
  const [simBody, setSimBody] = useState('Xin chào, chúng tôi muốn xác thực tiêu chuẩn mã hóa và bảo mật đường truyền trước khi ký kết gia hạn.');

  // Load drafts
  const fetchDrafts = () => {
    setLoadingDrafts(true);
    fetch('http://localhost:4000/api/v1/drafts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDrafts(data);
        }
        setLoadingDrafts(false);
      })
      .catch(() => {
        // Fallback default sample data
        setDrafts([
          {
            id: 1,
            ticket_code: 'TICK-2026-0001',
            recipient_email: 'client-alpha@enterprise.vn',
            sender_name: 'Nguyễn Văn Alpha',
            original_subject: 'Sự cố lỗi mạng 504 khi truy xuất báo cáo',
            original_body: 'Chào đội ngũ hỗ trợ, sáng nay hệ thống chúng tôi liên tục gặp lỗi 504 Gateway Timeout khi truy xuất báo cáo doanh thu.',
            proposed_subject: 'Re: Thông báo tiếp nhận và xử lý sự cố kỹ thuật 504 (TICK-2026-0001)',
            proposed_body:
              'Kính gửi Quý khách,\n\nCảm ơn Quý khách đã gửi thông tin. Đội ngũ kỹ thuật đã xác định được nguyên nhân do sự cố nghẽn lưu lượng tạm thời tại cụm máy chủ và đang khẩn trương khắc phục. Theo cam kết SLA mức độ P1, sự cố dự kiến được xử lý dứt điểm trong vòng 2 giờ tới.\n\nTrân trọng,\nĐội ngũ Kỹ thuật Doanh nghiệp',
            confidence_score: 94.5,
            status: 'PENDING_APPROVAL',
            knowledge_context: [
              { id: 4, topic: 'Cam kết chất lượng dịch vụ SLA', content: 'Thời gian phản hồi P1 trong 2 giờ' },
            ],
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            ticket_code: 'TICK-2026-0002',
            recipient_email: 'billing-partner@corp.vn',
            sender_name: 'Trần Thị Beta',
            original_subject: 'Hỏi về chính sách hoàn tiền hợp đồng dịch vụ',
            original_body: 'Kính gửi công ty, chúng tôi muốn hỏi về điều kiện được hoàn tiền trong tháng đầu sử dụng nếu có trục trặc.',
            proposed_subject: 'Re: Hướng dẫn chính sách hoàn tiền dịch vụ (TICK-2026-0002)',
            proposed_body:
              'Kính gửi Quý khách,\n\nTheo chính sách của chúng tôi, khách hàng được quyền yêu cầu hoàn tiền 100% trong vòng 14 ngày kể từ khi kích hoạt nếu hệ thống gặp sự cố không thể khắc phục. Bộ phận Chăm sóc Khách hàng sẽ liên hệ để hỗ trợ Quý khách chi tiết các bước tiếp theo.\n\nTrân trọng,\nBộ phận CSKH',
            confidence_score: 88.0,
            status: 'PENDING_APPROVAL',
            knowledge_context: [
              { id: 1, topic: 'Chính sách hoàn tiền', content: 'Hoàn tiền 100% trong vòng 14 ngày' },
            ],
            created_at: new Date().toISOString(),
          },
        ]);
        setLoadingDrafts(false);
      });
  };

  // Load Knowledge
  const fetchKnowledge = () => {
    setLoadingKnowledge(true);
    fetch('http://localhost:4000/api/v1/knowledge')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setKnowledgeList(data);
        setLoadingKnowledge(false);
      })
      .catch(() => setLoadingKnowledge(false));
  };

  // Load Digest
  const fetchDigest = () => {
    setLoadingDigest(true);
    fetch('http://localhost:4000/api/v1/digest')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDigestList(data);
        setLoadingDigest(false);
      })
      .catch(() => setLoadingDigest(false));
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  useEffect(() => {
    if (activeTab === 'knowledge') fetchKnowledge();
    if (activeTab === 'digest') fetchDigest();
  }, [activeTab]);

  const handleApprove = async (
    id: number,
    decision: 'APPROVE' | 'MODIFY' | 'REJECT',
    modifiedSubject?: string,
    modifiedBody?: string
  ) => {
    setActionLoading(id);
    setActionMsg(`Đang gửi quyết định ${decision} tới Backend API & đánh thức n8n Resume Webhook...`);
    try {
      const payload: any = {
        status: decision === 'APPROVE' ? 'APPROVED' : decision === 'MODIFY' ? 'MODIFIED' : 'REJECTED',
        reviewed_by: 'reviewer@enterprise.vn',
      };
      if (decision === 'MODIFY') {
        payload.proposed_subject = modifiedSubject;
        payload.proposed_body = modifiedBody;
      }

      const res = await fetch(`http://localhost:4000/api/v1/drafts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setDrafts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...data } : d))
        );
        setEditingDraftId(null);
        setActionMsg(
          `✅ Đã phê duyệt bản thảo #${id}! ${
            data.n8n_resumed
              ? 'Webhook n8n đã được đánh thức, tiến trình gửi SMTP đang thực thi.'
              : 'Trạng thái đã cập nhật trong PostgreSQL.'
          }`
        );
      } else {
        throw new Error('API update failed');
      }
    } catch {
      // Local fallback simulation
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: decision === 'APPROVE' ? 'APPROVED' : decision === 'MODIFY' ? 'MODIFIED' : 'REJECTED',
                proposed_subject: modifiedSubject || d.proposed_subject,
                proposed_body: modifiedBody || d.proposed_body,
                reviewed_by: 'reviewer@enterprise.vn',
              }
            : d
        )
      );
      setEditingDraftId(null);
      setActionMsg(`⚡ Đã phê duyệt bản thảo #${id} (Chế độ mô phỏng Test Mode).`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartEdit = (draft: Draft) => {
    setEditingDraftId(draft.id);
    setEditSubject(draft.proposed_subject);
    setEditBody(draft.proposed_body);
  };

  const handleSimulateInbound = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/v1/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_code: `TICK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          recipient_email: simSender,
          sender_name: 'Khách hàng thử nghiệm',
          original_subject: simSubject,
          original_body: simBody,
          proposed_subject: `Re: ${simSubject}`,
          proposed_body: `Kính gửi Quý khách,\n\nChúng tôi đã nhận được yêu cầu về "${simSubject}". Hệ thống áp dụng chuẩn mã hóa AES-256 cho dữ liệu tĩnh và TLS 1.3 cho toàn bộ kết nối truyền nhận.\n\nTrân trọng,\nĐội ngũ Kỹ thuật`,
          confidence_score: 91.2,
          knowledge_context: [{ id: 5, topic: 'Bảo mật dữ liệu', content: 'Chuẩn mã hóa AES-256 và TLS 1.3' }],
        }),
      });
      if (res.ok) {
        setIsSimulateModalOpen(false);
        fetchDrafts();
        setActionMsg('✅ Đã tạo mới bản thảo email thử nghiệm!');
      }
    } catch {
      setIsSimulateModalOpen(false);
      setActionMsg('⚠️ Không thể kết nối tới Backend port 4000.');
    }
  };

  const filteredDrafts = drafts.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      d.proposed_subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.ticket_code && d.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = drafts.filter((d) => d.status === 'PENDING_APPROVAL').length;
  const approvedCount = drafts.filter((d) => d.status === 'APPROVED' || d.status === 'MODIFIED' || d.status === 'SENT').length;
  const avgConfidence =
    drafts.length > 0
      ? (drafts.reduce((acc, d) => acc + Number(d.confidence_score || 0), 0) / drafts.length).toFixed(1)
      : '0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Member 2: Human-in-the-Loop Email Approvals & RAG
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Luồng 3: AI Reply Generator với RAG (22 nodes) &bull; Luồng 4: Daily Executive Digest (20 nodes)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition flex items-center gap-1.5"
          >
            <span>+</span> Giả lập Thư Inbound
          </button>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-mono">
            feature/m2-reply-rag
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 uppercase font-mono">Chờ phê duyệt</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bản thảo cần xử lý</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 uppercase font-mono">Đã duyệt / Đã gửi</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Đã hoàn tất gửi SMTP</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 uppercase font-mono">Độ tự tin RAG TB</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{avgConfidence}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Gemini 1.5 Flash AI</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 uppercase font-mono">n8n Engine Status</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">22 + 20</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Nodes Active &bull; Host mode</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 text-sm font-medium">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Duyệt Thư HITL (Luồng 3)</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 font-mono">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'knowledge'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Cơ sở Tri thức RAG ({knowledgeList.length || '...'})</span>
        </button>

        <button
          onClick={() => setActiveTab('digest')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'digest'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Báo cáo Điều hành Ngày (Luồng 4)</span>
        </button>
      </div>

      {/* Action Banner */}
      {actionMsg && (
        <div className="p-3.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-sm flex items-center justify-between animate-fadeIn">
          <span>{actionMsg}</span>
          <button
            onClick={() => setActionMsg('')}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: EMAIL DRAFTS HITL */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
              {(['ALL', 'PENDING_APPROVAL', 'APPROVED', 'MODIFIED', 'SENT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition font-mono ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, email, ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Drafts List */}
          {loadingDrafts ? (
            <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách bản thảo email...</div>
          ) : filteredDrafts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm bg-slate-900/30 border border-slate-800 rounded-xl">
              Không tìm thấy bản thảo nào phù hợp bộ lọc.
            </div>
          ) : (
            filteredDrafts.map((draft) => {
              const isEditing = editingDraftId === draft.id;
              const isActioning = actionLoading === draft.id;
              const isExpanded = expandedContext[draft.id] || false;

              return (
                <div
                  key={draft.id}
                  className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700/80 transition"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs bg-slate-800 text-indigo-300 px-2.5 py-0.5 rounded border border-slate-700">
                          {draft.ticket_code || 'INBOUND'}
                        </span>
                        <span
                          className={`text-xs font-mono px-2 py-0.5 rounded ${
                            Number(draft.confidence_score) >= 90
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : Number(draft.confidence_score) >= 80
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          RAG Confidence: {draft.confidence_score}%
                        </span>
                        {draft.sender_name && (
                          <span className="text-xs text-slate-400">
                            Người gửi: <strong className="text-slate-300">{draft.sender_name}</strong>
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="pt-2">
                          <label className="text-xs text-slate-400 block mb-1">Chỉnh sửa tiêu đề:</label>
                          <input
                            type="text"
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      ) : (
                        <h3 className="text-base font-semibold text-white mt-1">
                          {draft.proposed_subject}
                        </h3>
                      )}

                      <div className="text-xs text-slate-400 font-mono">
                        Gửi tới: <span className="text-slate-200">{draft.recipient_email}</span>
                        {draft.reviewed_by && (
                          <span className="ml-3 text-slate-500">
                            &bull; Người duyệt: {draft.reviewed_by}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-medium ${
                          draft.status === 'APPROVED' || draft.status === 'SENT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : draft.status === 'MODIFIED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : draft.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {draft.status}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Inbound Email & Knowledge Context */}
                  {(draft.original_body || (draft.knowledge_context && draft.knowledge_context.length > 0)) && (
                    <div className="text-xs border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                      <button
                        onClick={() =>
                          setExpandedContext((prev) => ({ ...prev, [draft.id]: !isExpanded }))
                        }
                        className="w-full px-3 py-2 text-left text-slate-400 hover:text-slate-200 flex items-center justify-between transition"
                      >
                        <span>
                          {isExpanded ? '▼ Ẩn' : '▶ Xem'} Thư Inbound gốc &amp; Tri thức RAG liên kết (
                          {draft.knowledge_context?.length || 0} bài viết)
                        </span>
                        <span className="text-indigo-400 font-mono">RAG Injected</span>
                      </button>

                      {isExpanded && (
                        <div className="p-3 border-t border-slate-800 space-y-3 bg-slate-950">
                          {draft.original_body && (
                            <div>
                              <div className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                                Nội dung thư gốc của khách hàng:
                              </div>
                              <p className="text-slate-300 italic whitespace-pre-line bg-slate-900 p-2.5 rounded border border-slate-800">
                                {draft.original_body}
                              </p>
                            </div>
                          )}

                          {draft.knowledge_context && draft.knowledge_context.length > 0 && (
                            <div>
                              <div className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                                Dữ liệu tri thức được truy xuất (Vector Context):
                              </div>
                              <div className="space-y-1.5">
                                {draft.knowledge_context.map((kb: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-indigo-950/20 border border-indigo-500/20 rounded text-slate-300 text-xs"
                                  >
                                    <strong className="text-indigo-300">
                                      {kb.topic || `Mục ${idx + 1}`}:
                                    </strong>{' '}
                                    {kb.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Box */}
                  {isEditing ? (
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Chỉnh sửa nội dung email phản hồi:
                      </label>
                      <textarea
                        rows={6}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-line">
                      {draft.proposed_body}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    <div className="text-xs text-slate-500 font-mono">
                      {draft.created_at && (
                        <span>Khởi tạo: {new Date(draft.created_at).toLocaleString('vi-VN')}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setEditingDraftId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                          >
                            Hủy
                          </button>
                          <button
                            disabled={isActioning}
                            onClick={() => handleApprove(draft.id, 'MODIFY', editSubject, editBody)}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                          >
                            Lưu sửa &amp; Gửi SMTP ngay
                          </button>
                        </>
                      ) : draft.status === 'PENDING_APPROVAL' ? (
                        <>
                          <button
                            disabled={isActioning}
                            onClick={() => handleApprove(draft.id, 'REJECT')}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-medium transition"
                          >
                            Từ chối
                          </button>
                          <button
                            onClick={() => handleStartEdit(draft)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                          >
                            Chỉnh sửa nội dung
                          </button>
                          <button
                            disabled={isActioning}
                            onClick={() => handleApprove(draft.id, 'APPROVE')}
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
                          >
                            <span>✓</span> Phê duyệt &amp; Gửi SMTP ngay
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          Đã xử lý quyết định ({draft.status})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE BROWSER */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Cơ sở Tri thức Nội bộ Doanh nghiệp (RAG Source)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Được Luồng 3 (Node 4: Query Knowledge Base) truy xuất ngữ cảnh để đưa vào prompt Gemini AI.
              </p>
            </div>
            <button
              onClick={fetchKnowledge}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition"
            >
              Làm mới
            </button>
          </div>

          {loadingKnowledge ? (
            <div className="p-12 text-center text-slate-500 text-sm">Đang tải cơ sở tri thức...</div>
          ) : knowledgeList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-xl">
              Chưa có bài viết tri thức nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledgeList.map((kb) => (
                <div
                  key={kb.id}
                  className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-white">{kb.topic}</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      ID #{kb.id}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    {kb.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Từ khóa:</span>
                    {kb.keywords &&
                      kb.keywords.split(',').map((kw, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        >
                          {kw.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAILY DIGEST INTELLIGENCE */}
      {activeTab === 'digest' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Báo cáo Điều hành Ngày (Daily Inbox Digest)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Được sinh tự động từ Luồng 4 (20 nodes, chạy lúc 18:00 hằng ngày hoặc đẩy qua API).
              </p>
            </div>
            <button
              onClick={fetchDigest}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition"
            >
              Làm mới
            </button>
          </div>

          {loadingDigest ? (
            <div className="p-12 text-center text-slate-500 text-sm">Đang tải báo cáo điều hành...</div>
          ) : digestList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-xl">
              Chưa có dữ liệu báo cáo ngày.
            </div>
          ) : (
            digestList.map((d) => (
              <div
                key={d.id}
                className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white font-mono">
                      Báo cáo Ngày: {String(d.summary_date).slice(0, 10)}
                    </span>
                    {d.incident_spike && (
                      <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-full text-xs font-mono font-semibold animate-pulse">
                        ⚠️ CẢNH BÁO SỰ CỐ TĂNG VỌT (+{d.increase_percent}%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>Tổng nhận: <strong className="text-slate-200">{d.total_received}</strong></span>
                    <span>Sự cố P1: <strong className="text-rose-400">{d.total_p1}</strong></span>
                    <span>Chờ xử lý: <strong className="text-amber-400">{d.total_pending_tickets}</strong></span>
                  </div>
                </div>

                {/* Key Insights */}
                {d.key_insights && (
                  <div>
                    <h4 className="text-xs uppercase font-mono text-slate-400 mb-1">
                      Nhận định Điều hành Chính (AI Key Insights):
                    </h4>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm text-slate-300">
                      {typeof d.key_insights === 'string'
                        ? d.key_insights
                        : JSON.stringify(d.key_insights, null, 2)}
                    </div>
                  </div>
                )}

                {/* Risk Summary */}
                {d.risk_summary && (
                  <div>
                    <h4 className="text-xs uppercase font-mono text-amber-400 mb-1">
                      Đánh giá Rủi ro Vận hành (Risk Summary):
                    </h4>
                    <p className="text-xs text-slate-300 bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-lg">
                      {d.risk_summary}
                    </p>
                  </div>
                )}

                {/* Delivery stats */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>
                    Email điều hành: Đã gửi {d.sent_count}/{d.recipient_count} (Lỗi: {d.failed_count})
                  </span>
                  <span>Đồng bộ từ n8n Luồng 4</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Simulate Inbound Email */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">Giả lập Email Khách hàng Inbound</h3>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Email người gửi:</label>
                <input
                  type="email"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tiêu đề email:</label>
                <input
                  type="text"
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nội dung câu hỏi / thắc mắc:</label>
                <textarea
                  rows={4}
                  value={simBody}
                  onChange={(e) => setSimBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleSimulateInbound}
                className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Tạo Thư &amp; Kích hoạt Soạn thảo RAG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

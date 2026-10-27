'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE_URL } from '../../lib/api';
import {
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  LifeBuoy,
  ShieldAlert,
  Send,
  Building,
  Mail,
  X,
  AlertTriangle,
  Users,
  Shield,
  Plus,
} from 'lucide-react';

interface TriageLog {
  id: number;
  sender_email: string;
  sender_name?: string;
  subject: string;
  body_snippet: string;
  category: string;
  priority: string;
  sentiment: string;
  urgency_reason: string;
  sla_deadline: string;
  status: string;
  created_at: string;
}

interface Ticket {
  id: number;
  ticket_code: string;
  sender_email: string;
  title: string;
  description: string;
  summary?: string;
  category: string;
  priority: string;
  assigned_to: string;
  agent_email?: string;
  status: string;
  first_response_sla: string;
  created_at: string;
  resolved_at?: string;
}

interface Agent {
  id: number;
  name: string;
  email: string;
  category: string;
  status: string;
  active_tickets_count: number;
}

interface QuarantineLog {
  id: number;
  source?: string;
  event_type?: string;
  sender_email?: string;
  subject?: string;
  reason?: string;
  payload?: any;
  created_at: string;
}

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<'triage' | 'tickets' | 'agents' | 'quarantine'>('triage');

  // Data states
  const [triageLogs, setTriageLogs] = useState<TriageLog[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [quarantineLogs, setQuarantineLogs] = useState<QuarantineLog[]>([]);
  const [triageStats, setTriageStats] = useState({
    total: 0,
    p1Count: 0,
    techCount: 0,
    pendingCount: 0,
    openTicketsCount: 0,
  });
  const [slaStats, setSlaStats] = useState({
    total: 0,
    breached: 0,
    on_track: 0,
    resolved: 0,
  });

  // Filter states
  const [triageSearch, setTriageSearch] = useState('');
  const [triageCategory, setTriageCategory] = useState('All');
  const [triagePriority, setTriagePriority] = useState('All');
  const [triageStatusFilter, setTriageStatusFilter] = useState('All');

  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatus, setTicketStatus] = useState('All');
  const [ticketPriority, setTicketPriority] = useState('All');

  // Modal / Detail states
  const [selectedMail, setSelectedMail] = useState<TriageLog | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Customer Email Ingest Modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [custName, setCustName] = useState('Lê Thị Kiều Trang');
  const [custEmail, setCustEmail] = useState('trangltk.24it@vku.udn.vn');
  const [custSubject, setCustSubject] = useState('[SỰ CỐ KHẨN CẤP] Cổng đăng ký học phần DACS4 VKU bị lỗi 504');
  const [custCategory, setCustCategory] = useState('Technical');
  const [custPriority, setCustPriority] = useState('P1 - Critical');
  const [custBody, setCustBody] = useState('Kính gửi ban kỹ thuật, hệ thống đăng ký học phần bị nghẽn mạng quá tải cơ sở dữ liệu, đề nghị nâng cấp máy chủ khẩn cấp.');
  const [isSubmittingCustEmail, setIsSubmittingCustEmail] = useState(false);

  // Quarantine Modal state
  const [showQuarantineModal, setShowQuarantineModal] = useState(false);
  const [quarantineSender, setQuarantineSender] = useState('security@vietcombannk-update.com');
  const [quarantineSubject, setQuarantineSubject] = useState('[CẢNH BÁO KHẨN CẤP] Tài khoản ngân hàng số bị khóa, yêu cầu đăng nhập OTP ngay');
  const [quarantineReason, setQuarantineReason] = useState('Phishing Scam - Domain mạo danh ngân hàng & đánh cắp OTP');
  const [isSubmittingQuarantine, setIsSubmittingQuarantine] = useState(false);

  // Feedback & Loading states
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Fetch all endpoints
  const loadTriageData = async () => {
    try {
      const q = new URLSearchParams();
      if (triageCategory !== 'All') q.append('category', triageCategory);
      if (triagePriority !== 'All') q.append('priority', triagePriority);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/triage/logs?${q.toString()}`).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/triage/stats`).catch(() => null),
      ]);
      if (logsRes && logsRes.ok) setTriageLogs(await logsRes.json());
      if (statsRes && statsRes.ok) setTriageStats(await statsRes.json());
    } catch (e) {
      console.warn('Error fetching triage data:', e);
    }
  };

  const loadTicketData = async () => {
    try {
      const q = new URLSearchParams();
      if (ticketStatus !== 'All') q.append('status', ticketStatus);
      if (ticketPriority !== 'All') q.append('priority', ticketPriority);

      const [res, slaRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/tickets?${q.toString()}`).catch(() => null),
        fetch(`${API_BASE_URL}/api/v1/tickets/stats/sla`).catch(() => null),
      ]);
      if (res && res.ok) setTickets(await res.json());
      if (slaRes && slaRes.ok) setSlaStats(await slaRes.json());
    } catch (e) {
      console.warn('Error fetching tickets data:', e);
    }
  };

  const loadAgentsData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tickets/agents`).catch(() => null);
      if (res && res.ok) setAgents(await res.json());
    } catch (e) {
      console.warn('Error fetching agents:', e);
    }
  };

  const loadQuarantineData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/triage/quarantine`).catch(() => null);
      if (res && res.ok) setQuarantineLogs(await res.json());
    } catch (e) {
      console.warn('Error fetching quarantine logs:', e);
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    await Promise.all([loadTriageData(), loadTicketData(), loadAgentsData(), loadQuarantineData()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
    const interval = setInterval(() => {
      loadTriageData();
      loadTicketData();
      loadAgentsData();
      loadQuarantineData();
    }, 3500);
    return () => clearInterval(interval);
  }, [triageCategory, triagePriority, ticketStatus, ticketPriority]);

  // Update Triage Status
  const handleUpdateTriageStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/triage/logs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast('Cập nhật thành công', `Đã đổi trạng thái sang ${status}`);
        await loadTriageData();
        if (selectedMail && selectedMail.id === id) {
          setSelectedMail({ ...selectedMail, status });
        }
      }
    } catch (e) {
      showToast('Lỗi cập nhật', 'Không thể kết nối đến Backend', 'error');
    }
  };

  // Resolve Ticket
  const handleResolveTicket = async (code: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tickets/${code}/resolve`, {
        method: 'PATCH',
      });
      if (res.ok) {
        showToast('Hoàn thành vé', `Vé ${code} đã được đánh dấu RESOLVED và cập nhật tải chuyên viên (-1)`);
        await Promise.all([loadTicketData(), loadAgentsData()]);
        if (selectedTicket && selectedTicket.ticket_code === code) {
          setSelectedTicket({ ...selectedTicket, status: 'RESOLVED' });
        }
      }
    } catch (e) {
      showToast('Lỗi xử lý', 'Không thể kết nối đến Backend', 'error');
    }
  };

  // Giả lập Khách hàng gửi email thật vào hệ thống
  const handleSendCustomerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail || !custSubject || !custBody) {
      showToast('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường', 'error');
      return;
    }
    setIsSubmittingCustEmail(true);
    try {
      const code = `TK-VKU-${Date.now().toString().slice(-4)}`;
      // 1. Tạo bản ghi Hộp Thư Triage
      await fetch(`${API_BASE_URL}/api/v1/triage/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: custName,
          sender_email: custEmail,
          subject: custSubject,
          body_snippet: custBody,
          category: custCategory,
          priority: custPriority,
          sentiment: custPriority.includes('P1') ? 'Khan cap' : 'Tieu cuc',
          urgency_reason: custPriority.includes('P1') ? 'Sự cố P1 đe dọa gián đoạn dịch vụ toàn trường' : 'Yêu cầu hỗ trợ kỹ thuật định kỳ',
          status: 'PENDING',
        }),
      });

      // 2. Tạo Vé Kỹ thuật & Điều phối KTV
      await fetch(`${API_BASE_URL}/api/v1/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_code: code,
          customer_email: custEmail,
          sender_email: custEmail,
          title: custSubject,
          description: custBody,
          category: custCategory,
          priority: custPriority,
        }),
      });

      // 3. Tạo Bản nháp phản hồi AI RAG
      await fetch(`${API_BASE_URL}/api/v1/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_code: code,
          recipient_email: custEmail,
          subject: `[TIẾP NHẬN] ${custSubject} - Mã: ${code}`,
          proposed_subject: `[TIẾP NHẬN] ${custSubject} - Mã: ${code}`,
          proposed_body: `<p>Kính gửi quý khách <b>${custName}</b>,</p><p>Hệ thống Doanh nghiệp (<b>tranngo170770@gmail.com</b>) đã tiếp nhận yêu cầu hỗ trợ với mức độ <b>${custPriority}</b> (Mã vé: <b>${code}</b>).</p><p>Đội ngũ kỹ sư đang khẩn trương xử lý sự cố để đảm bảo thời hạn cam kết SLA.</p><p style="margin-top:14px;color:#64748b;font-size:12px;"><i>(Thư phản hồi tự động gửi từ máy chủ SMTP doanh nghiệp: <b>kieutrangg06123@gmail.com</b>)</i></p><p>Trân trọng,<br/><b>Enterprise Support Team</b></p>`,
          confidence_score: 98.8,
          status: 'PENDING_APPROVAL',
        }),
      });

      showToast('Tiếp nhận thành công!', `AI đã tiếp nhận email từ ${custName} và cấp vé ${code}`, 'success');
      setShowCustomerModal(false);
      await reloadAll();
    } catch (err) {
      showToast('Lỗi gửi thư', 'Không thể kết nối đến Backend', 'error');
    } finally {
      setIsSubmittingCustEmail(false);
    }
  };

  // Giả lập nhận email độc hại / Phishing / Malware
  const handleSendQuarantine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarantineSender || !quarantineSubject) {
      showToast('Thiếu thông tin', 'Vui lòng điền người gửi và tiêu đề', 'error');
      return;
    }
    setIsSubmittingQuarantine(true);
    try {
      await fetch(`${API_BASE_URL}/api/v1/triage/quarantine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_email: quarantineSender,
          subject: quarantineSubject,
          quarantine_reason: quarantineReason,
          payload: {
            threat_type: quarantineReason,
            action: 'QUARANTINED_VAULT_ISOLATED',
            simulated_at: new Date().toISOString(),
          },
        }),
      });
      showToast('Đã cách ly thành công!', `Email độc hại từ ${quarantineSender} đã bị cô lập vào kho an ninh`, 'success');
      setShowQuarantineModal(false);
      setActiveTab('quarantine');
      await reloadAll();
    } catch (err) {
      showToast('Lỗi cách ly', 'Không thể gửi bản ghi vào kho an ninh', 'error');
    } finally {
      setIsSubmittingQuarantine(false);
    }
  };

  // Filtered lists
  const filteredTriage = useMemo(() => {
    return triageLogs.filter((l) => {
      const matchSearch =
        l.subject.toLowerCase().includes(triageSearch.toLowerCase()) ||
        l.sender_email.toLowerCase().includes(triageSearch.toLowerCase()) ||
        (l.sender_name && l.sender_name.toLowerCase().includes(triageSearch.toLowerCase()));
      const matchStatus = triageStatusFilter === 'All' || l.status === triageStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [triageLogs, triageSearch, triageStatusFilter]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.ticket_code.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.sender_email.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.assigned_to.toLowerCase().includes(ticketSearch.toLowerCase());
      const matchStatus = ticketStatus === 'All' || t.status === ticketStatus;
      return matchSearch && matchStatus;
    });
  }, [tickets, ticketSearch, ticketStatus]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-short">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : toastMessage.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : 'bg-sky-50/95 border-sky-200 text-sky-900'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            <div className="space-y-0.5">
              <p className="font-bold text-sm">{toastMessage.title}</p>
              <p className="text-xs leading-relaxed opacity-90">{toastMessage.desc}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-rose-150 shadow-sm shadow-rose-100/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Hộp Thư &amp; Vé Hỗ Trợ
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Trung tâm tiếp nhận yêu cầu và điều phối vé hỗ trợ khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-rose-200"
            title="Mở form gửi email với vai trò Khách hàng / Sinh viên thực tế"
          >
            <Send className="w-4 h-4" />
            <span>+ Gửi Email Khách Hàng (Test Thật)</span>
          </button>

          <button
            onClick={() => setShowQuarantineModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-bold transition shadow-sm"
            title="Giả lập nhận email phishing hoặc chứa virus để kiểm tra kho an ninh"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>🛡️ Test Email Độc Hại</span>
          </button>

          <button
            onClick={reloadAll}
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
            <p className="text-[11px] font-medium text-slate-400">Tổng Thư Tiếp Nhận</p>
            <p className="text-xl font-extrabold text-slate-800">{triageStats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Sự Cố P1 Khẩn Cấp</p>
            <p className="text-xl font-extrabold text-rose-600">{triageStats.p1Count}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Vé Kỹ Thuật Đang Mở</p>
            <p className="text-xl font-extrabold text-purple-700">{triageStats.openTicketsCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Vé Đang Trong Hạn SLA</p>
            <p className="text-xl font-extrabold text-emerald-700">{slaStats.on_track}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Thư Rác Cách Ly</p>
            <p className="text-xl font-extrabold text-pink-700">{quarantineLogs.length}</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-rose-200/80 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('triage')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'triage'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Hộp Thư &amp; Phân Loại AI ({triageLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'tickets'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Vé Hỗ Trợ &amp; SLA ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'agents'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Đội Ngũ Kỹ Thuật Viên ({agents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quarantine')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'quarantine'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Kho Cách Ly An Ninh ({quarantineLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: TRIAGE LOGS */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={triageSearch}
                onChange={(e) => setTriageSearch(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, người gửi..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-rose-100 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={triageCategory}
                onChange={(e) => setTriageCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-rose-100 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">Phòng ban: Tất cả</option>
                <option value="Technical">Kỹ thuật (Technical)</option>
                <option value="Sales">Kinh doanh (Sales)</option>
                <option value="Finance">Tài chính (Finance)</option>
                <option value="General">Hỏi đáp chung (General)</option>
              </select>

              <select
                value={triagePriority}
                onChange={(e) => setTriagePriority(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-rose-100 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">Mức ưu tiên: Tất cả</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>

              <select
                value={triageStatusFilter}
                onChange={(e) => setTriageStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-rose-100 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">Trạng thái: Tất cả</option>
                <option value="PENDING">PENDING (Chờ duyệt)</option>
                <option value="PROCESSED">PROCESSED (Đã xử lý)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-rose-150 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-50/50 border-b border-rose-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Người Gửi</th>
                    <th className="py-3.5 px-4">Tiêu Đề Thư</th>
                    <th className="py-3.5 px-3">Phòng Ban</th>
                    <th className="py-3.5 px-3">Mức Độ</th>
                    <th className="py-3.5 px-3">Cảm Xúc AI</th>
                    <th className="py-3.5 px-4">Hạn SLA</th>
                    <th className="py-3.5 px-3">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {filteredTriage.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                            <span>Đang tải dữ liệu...</span>
                          </div>
                        ) : (
                          'Chưa có dữ liệu phân loại nào phù hợp.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredTriage.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-rose-50/30 transition cursor-pointer"
                        onClick={() => setSelectedMail(log)}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{log.sender_name || 'Khách Hàng'}</p>
                          <p className="font-mono text-slate-400 text-[11px] truncate max-w-[160px]">{log.sender_email}</p>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-semibold text-slate-800 truncate">{log.subject}</p>
                          <p className="text-slate-400 text-[11px] truncate">{log.body_snippet}</p>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                              log.category === 'Technical'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : log.category === 'Sales'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.category === 'Finance'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-pink-50 text-pink-700 border border-pink-200'
                            }`}
                          >
                            {log.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              log.priority.includes('P1')
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : log.priority.includes('P2')
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : log.priority.includes('P3')
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {log.priority}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="text-slate-600 font-medium">{log.sentiment}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {log.sla_deadline ? new Date(log.sla_deadline).toLocaleTimeString('vi-VN') + ' ' + new Date(log.sla_deadline).toLocaleDateString('vi-VN') : '---'}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'PROCESSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          {log.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateTriageStatus(log.id, 'PROCESSED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-[11px] transition"
                            >
                              Đã Duyệt
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedMail(log)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium text-[11px] transition"
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-rose-150 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Tìm kiếm mã vé, tiêu đề, kỹ thuật viên..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-rose-100 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-rose-100 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">Trạng thái: Tất cả</option>
                <option value="OPEN">OPEN (Đang mở)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Đang xử lý)</option>
                <option value="RESOLVED">RESOLVED (Đã hoàn thành)</option>
              </select>

              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-rose-100 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">Mức ưu tiên: Tất cả</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-rose-150 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-50/50 border-b border-rose-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Mã Vé</th>
                    <th className="py-3.5 px-4">Tiêu Đề Sự Cố</th>
                    <th className="py-3.5 px-3">Mức Độ</th>
                    <th className="py-3.5 px-4">KTV Được Gán</th>
                    <th className="py-3.5 px-4">Hạn Hoàn Tất SLA</th>
                    <th className="py-3.5 px-3">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                            <span>Đang tải dữ liệu...</span>
                          </div>
                        ) : (
                          'Chưa có vé hỗ trợ nào trong danh sách.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-rose-50/30 transition cursor-pointer"
                        onClick={() => setSelectedTicket(t)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                          {t.ticket_code}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-semibold text-slate-800 truncate">{t.title}</p>
                          <p className="font-mono text-slate-400 text-[11px] truncate">{t.sender_email}</p>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              t.priority.includes('P1')
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : t.priority.includes('P2')
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : t.priority.includes('P3')
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{t.assigned_to}</p>
                          <p className="font-mono text-[11px] text-slate-400">{t.agent_email || 'support@enterprise.com'}</p>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {t.first_response_sla ? new Date(t.first_response_sla).toLocaleTimeString('vi-VN') + ' ' + new Date(t.first_response_sla).toLocaleDateString('vi-VN') : '---'}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          {t.status === 'OPEN' && (
                            <button
                              onClick={() => handleResolveTicket(t.ticket_code)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-[11px] transition"
                            >
                              Đóng Vé
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium text-[11px] transition"
                          >
                            Chi Tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPORT AGENTS */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white p-5 rounded-2xl border border-rose-150 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-400 to-pink-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {agent.name.split(' ').map((n) => n[0]).slice(-2).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{agent.name}</h3>
                      <p className="font-mono text-[11px] text-slate-400">{agent.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {agent.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-rose-50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Phòng ban:</span>
                    <span className="font-semibold text-slate-700">{agent.category}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Số vé đang phụ trách:</span>
                    <span className="font-bold text-rose-600">{agent.active_tickets_count} vé</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className="bg-gradient-to-r from-rose-400 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(agent.active_tickets_count * 25, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: QUARANTINE VAULT */}
      {activeTab === 'quarantine' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Kho Cách Ly An Ninh Email Doanh Nghiệp (Quarantine Vault)</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Ngăn chặn và cô lập tự động các email Phishing đánh cắp OTP hoặc mã độc .exe đe dọa an toàn mạng.
              </p>
            </div>
            <button
              onClick={() => setShowQuarantineModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold transition shadow-md shadow-rose-900/50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Giả Lập Email Độc Hại / Spam (Test Quarantine)</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-rose-150 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-50/50 border-b border-rose-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Thời Điểm</th>
                    <th className="py-3.5 px-4">Người Gửi Bị Chặn</th>
                    <th className="py-3.5 px-4">Tiêu Đề Thư Rác</th>
                    <th className="py-3.5 px-4">Sự Kiện An Ninh</th>
                    <th className="py-3.5 px-4">Trạng Thái Lưu Trữ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {quarantineLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <p className="mb-2">Kho lưu trữ cách ly an ninh hiện không có bản ghi thư rác nào.</p>
                        <button
                          onClick={() => setShowQuarantineModal(true)}
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold underline"
                        >
                          Bấm vào đây để test gửi email độc hại mẫu
                        </button>
                      </td>
                    </tr>
                  ) : (
                    quarantineLogs.map((q) => {
                      const sender = q.sender_email || q.payload?.sender_email || 'unknown@phishing.com';
                      const subj = q.subject || q.payload?.subject || 'Không có tiêu đề';
                      const reason = q.reason || q.event_type || 'QUARANTINE';
                      return (
                        <tr key={q.id} className="hover:bg-rose-50/20">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {new Date(q.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-rose-700">{sender}</p>
                            <p className="font-mono text-[10px] text-slate-400">{q.source || 'email_quarantine_vault'}</p>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {subj}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {reason}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-500">
                            <span className="text-emerald-600 font-semibold">&bull; Đã Cô Lập An Toàn</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: EMAIL TRIAGE */}
      {selectedMail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <span className="text-xs font-mono font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Bản Ghi Tiếp Nhận #{selectedMail.id}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">{selectedMail.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedMail(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                <span className="text-slate-400">Người gửi:</span>
                <p className="font-bold text-slate-800">{selectedMail.sender_name || 'Khách Hàng'}</p>
                <p className="font-mono text-slate-500">{selectedMail.sender_email}</p>
              </div>

              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                <span className="text-slate-400">Phòng ban &amp; Mức độ:</span>
                <p className="font-bold text-slate-800">{selectedMail.category}</p>
                <p className="text-rose-600 font-semibold">{selectedMail.priority}</p>
              </div>

              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100 col-span-2">
                <span className="text-slate-400">Cam kết hạn SLA:</span>
                <p className="font-mono font-bold text-emerald-700">
                  {selectedMail.sla_deadline ? new Date(selectedMail.sla_deadline).toLocaleString('vi-VN') : '---'}
                </p>
                <p className="text-slate-500 mt-1">Lý do khẩn cấp: {selectedMail.urgency_reason}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nội dung thư:</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                {selectedMail.body_snippet}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {selectedMail.status === 'PENDING' && (
                <button
                  onClick={() => handleUpdateTriageStatus(selectedMail.id, 'PROCESSED')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs"
                >
                  Duyệt Bản Ghi
                </button>
              )}
              <button
                onClick={() => setSelectedMail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: TICKET */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <span className="text-xs font-mono font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {selectedTicket.ticket_code} &bull; {selectedTicket.priority}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">{selectedTicket.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                <span className="text-slate-400">Khách hàng liên hệ:</span>
                <p className="font-mono font-bold text-slate-800">{selectedTicket.sender_email}</p>
                <p className="text-slate-500">Phòng ban: {selectedTicket.category}</p>
              </div>

              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                <span className="text-slate-400">Kỹ thuật viên &amp; Hòm thư DN:</span>
                <p className="font-bold text-slate-800">{selectedTicket.assigned_to}</p>
                <p className="font-mono text-slate-600 font-semibold">{selectedTicket.agent_email || 'tranngo170770@gmail.com'}</p>
              </div>

              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100 col-span-2">
                <span className="text-slate-400">Thời hạn SLA cam kết:</span>
                <p className="font-mono font-bold text-emerald-700">
                  {selectedTicket.first_response_sla ? new Date(selectedTicket.first_response_sla).toLocaleString('vi-VN') : '---'}
                </p>
                <p className="text-slate-500 mt-1">Trạng thái hiện tại: <strong>{selectedTicket.status}</strong></p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mô tả sự cố:</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                {selectedTicket.description}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {selectedTicket.status === 'OPEN' && (
                <button
                  onClick={() => handleResolveTicket(selectedTicket.ticket_code)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                >
                  Hoàn Thành &amp; Đóng Vé
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Email Simulation Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Cổng Gửi Thư Khách Hàng (Customer Portal)</h3>
                  <p className="text-xs text-slate-400">Khách hàng gửi yêu cầu hỗ trợ đến Doanh nghiệp</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enterprise Mail Routing Badge */}
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-rose-800 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-rose-600" />
                    Hòm thư nhận (Doanh nghiệp):
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-rose-200 text-rose-950 font-bold">
                    tranngo170770@gmail.com
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-slate-500" />
                    Máy chủ SMTP phản hồi:
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800 font-semibold">
                    kieutrangg06123@gmail.com
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendCustomerEmail} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ và tên khách hàng:</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Ví dụ: Lê Thị Kiều Trang"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email người gửi (Khách hàng):</label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="trangltk.24it@vku.udn.vn"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Nhận thư trả lời từ kieutrangg06123@gmail.com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phòng ban tiếp nhận:</label>
                  <select
                    value={custCategory}
                    onChange={(e) => setCustCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs text-slate-800"
                  >
                    <option value="Technical">Technical (Kỹ thuật - tranngo170770@gmail.com)</option>
                    <option value="Sales">Sales (Kinh doanh - tranngo170770@gmail.com)</option>
                    <option value="Finance">Finance (Tài chính - tranngo170770@gmail.com)</option>
                    <option value="General">General (Chung - tranngo170770@gmail.com)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức độ ưu tiên yêu cầu:</label>
                  <select
                    value={custPriority}
                    onChange={(e) => setCustPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs text-slate-800"
                  >
                    <option value="P1 - Critical">P1 - Critical (Sự cố khẩn cấp SLA 1h)</option>
                    <option value="P2 - High">P2 - High (Ưu tiên cao SLA 4h)</option>
                    <option value="P3 - Medium">P3 - Medium (Bình thường SLA 8h)</option>
                    <option value="P4 - Low">P4 - Low (Hỏi thông tin SLA 24h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề email:</label>
                <input
                  type="text"
                  required
                  value={custSubject}
                  onChange={(e) => setCustSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung thư phản ánh:</label>
                <textarea
                  required
                  rows={4}
                  value={custBody}
                  onChange={(e) => setCustBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustEmail}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-200 transition disabled:opacity-60"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmittingCustEmail ? 'animate-pulse' : ''}`} />
                  <span>{isSubmittingCustEmail ? 'Đang gửi...' : 'Gửi Thư Đến Doanh Nghiệp (tranngo170770@gmail.com)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GIẢ LẬP EMAIL ĐỘC HẠI (QUARANTINE VAULT TEST) */}
      {showQuarantineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-rose-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 uppercase flex items-center gap-1 w-fit">
                  <ShieldAlert className="w-3.5 h-3.5" /> Security Threat Simulator
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">Giả Lập Email Độc Hại / Lừa Đảo Vào Kho Cách Ly</h3>
              </div>
              <button
                onClick={() => setShowQuarantineModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fill Threat Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuarantineSender('security@vietcombannk-update.com');
                  setQuarantineSubject('[CẢNH BÁO KHẨN CẤP] Tài khoản ngân hàng số bị khóa, yêu cầu đăng nhập OTP ngay');
                  setQuarantineReason('Phishing Scam - Domain mạo danh ngân hàng & đánh cắp OTP');
                }}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-left text-xs font-bold transition flex flex-col gap-0.5"
              >
                <span>⚡ Mẫu 1: Phishing Ngân Hàng</span>
                <span className="text-[10px] font-normal text-rose-600 font-mono">vietcombannk-update.com</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuarantineSender('phishing_bot@trojan-domain.ru');
                  setQuarantineSubject('Thông báo chi trả tiền thưởng dự án DACS4 HK1.xlsx.exe');
                  setQuarantineReason('Dangerous Malware Attachment - Phát hiện tệp thực thi .exe độc hại');
                }}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-left text-xs font-bold transition flex flex-col gap-0.5"
              >
                <span>⚡ Mẫu 2: Mã Độc Malware</span>
                <span className="text-[10px] font-normal text-rose-600 font-mono">file payload: .xlsx.exe</span>
              </button>
            </div>

            <form onSubmit={handleSendQuarantine} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ người gửi nghi vấn (Sender Email):</label>
                <input
                  type="text"
                  required
                  value={quarantineSender}
                  onChange={(e) => setQuarantineSender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 font-mono text-slate-800"
                  placeholder="security@phishing-domain.com"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề thư độc hại (Subject):</label>
                <input
                  type="text"
                  required
                  value={quarantineSubject}
                  onChange={(e) => setQuarantineSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-slate-800"
                  placeholder="Tiêu đề mạo danh hoặc lừa đảo..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý do phát hiện an ninh (Quarantine Reason):</label>
                <input
                  type="text"
                  required
                  value={quarantineReason}
                  onChange={(e) => setQuarantineReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-rose-700 font-semibold"
                  placeholder="Lý do cách ly..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setShowQuarantineModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuarantine}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 text-xs font-bold shadow-md transition disabled:opacity-60"
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${isSubmittingQuarantine ? 'animate-spin' : ''}`} />
                  <span>{isSubmittingQuarantine ? 'Đang cách ly...' : 'Kích Hoạt Cách Ly An Ninh (Vault)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

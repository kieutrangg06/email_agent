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
  Paperclip,
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
  sla_due_at?: string;
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
  const [custBody, setCustBody] = useState('Kính gửi ban kỹ thuật, hệ thống đăng ký học phần bị nghẽn mạng quá tải cơ sở dữ liệu, đề nghị nâng cấp máy chủ khẩn cấp.');
  const [custAttachment, setCustAttachment] = useState('');
  const [isSubmittingCustEmail, setIsSubmittingCustEmail] = useState(false);

  // Real File Upload State
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
    content: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    if (file.type.includes('text') || file.type.includes('json') || file.type.includes('xml') || file.name.endsWith('.csv') || file.name.endsWith('.xml') || file.name.endsWith('.txt')) {
      reader.onload = () => {
        setSelectedFile({
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content: reader.result as string,
        });
        setCustAttachment(file.name);
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const resStr = (reader.result as string) || '';
        setSelectedFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          content: resStr.slice(0, 50000),
        });
        setCustAttachment(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper format hạn SLA với đếm ngược thông minh
  const formatSlaDeadline = (deadlineStr?: string | null) => {
    if (!deadlineStr) return { label: 'Chưa có hạn', badge: 'bg-slate-100 text-slate-500', isExpired: false, detail: '---' };
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const timeStr = deadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + deadline.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    if (diffMins < 0) {
      const passedHours = (Math.abs(diffMins) / 60).toFixed(1);
      return {
        label: `Quá hạn ${passedHours}h`,
        badge: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
        isExpired: true,
        detail: `Hạn chót: ${timeStr}`,
      };
    } else if (diffMins <= 60) {
      return {
        label: `Còn ${diffMins} phút!`,
        badge: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold animate-pulse',
        isExpired: false,
        detail: `Trước: ${timeStr}`,
      };
    } else {
      const remainHours = Math.round(diffMins / 60);
      return {
        label: `Còn ${remainHours} giờ`,
        badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
        isExpired: false,
        detail: `Trước: ${timeStr}`,
      };
    }
  };

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

  // Khách hàng gửi email thật vào hệ thống (AI Inbound Pipeline)
  const handleSendCustomerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail || !custSubject || !custBody) {
      showToast('Thiếu thông tin', 'Vui lòng điền người gửi, tiêu đề và nội dung thư', 'error');
      return;
    }
    setIsSubmittingCustEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/inbound/process-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: custName,
          sender_email: custEmail,
          subject: custSubject,
          body: custBody,
          attachment_name: selectedFile?.name || custAttachment || '',
          attachment_content: selectedFile?.content || '',
          attachment_size: selectedFile?.size || 0,
        }),
      });
      const data = await res.json();

      if (data.action === 'QUARANTINED') {
        showToast('🛡️ AI Phát Hiện Đe Dọa An Ninh!', `Email đã bị cô lập vào Kho Cách Ly (Vault): ${data.badge}`, 'error');
        setActiveTab('quarantine');
      } else {
        const cat = data.category_detected || 'Technical';
        const pri = data.priority_detected || 'P1 - Critical';
        showToast(
          'Tiếp nhận & Xử lý thành công!',
          `🤖 AI Phân Loại: [${cat}] & Ưu Tiên: [${pri}] ➜ Đã phát email thật đến các hòm thư!`,
          'success'
        );
        if (cat === 'Technical') setActiveTab('tickets');
        else if (cat === 'General') setActiveTab('triage');
      }

      setShowCustomerModal(false);
      await reloadAll();
    } catch {
      showToast('Lỗi gửi thư', 'Không thể kết nối đến Backend', 'error');
    } finally {
      setIsSubmittingCustEmail(false);
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-rose-200 cursor-pointer"
            title="Mở form gửi email từ góc nhìn Khách Hàng / Đối Tác gửi đến Doanh nghiệp (hỗ trợ đính kèm tệp thật)"
          >
            <Send className="w-4 h-4" />
            <span>+ Soạn & Gửi Email Khách Hàng (Inbound Pipeline)</span>
          </button>

          <button
            onClick={reloadAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
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

                        <td className="py-3.5 px-4">
                          {(() => {
                            const sla = formatSlaDeadline(log.sla_deadline);
                            return (
                              <div className="space-y-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${sla.badge}`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{sla.label}</span>
                                </span>
                                <p className="font-mono text-[10px] text-slate-400">{sla.detail}</p>
                              </div>
                            );
                          })()}
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

                        <td className="py-3.5 px-4">
                          {(() => {
                            const sla = formatSlaDeadline(t.sla_due_at || t.first_response_sla);
                            return (
                              <div className="space-y-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${sla.badge}`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{sla.label}</span>
                                </span>
                                <p className="font-mono text-[10px] text-slate-400">{sla.detail}</p>
                              </div>
                            );
                          })()}
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
              onClick={() => {
                setCustName('Hệ Thống An Ninh Giả Mạo');
                setCustEmail('security@vietcombannk-update.com');
                setCustSubject('[CẢNH BÁO KHẨN CẤP] Tài khoản ngân hàng số bị khóa, yêu cầu cài đặt OTP mở khóa');
                setCustBody('Kính gửi khách hàng, tài khoản của bạn bị tạm ngưng. Vui lòng mở file đính kèm otp_security_patch.exe để kích hoạt lại.');
                setSelectedFile({
                  name: 'otp_security_patch.exe',
                  size: 245000,
                  type: 'application/x-msdownload',
                  content: 'MZ9000ExecutableTrojanPayloadSimulated',
                });
                setCustAttachment('otp_security_patch.exe');
                setShowCustomerModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold transition shadow-md shadow-rose-900/50 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Soạn Thư Test Kho Cách Ly (Mã Độc .exe)</span>
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
                          onClick={() => {
                            setCustName('Hệ Thống An Ninh Giả Mạo');
                            setCustEmail('security@vietcombannk-update.com');
                            setCustSubject('[CẢNH BÁO KHẨN CẤP] Tài khoản ngân hàng số bị khóa, yêu cầu cài đặt OTP mở khóa');
                            setCustBody('Kính gửi khách hàng, tài khoản của bạn bị tạm ngưng. Vui lòng mở file đính kèm otp_security_patch.exe để kích hoạt lại.');
                            setSelectedFile({
                              name: 'otp_security_patch.exe',
                              size: 245000,
                              type: 'application/x-msdownload',
                              content: 'MZ9000ExecutableTrojanPayloadSimulated',
                            });
                            setCustAttachment('otp_security_patch.exe');
                            setShowCustomerModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
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
                {(() => {
                  const sla = formatSlaDeadline(selectedMail.sla_deadline);
                  return (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs ${sla.badge}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{sla.label}</span>
                      </span>
                      <span className="font-mono text-xs text-slate-600 font-bold">({sla.detail})</span>
                    </div>
                  );
                })()}
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
                {(() => {
                  const sla = formatSlaDeadline(selectedTicket.sla_due_at || selectedTicket.first_response_sla);
                  return (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs ${sla.badge}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{sla.label}</span>
                      </span>
                      <span className="font-mono text-xs text-slate-600 font-bold">({sla.detail})</span>
                    </div>
                  );
                })()}
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

            {/* Quick Test Scenario Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ⚡ Chọn Nhanh Kịch Bản 4 Phòng Ban &amp; An Ninh Để AI Tự Động Phân Loại:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setCustName('Lê Thị Kiều Trang');
                    setCustEmail('trangltk.24it@vku.udn.vn');
                    setCustSubject('[SỰ CỐ KHẨN CẤP] Cổng đăng ký học phần DACS4 VKU bị lỗi 504 Gateway Timeout');
                    setCustBody('Kính gửi ban kỹ thuật, toàn bộ sinh viên không thể truy cập đăng ký môn học, máy chủ báo lỗi 504 Gateway Timeout và sập cơ sở dữ liệu. Đề nghị can thiệp ngay lập tức!');
                    setSelectedFile(null);
                    setCustAttachment('');
                  }}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold text-left transition flex flex-col gap-0.5"
                >
                  <span>🔴 1. Kỹ Thuật (P1 Khẩn Cấp)</span>
                  <span className="text-[10px] font-normal text-rose-600">Sập cổng 504 ➔ Cấp vé &amp; Giao KTV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustName('Trần Văn Giám Đốc');
                    setCustEmail('trangltk.24it@vku.udn.vn');
                    setCustSubject('[HỎI GIÁ & DEMO] Yêu cầu tư vấn triển khai gói Email Automation Enterprise');
                    setCustBody('Kính gửi phòng kinh doanh, tôi là Trần Văn Giám Đốc từ Tập đoàn Công nghệ ABC (SĐT: +84 905 123 456). Chúng tôi cần báo giá gói phần mềm ngân sách 250 triệu VNĐ triển khai trong tháng tới.');
                    setSelectedFile(null);
                    setCustAttachment('');
                  }}
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-left transition flex flex-col gap-0.5"
                >
                  <span>🟡 2. Bán Hàng (Sales Lead VIP)</span>
                  <span className="text-[10px] font-normal text-amber-600">Deal 250tr ➔ Lead Score 95</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustName('Công ty CP Phần Mềm VKU');
                    setCustEmail('trangltk.24it@vku.udn.vn');
                    setCustSubject('[GỬI HÓA ĐƠN VAT] Quyết toán chi phí phần mềm HD-2026-001');
                    setCustBody('Kính gửi bộ phận kế toán, Công ty CP Phần Mềm VKU gửi hóa đơn số HD-2026-001: Tiền hàng 10.000.000 đ, thuế VAT 1.000.000 đ, tổng thanh toán là 11.000.000 đ. Đính kèm bản PDF hóa đơn để đối soát.');
                    setSelectedFile({
                      name: 'hoa_don_vat_001.pdf',
                      size: 145200,
                      type: 'application/pdf',
                      content: 'Invoice No: HD-2026-001 | Seller: Cong ty CP Phan Mem VKU | Subtotal: 10000000 | VAT: 1000000 | Total: 11000000',
                    });
                    setCustAttachment('hoa_don_vat_001.pdf');
                  }}
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-left transition flex flex-col gap-0.5"
                >
                  <span>🟢 3. Hóa Đơn Hợp Lệ</span>
                  <span className="text-[10px] font-normal text-emerald-600">10tr + 1tr = 11tr ➔ VALIDATED</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustName('Nhà Cung Cấp ABC');
                    setCustEmail('trangltk.24it@vku.udn.vn');
                    setCustSubject('[GỬI HÓA ĐƠN VAT] Thanh toán dịch vụ bảo trì HD-DISC-002');
                    setCustBody('Kính gửi kế toán, gửi hóa đơn HD-DISC-002: Tiền hàng 10.000.000 đ, thuế VAT 1.000.000 đ, tổng thanh toán yêu cầu là 15.000.000 đ (bị sai lệch 4 triệu).');
                    setSelectedFile({
                      name: 'hoa_don_sai_lech_tien.pdf',
                      size: 152000,
                      type: 'application/pdf',
                      content: 'Invoice No: HD-DISC-002 | Subtotal: 10000000 | VAT: 1000000 | Total: 15000000 | Mismatch: 4000000',
                    });
                    setCustAttachment('hoa_don_sai_lech_tien.pdf');
                  }}
                  className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-left transition flex flex-col gap-0.5"
                >
                  <span>⚠️ 4. Hóa Đơn Lệch Tiền</span>
                  <span className="text-[10px] font-normal text-purple-600">Lệch 4tr ➔ Cảnh báo gian lận KTT</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustName('Hệ Thống An Ninh Giả Mạo');
                    setCustEmail('security@vietcombannk-update.com');
                    setCustSubject('[CẢNH BÁO KHẨN CẤP] Tài khoản ngân hàng số bị khóa, yêu cầu cài đặt OTP mở khóa');
                    setCustBody('Kính gửi khách hàng, tài khoản của bạn bị tạm ngưng. Vui lòng mở file đính kèm otp_security_patch.exe để kích hoạt lại.');
                    setSelectedFile({
                      name: 'otp_security_patch.exe',
                      size: 245000,
                      type: 'application/x-msdownload',
                      content: 'MZ9000ExecutableTrojanPayloadSimulated',
                    });
                    setCustAttachment('otp_security_patch.exe');
                  }}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 font-bold text-left transition flex flex-col gap-0.5"
                >
                  <span>🛡️ 5. Lừa Đảo &amp; Mã Độc</span>
                  <span className="text-[10px] font-normal text-red-600">Phishing + Tệp .exe ➔ Kho An Ninh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustName('Đặng Văn Hoàng');
                    setCustEmail('trangltk.24it@vku.udn.vn');
                    setCustSubject('[TƯ VẤN] Hướng dẫn cấp lại tài khoản email và tra cứu cam kết SLA dịch vụ');
                    setCustBody('Kính gửi phòng Hỗ trợ, tôi muốn hỏi thủ tục cấp lại tài khoản email doanh nghiệp và xin thông tin về các mức cam kết thời gian phản hồi SLA của trung tâm.');
                    setSelectedFile(null);
                    setCustAttachment('');
                  }}
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-left transition flex flex-col gap-0.5"
                >
                  <span>🔵 6. Hỗ Trợ Chung (General)</span>
                  <span className="text-[10px] font-normal text-blue-600">Thủ tục &amp; SLA ➔ Nhánh General</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSendCustomerEmail} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ và tên người gửi:</label>
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
                  <label className="font-bold text-slate-700 block mb-1">Email người gửi (Customer):</label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="trangltk.24it@vku.udn.vn"
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hòm thư tiếp nhận Doanh nghiệp (To):</label>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-slate-800 font-mono text-xs flex items-center justify-between">
                  <span>tranngo170770@gmail.com</span>
                  <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-bold">Inbound AI Gateway</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề email (Subject):</label>
                <input
                  type="text"
                  required
                  value={custSubject}
                  onChange={(e) => setCustSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs font-semibold text-slate-800"
                />
              </div>

              {/* TỆP ĐÍNH KÈM THẬT - MỞ THƯ MỤC CHỌN TỆP */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tệp đính kèm (Mở thư mục máy tính để chọn tệp thật - AI OCR sẽ bóc tách):
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.xml,.json,.docx,.xlsx,.exe,.bat"
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 rounded-xl border border-rose-200 bg-rose-50/20">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Paperclip className="w-4 h-4 text-rose-600" />
                    <span>📁 Mở Thư Mục Chọn Tệp Máy Tính...</span>
                  </button>

                  {selectedFile ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                      <span className="text-[10px] text-emerald-600">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setCustAttachment('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 ml-1 cursor-pointer"
                        title="Xóa tệp"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : custAttachment ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{custAttachment}</span>
                      <button
                        type="button"
                        onClick={() => setCustAttachment('')}
                        className="text-slate-400 hover:text-rose-600 p-0.5 ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Chưa chọn tệp (Hỗ trợ PDF hóa đơn, XML, TXT, mã độc .exe...)</span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung thư phản ánh (Email Body):</label>
                <textarea
                  required
                  rows={4}
                  value={custBody}
                  onChange={(e) => setCustBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 text-xs text-slate-800 leading-relaxed font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustEmail}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-200 transition disabled:opacity-60 cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmittingCustEmail ? 'animate-pulse' : ''}`} />
                  <span>{isSubmittingCustEmail ? 'AI Đang Bóc Tách & Gửi Mail Thật...' : 'Gửi Thư Đến Doanh Nghiệp (tranngo170770@gmail.com)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

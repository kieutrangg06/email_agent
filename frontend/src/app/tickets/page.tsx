'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  source: string;
  event_type: string;
  payload: {
    sender_email?: string;
    sender_name?: string;
    subject?: string;
    body?: string;
    received_at?: string;
  };
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
        fetch(`http://localhost:4000/api/v1/triage/logs?${q.toString()}`).catch(() => null),
        fetch('http://localhost:4000/api/v1/triage/stats').catch(() => null),
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
        fetch(`http://localhost:4000/api/v1/tickets?${q.toString()}`).catch(() => null),
        fetch('http://localhost:4000/api/v1/tickets/stats/sla').catch(() => null),
      ]);
      if (res && res.ok) setTickets(await res.json());
      if (slaRes && slaRes.ok) setSlaStats(await slaRes.json());
    } catch (e) {
      console.warn('Error fetching tickets data:', e);
    }
  };

  const loadAgentsData = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/v1/tickets/agents').catch(() => null);
      if (res && res.ok) setAgents(await res.json());
    } catch (e) {
      console.warn('Error fetching agents:', e);
    }
  };

  const loadQuarantineData = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/v1/triage/quarantine').catch(() => null);
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
      const res = await fetch(`http://localhost:4000/api/v1/triage/logs/${id}/status`, {
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
      const res = await fetch(`http://localhost:4000/api/v1/tickets/${code}/resolve`, {
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
            Quản Lý Tiếp Nhận Email &amp; Vé Hỗ Trợ
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Theo dõi tiếp nhận email, phân loại tự động và quản lý tiến độ xử lý vé hỗ trợ SLA.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
                        Kho lưu trữ cách ly an ninh hiện không có bản ghi thư rác nào.
                      </td>
                    </tr>
                  ) : (
                    quarantineLogs.map((q) => (
                      <tr key={q.id} className="hover:bg-rose-50/20">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(q.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-rose-700">{q.payload.sender_name || 'Người gửi không xác định'}</p>
                          <p className="font-mono text-[11px] text-slate-400">{q.payload.sender_email || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {q.payload.subject || 'Không có tiêu đề'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {q.event_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-500">
                          <span className="text-emerald-600 font-semibold">&bull; Đã Cách Ly</span>
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
                <span className="text-slate-400">Kỹ thuật viên phụ trách:</span>
                <p className="font-bold text-slate-800">{selectedTicket.assigned_to}</p>
                <p className="font-mono text-slate-400">{selectedTicket.agent_email || 'support@enterprise.com'}</p>
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
    </div>
  );
}

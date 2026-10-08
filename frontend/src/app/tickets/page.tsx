'use client';

import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  LifeBuoy,
  PlusCircle,
  ShieldAlert,
  Send,
  UserCheck,
  Building,
  Sparkles,
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

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<'triage' | 'tickets'>('triage');

  // Luồng 1: Triage State
  const [triageLogs, setTriageLogs] = useState<TriageLog[]>([]);
  const [triageStats, setTriageStats] = useState({
    total: 0,
    p1Count: 0,
    techCount: 0,
    pendingCount: 0,
    openTicketsCount: 0,
  });
  const [triageSearch, setTriageSearch] = useState('');
  const [triageCategory, setTriageCategory] = useState('All');
  const [triagePriority, setTriagePriority] = useState('All');
  const [selectedMail, setSelectedMail] = useState<TriageLog | null>(null);

  // Luồng 2: Tickets State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatus, setTicketStatus] = useState('All');
  const [ticketPriority, setTicketPriority] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Modal Create Ticket
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    sender_email: '',
    description: '',
    category: 'Technical',
    priority: 'P1 - Critical',
    assigned_to: 'Nguyễn Văn An',
    agent_email: 'tranglee12306@gmail.com',
  });

  const [loading, setLoading] = useState(true);

  // Load Data
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

      const res = await fetch(`http://localhost:4000/api/v1/tickets?${q.toString()}`).catch(() => null);
      if (res && res.ok) setTickets(await res.json());
    } catch (e) {
      console.warn('Error fetching tickets data:', e);
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    await Promise.all([loadTriageData(), loadTicketData()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
    const interval = setInterval(() => {
      loadTriageData();
      loadTicketData();
    }, 4000);
    return () => clearInterval(interval);
  }, [triageCategory, triagePriority, ticketStatus, ticketPriority]);

  // Handle Updates
  const updateTriageStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/triage/logs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadTriageData();
        if (selectedMail && selectedMail.id === id) {
          setSelectedMail({ ...selectedMail, status });
        }
      }
    } catch (e) {
      console.warn('Error updating triage status:', e);
    }
  };

  const handleResolveTicket = async (code: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tickets/${code}/resolve`, {
        method: 'PATCH',
      });
      if (res.ok) {
        await loadTicketData();
        if (selectedTicket && selectedTicket.ticket_code === code) {
          setSelectedTicket({ ...selectedTicket, status: 'RESOLVED' });
        }
      }
    } catch (e) {
      console.warn('Error resolving ticket:', e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/v1/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setNewTicket({
          title: '',
          sender_email: '',
          description: '',
          category: 'Technical',
          priority: 'P1 - Critical',
          assigned_to: 'Nguyễn Văn An',
          agent_email: 'tranglee12306@gmail.com',
        });
        await loadTicketData();
      }
    } catch (e) {
      console.warn('Error creating ticket:', e);
    }
  };

  // Filtered lists
  const filteredTriage = triageLogs.filter(
    (l) =>
      l.subject.toLowerCase().includes(triageSearch.toLowerCase()) ||
      l.sender_email.toLowerCase().includes(triageSearch.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.ticket_code.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.sender_email.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.assigned_to.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Member 1: AI Email Triage &amp; Helpdesk SLA Dispatcher
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Luồng 1 (Phân loại &amp; Định tuyến AI - 21 nodes) &bull; Luồng 2 (Khởi tạo Ticket &amp; Theo dõi SLA - 20 nodes)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('triage')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'triage'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Luồng 1: AI Triage Logs ({triageLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'tickets'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Luồng 2: Tickets &amp; SLA ({tickets.length})
            </button>
          </div>

          <button
            onClick={reloadAll}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tổng Thư Inbound
          </span>
          <div className="text-2xl font-extrabold mt-1 text-white">{triageStats.total}</div>
        </div>
        <div className="bg-slate-900/90 border border-rose-900/40 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Sự Cố Khẩn P1
          </span>
          <div className="text-2xl font-extrabold mt-1 text-rose-500">{triageStats.p1Count}</div>
        </div>
        <div className="bg-slate-900/90 border border-amber-900/40 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Kỹ Thuật (Tech)
          </span>
          <div className="text-2xl font-extrabold mt-1 text-amber-400">{triageStats.techCount}</div>
        </div>
        <div className="bg-slate-900/90 border border-blue-900/40 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Chờ Điều Phối
          </span>
          <div className="text-2xl font-extrabold mt-1 text-blue-400">{triageStats.pendingCount}</div>
        </div>
        <div className="bg-slate-900/90 border border-emerald-900/40 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <LifeBuoy className="w-3.5 h-3.5" /> Tickets Đang Mở
          </span>
          <div className="text-2xl font-extrabold mt-1 text-emerald-400">
            {tickets.filter((t) => t.status === 'OPEN').length}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: LUỒNG 1 - AI TRIAGE LOGS */}
      {/* ============================================================ */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={triageSearch}
                onChange={(e) => setTriageSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, người gửi..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={triageCategory}
                onChange={(e) => setTriageCategory(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="All">Tất cả Phòng Ban</option>
                <option value="Technical">Technical</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="General">General</option>
              </select>

              <select
                value={triagePriority}
                onChange={(e) => setTriagePriority(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="All">Tất cả Mức Ưu Tiên</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Người Gửi &amp; Tiêu Đề</th>
                    <th className="py-3 px-4">Phòng Ban (Route)</th>
                    <th className="py-3 px-4">Mức Ưu Tiên</th>
                    <th className="py-3 px-4">Lý Do AI Phân Loại</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredTriage.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        Chưa có bản ghi thư phân luồng nào.
                      </td>
                    </tr>
                  ) : (
                    filteredTriage.map((log) => {
                      const isP1 = log.priority.includes('P1');
                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-800/40 transition cursor-pointer"
                          onClick={() => setSelectedMail(log)}
                        >
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">#{log.id}</td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-white truncate">{log.subject}</div>
                            <div className="text-xs text-slate-400 truncate">{log.sender_email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <Building className="w-3 h-3" /> {log.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                isP1
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : log.priority.includes('P2')
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {log.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate">
                            {log.urgency_reason || 'Tự động phân loại qua AI'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.status === 'PROCESSED'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : log.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            {log.status !== 'PROCESSED' && (
                              <button
                                onClick={() => updateTriageStatus(log.id, 'PROCESSED')}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs transition"
                              >
                                Đã Duyệt
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedMail(log)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                            >
                              Chi tiết
                            </button>
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

      {/* ============================================================ */}
      {/* TAB 2: LUỒNG 2 - HELPDESK TICKETS & SLA */}
      {/* ============================================================ */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Tìm mã ticket, tiêu đề, kỹ thuật viên..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">Tất cả Trạng Thái</option>
                <option value="OPEN">OPEN (Đang mở)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Đang xử lý)</option>
                <option value="RESOLVED">RESOLVED (Đã giải quyết)</option>
              </select>

              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">Tất cả Mức Ưu Tiên</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm flex items-center gap-1.5 transition shadow"
              >
                <PlusCircle className="w-4 h-4" /> Tạo Vé Mới
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Mã Vé (Code)</th>
                    <th className="py-3 px-4">Tiêu Đề &amp; Người Gửi</th>
                    <th className="py-3 px-4">Phòng Ban</th>
                    <th className="py-3 px-4">Mức Ưu Tiên</th>
                    <th className="py-3 px-4">Phụ Trách (Agent)</th>
                    <th className="py-3 px-4">Hạn SLA</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        Chưa có vé hỗ trợ kỹ thuật nào.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => {
                      const isP1 = t.priority.includes('P1');
                      const isResolved = t.status === 'RESOLVED';
                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-800/40 transition cursor-pointer"
                          onClick={() => setSelectedTicket(t)}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-xs text-blue-400">
                            {t.ticket_code}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-white truncate">{t.title}</div>
                            <div className="text-xs text-slate-400 truncate">{t.sender_email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-slate-300 font-medium">{t.category}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                isP1
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                                  : t.priority.includes('P2')
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-medium text-white flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              {t.assigned_to}
                            </div>
                            <div className="text-[11px] text-slate-500">{t.agent_email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {t.first_response_sla
                                ? new Date(t.first_response_sla).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Chưa đặt'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isResolved
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : t.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            {!isResolved && (
                              <button
                                onClick={() => handleResolveTicket(t.ticket_code)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs transition"
                              >
                                Đóng Vé
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                            >
                              Xem
                            </button>
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

      {/* MODAL: CHI TIẾT THƯ TRIAGE */}
      {selectedMail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-blue-400">ID #{selectedMail.id} &bull; Triage Inbound</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedMail.subject}</h3>
                <p className="text-xs text-slate-400">Từ: {selectedMail.sender_email}</p>
              </div>
              <button
                onClick={() => setSelectedMail(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Phòng Ban Điều Phối:</span>
                <div className="font-semibold text-blue-400 mt-1">{selectedMail.category}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Độ Khẩn Cấp (Priority):</span>
                <div className="font-semibold text-rose-400 mt-1">{selectedMail.priority}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Cảm Xúc Người Gửi:</span>
                <div className="font-semibold text-amber-400 mt-1">{selectedMail.sentiment}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Hạn Cam Kết SLA:</span>
                <div className="font-semibold text-emerald-400 mt-1">
                  {new Date(selectedMail.sla_deadline).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Lý do AI phân loại (AI Urgency Reason):
              </span>
              <p className="text-sm text-slate-200">{selectedMail.urgency_reason}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Trích dẫn nội dung thư (Body Snippet):
              </span>
              <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{selectedMail.body_snippet}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              {selectedMail.status !== 'PROCESSED' && (
                <button
                  onClick={() => updateTriageStatus(selectedMail.id, 'PROCESSED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  Xác Nhận Đã Điều Phối
                </button>
              )}
              <button
                onClick={() => setSelectedMail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHI TIẾT TICKET */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-emerald-400">
                  {selectedTicket.ticket_code} &bull; Helpdesk Ticket
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedTicket.title}</h3>
                <p className="text-xs text-slate-400">Khách hàng: {selectedTicket.sender_email}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Phòng Ban:</span>
                <div className="font-semibold text-blue-400 mt-1">{selectedTicket.category}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Mức Độ Ưu Tiên:</span>
                <div className="font-semibold text-rose-400 mt-1">{selectedTicket.priority}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Kỹ Thuật Viên Tiếp Nhận:</span>
                <div className="font-semibold text-emerald-400 mt-1">
                  {selectedTicket.assigned_to} ({selectedTicket.agent_email})
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500">Cam Kết Phản Hồi Đầu (SLA):</span>
                <div className="font-semibold text-amber-400 mt-1">
                  {new Date(selectedTicket.first_response_sla).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            {selectedTicket.summary && (
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  AI Issue Summary (Tóm tắt sự cố):
                </span>
                <p className="text-sm text-slate-200">{selectedTicket.summary}</p>
              </div>
            )}

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Mô tả chi tiết:
              </span>
              <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              {selectedTicket.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleResolveTicket(selectedTicket.ticket_code)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  Xác Nhận Giải Quyết (Resolve)
                </button>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO TICKET MỚI */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateTicket}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" /> Tạo Vé Hỗ Trợ Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Tiêu đề sự cố / yêu cầu:</label>
              <input
                required
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="VD: Không thể gửi email xác nhận cho đơn hàng"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Email khách hàng:</label>
              <input
                required
                type="email"
                value={newTicket.sender_email}
                onChange={(e) => setNewTicket({ ...newTicket, sender_email: e.target.value })}
                placeholder="client@enterprise.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Phòng ban:</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Mức ưu tiên:</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="P1 - Critical">P1 - Critical</option>
                  <option value="P2 - High">P2 - High</option>
                  <option value="P3 - Medium">P3 - Medium</option>
                  <option value="P4 - Low">P4 - Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Mô tả sự cố:</label>
              <textarea
                required
                rows={3}
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Chi tiết lỗi gặp phải..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Tạo Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

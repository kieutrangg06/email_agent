'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  CheckCircle2,
  BarChart3,
  Users,
  FileText,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  ChevronRight,
  TrendingUp,
  Inbox,
  Send,
  Zap,
} from 'lucide-react';

interface DashboardStats {
  totalEmails: number;
  activeTickets: number;
  slaCompliance: number;
  crmLeads: number;
}

import { API_BASE_URL } from '../lib/api';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmails: 0,
    activeTickets: 0,
    slaCompliance: 100,
    crmLeads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [analyticsRes, slaRes, crmRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/v1/analytics/stats`),
        fetch(`${API_BASE_URL}/api/v1/tickets/stats/sla`),
        fetch(`${API_BASE_URL}/api/v1/crm/customers`),
      ]);

      let emailCount = 0;
      let activeCount = 0;
      let compliance = 100;
      let crmCount = 0;

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json();
        if (data.inbound?.total_emails_today !== undefined) {
          emailCount = Number(data.inbound.total_emails_today);
        }
        if (data.tickets?.sla_compliance_rate !== undefined) {
          compliance = Number(data.tickets.sla_compliance_rate);
        }
      }

      if (slaRes.status === 'fulfilled' && slaRes.value.ok) {
        const slaData = await slaRes.value.json();
        const onTrack = Number(slaData.on_track || 0);
        const breached = Number(slaData.breached || 0);
        const resolved = Number(slaData.resolved || 0);
        const total = Number(slaData.total || 0);
        
        if (onTrack + breached > 0 || total > 0) {
          activeCount = onTrack + breached;
        }
        if (total > 0) {
          compliance = Number(((total - breached) / total * 100).toFixed(1));
        }
      }

      if (crmRes.status === 'fulfilled' && crmRes.value.ok) {
        const crmData = await crmRes.value.json();
        if (Array.isArray(crmData)) {
          crmCount = crmData.length;
        }
      }

      setStats({
        totalEmails: emailCount,
        activeTickets: activeCount,
        slaCompliance: compliance,
        crmLeads: crmCount,
      });
      setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
    } catch {
      // Keep sensible defaults
      setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const navigationCards = [
    {
      title: 'Hộp Thư & Điều Phối Vé',
      subtitle: 'Quản lý tiếp nhận & Cam kết SLA',
      description:
        'Tiếp nhận email tự động, phân loại phòng ban bằng AI, lọc thư rác và phát hành vé hỗ trợ cam kết SLA cho chuyên viên.',
      href: '/tickets',
      icon: Mail,
      badge: 'Helpdesk & SLA',
      accentColor: 'rose',
      borderClass: 'border-rose-200/80 hover:border-rose-400',
      iconBg: 'bg-rose-50 text-rose-600',
      tagBg: 'bg-rose-50 text-rose-700 border-rose-200',
      hoverShadow: 'hover:shadow-rose-100/60',
    },
    {
      title: 'Duyệt Bản Thảo Phản Hồi',
      subtitle: 'Trợ lý AI & Kiểm duyệt trước khi gửi',
      description:
        'Truy vấn tài liệu cơ sở tri thức nội bộ (RAG), soạn thảo câu trả lời và quy trình kiểm duyệt chuyên nghiệp trước khi gửi thư.',
      href: '/approval',
      icon: CheckCircle2,
      badge: 'Knowledge RAG & Review',
      accentColor: 'indigo',
      borderClass: 'border-indigo-200/80 hover:border-indigo-400',
      iconBg: 'bg-indigo-50 text-indigo-600',
      tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      hoverShadow: 'hover:shadow-indigo-100/60',
    },
    {
      title: 'Báo Cáo & Phân Tích Điều Hành',
      subtitle: 'Tổng hợp chỉ số vận hành thời gian thực',
      description:
        'Tổng hợp chỉ số vận hành 24h, biểu đồ trực quan hóa dữ liệu theo thời gian thực và tự động phát hiện đột biến sự cố.',
      href: '/analytics',
      icon: BarChart3,
      badge: 'Executive Intelligence',
      accentColor: 'emerald',
      borderClass: 'border-emerald-200/80 hover:border-emerald-400',
      iconBg: 'bg-emerald-50 text-emerald-600',
      tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      hoverShadow: 'hover:shadow-emerald-100/60',
    },
    {
      title: 'Quản Lý Khách Hàng CRM',
      subtitle: 'Đường ống bán hàng & Nuôi dưỡng Lead',
      description:
        'Chấm điểm tiềm năng Lead (AI Lead Scoring), quản lý cơ hội kinh doanh trên phễu và tự động gửi chuỗi email nuôi dưỡng.',
      href: '/crm',
      icon: Users,
      badge: 'CRM & Pipeline',
      accentColor: 'amber',
      borderClass: 'border-amber-200/80 hover:border-amber-400',
      iconBg: 'bg-amber-50 text-amber-600',
      tagBg: 'bg-amber-50 text-amber-700 border-amber-200',
      hoverShadow: 'hover:shadow-amber-100/60',
    },
    {
      title: 'Hóa Đơn & Nhận Diện Chứng Từ',
      subtitle: 'Bóc tách dữ liệu & Đối soát số học',
      description:
        'Trích xuất tự động thông tin hóa đơn đa thể thức bằng AI Multimodal OCR, đối soát thuế, tổng tiền và phê duyệt chi tự động.',
      href: '/invoices',
      icon: FileText,
      badge: 'Invoice OCR & Audit',
      accentColor: 'purple',
      borderClass: 'border-purple-200/80 hover:border-purple-400',
      iconBg: 'bg-purple-50 text-purple-600',
      tagBg: 'bg-purple-50 text-purple-700 border-purple-200',
      hoverShadow: 'hover:shadow-purple-100/60',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / System Status */}
      <div className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-rose-150 shadow-sm shadow-rose-100/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Tất cả dịch vụ đang hoạt động ổn định (All Services Operational)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-2">
              Intelligent Enterprise Email Automation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Hệ thống tự động hóa xử lý email doanh nghiệp thông minh, theo dõi cam kết SLA tức thời và tích hợp đa phân hệ điều hành (Helpdesk, RAG Approvals, CRM Pipeline &amp; Finance OCR).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchStats}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs"
              title="Làm mới số liệu"
            >
              <RefreshCw className={`w-4 h-4 text-rose-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập Nhật Số Liệu</span>
            </button>
          </div>
        </div>

        {/* System Architecture Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
          <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-rose-500" />
            Công Nghệ AI Thế Hệ Mới
          </span>
          <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Tự Động Hóa Xử Lý Email
          </span>
          <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Cơ Sở Tri Thức &amp; Vector Search
          </span>
          {lastRefreshed && (
            <span className="text-slate-400 ml-auto hidden sm:inline">
              Cập nhật lần cuối: {lastRefreshed}
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats: 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total emails */}
        <div className="bg-white p-5 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-4 transition hover:shadow-md hover:shadow-rose-100/50">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Tổng Email Đã Xử Lý</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-0.5">
              {stats.totalEmails}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Phân loại tự động 100%</span>
            </p>
          </div>
        </div>

        {/* Card 2: Active tickets */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-150 shadow-xs flex items-center gap-4 transition hover:shadow-md hover:shadow-indigo-100/50">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Vé Hỗ Trợ Đang Xử Lý</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700 tracking-tight mt-0.5">
              {stats.activeTickets}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Đang trong khung giờ SLA
            </p>
          </div>
        </div>

        {/* Card 3: SLA compliance */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-150 shadow-xs flex items-center gap-4 transition hover:shadow-md hover:shadow-emerald-100/50">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Tỷ Lệ Đạt Chuẩn SLA</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight mt-0.5">
              {stats.slaCompliance.toFixed(1)}%
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Mục tiêu cam kết &ge; 95%
            </p>
          </div>
        </div>

        {/* Card 4: CRM leads */}
        <div className="bg-white p-5 rounded-2xl border border-amber-150 shadow-xs flex items-center gap-4 transition hover:shadow-md hover:shadow-amber-100/50">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Khách Hàng &amp; Lead CRM</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight mt-0.5">
              {stats.crmLeads}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Chấm điểm AI tự động
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards: 5 Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Truy Cập Nhanh Các Phân Hệ Chức Năng</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống được tổ chức thành 5 cổng chuyên trách phục vụ quy trình làm việc toàn diện.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`bg-white p-6 rounded-3xl border ${card.borderClass} shadow-sm ${card.hoverShadow} transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1 cursor-pointer`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${card.tagBg}`}>
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 group-hover:text-rose-600 transition flex items-center justify-between">
                      <span>{card.title}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-rose-500" />
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {card.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-slate-800">
                  <span>Mở phân hệ làm việc</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition" />
                </div>
              </Link>
            );
          })}

          {/* Quick Demo & Help Card */}
          <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-6 rounded-3xl text-white shadow-md shadow-rose-200 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-white shadow-inner">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-extrabold text-white">Chế Độ Trực Quan &amp; Báo Cáo</h3>
              <p className="text-xs text-rose-100 leading-relaxed">
                Xem toàn cảnh biểu đồ phân bổ trạng thái vé hỗ trợ và lưu lượng email 7 ngày qua tại trung tâm phân tích điều hành.
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-between">
              <Link
                href="/analytics"
                className="px-4 py-2 bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
              >
                <span>Xem Báo Cáo SVG</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/login"
                className="text-xs font-medium text-white/90 hover:text-white underline underline-offset-2"
              >
                Trang Đăng Nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

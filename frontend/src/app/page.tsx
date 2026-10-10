import Link from 'next/link';
import { ShieldCheck, BrainCircuit, Ticket, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

export default function HomePage() {
  const workflows = [
    {
      step: '01',
      title: 'Luồng 1: Email Ingest & Anti-Spam Gate',
      desc: 'Cửa ngõ tiếp nhận mail, lọc spam, loại trừ mail tự sinh, kiểm tra blacklist và cách ly thư độc hại.',
      badge: 'Chuẩn 12 Nodes',
      agent: 'AI Deliverability Monitor (#8)',
      icon: ShieldCheck,
      color: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-950/20',
      tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    {
      step: '02',
      title: 'Luồng 2: AI Multi-Department Triage',
      desc: 'AI phân loại phòng ban (Tech, Sales, Finance, General), gán nhãn P1–P4, gửi email xác nhận kèm cam kết SLA.',
      badge: 'Chuẩn 12 Nodes',
      agent: 'AI Email Triage Agent (#1)',
      icon: BrainCircuit,
      color: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/20',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      step: '03',
      title: 'Luồng 3: Ticket Generation & SLA Dispatcher',
      desc: 'Chuyển đổi yêu cầu kỹ thuật thành vé hỗ trợ chuẩn, thuật toán cân bằng tải gán KTV ít việc nhất, kích hoạt SLA.',
      badge: 'Chuẩn 12 Nodes',
      agent: 'AI Email-to-Ticket Agent (#3)',
      icon: Ticket,
      color: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-950/20',
      tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
  ];

  return (
    <div className="space-y-10 py-4">
      {/* Hero Section */}
      <div className="border-b border-slate-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-4">
          <Zap className="w-3.5 h-3.5" /> Kiến trúc Chuẩn Hóa: 3 Luồng &times; 12 Nodes
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Dự Án Độc Lập - Thành Viên 1
        </h1>
        <p className="mt-2 text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
          Hệ thống lõi đảm nhiệm: <strong>Cửa ngõ tiếp nhận Ingest</strong>, <strong>Lọc thư rác &amp; Cách ly bảo vệ</strong>, <strong>Phân loại đa phòng ban bằng AI</strong>, và <strong>Cấp phát Ticket cân bằng tải kèm cam kết SLA</strong>.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20"
          >
            Mở Dashboard Quản Lý <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="http://localhost:5678"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium transition"
          >
            Mở n8n Workflows Console
          </a>
        </div>
      </div>

      {/* 3 Workflows Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Quy Trình 3 Luồng Tinh Gọn Của Thành Viên 1</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflows.map((wf) => {
            const Icon = wf.icon;
            return (
              <div
                key={wf.step}
                className={`p-6 rounded-xl border transition-all duration-200 flex flex-col justify-between ${wf.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${wf.tagColor}`}>
                      {wf.badge}
                    </span>
                    <span className="text-slate-500 font-mono text-sm font-bold">#{wf.step}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-white">{wf.title}</h3>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">{wf.desc}</p>
                </div>
                <div className="pt-4 border-t border-slate-800/60 text-xs font-mono text-slate-400">
                  Phụ trách: <span className="text-slate-200">{wf.agent}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Matrix */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40">
        <h3 className="text-base font-semibold text-white mb-3">
          Thông Số Kỹ Thuật Đồ Án Member 1:
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Mỗi luồng thiết kế chính xác <strong>12 nodes</strong>, không thừa không thiếu.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL 16: Quản lý <code>email_triage_logs</code>, <code>support_agents</code>, <code>tickets</code>.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>NestJS Core API: Cung cấp đầy đủ REST endpoints phân loại &amp; quản trị vé.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Next.js 14 App Router: Tự động cập nhật trạng thái thời gian thực mỗi 4 giây.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

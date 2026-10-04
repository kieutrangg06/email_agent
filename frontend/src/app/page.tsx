import Link from 'next/link';

export default function HomePage() {
  const systemCards = [
    {
      title: 'Member 1: Triage & Tickets',
      desc: 'Luồng 1 & 2: Phân loại email, gán SLA P1-P4, tự động sinh mã Ticket và điều phối kỹ thuật viên.',
      href: '/tickets',
      badge: '21 + 20 Nodes',
      color: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/20',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Member 2: Reply & Knowledge (HITL)',
      desc: 'Luồng 3 & 4: Tra cứu RAG nội bộ, soạn thư nháp, nút bấm duyệt gửi thư (Human-in-the-loop) & Báo cáo ngày.',
      href: '/approvals',
      badge: '22 + 20 Nodes',
      color: 'border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-950/20',
      tagColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    },
    {
      title: 'Member 3: CRM Leads & Invoices OCR',
      desc: 'Luồng 5 & 6: Bóc tách thực thể bán hàng (Lead Scoring 0-100) và OCR hóa đơn kế toán, kiểm tra toàn vẹn VAT.',
      href: '/crm',
      badge: '21 + 21 Nodes',
      color: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/20',
      tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Enterprise Email Automation & Helpdesk CRM
        </h1>
        <p className="mt-2 text-slate-400 text-sm max-w-3xl">
          Hệ thống tích hợp Monorepo gồm n8n (≥ 20 nodes/luồng), 10 AI Agents, NestJS Core API (cổng 4000), Next.js App Router (cổng 3000) và PostgreSQL 16.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {systemCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`p-6 rounded-xl border transition-all duration-200 block ${card.color}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${card.tagColor}`}>
                {card.badge}
              </span>
              <span className="text-slate-400 text-xs">Truy cập &rarr;</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
        <h2 className="text-lg font-semibold text-white mb-3">Kiến trúc Cổng dịch vụ & Trạng thái kết nối</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm font-mono">
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-slate-400 text-xs">PostgreSQL 16</div>
            <div className="text-emerald-400 font-semibold mt-1">Port 5432</div>
            <div className="text-slate-500 text-xs mt-1">enterprise_db</div>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-slate-400 text-xs">n8n Engine</div>
            <div className="text-emerald-400 font-semibold mt-1">Port 5678</div>
            <div className="text-slate-500 text-xs mt-1">6 Workflows / Host</div>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-slate-400 text-xs">NestJS API</div>
            <div className="text-emerald-400 font-semibold mt-1">Port 4000</div>
            <div className="text-slate-500 text-xs mt-1">/api/v1/*</div>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-slate-400 text-xs">Next.js UI</div>
            <div className="text-emerald-400 font-semibold mt-1">Port 3000</div>
            <div className="text-slate-500 text-xs mt-1">App Router</div>
          </div>
        </div>
      </div>
    </div>
  );
}

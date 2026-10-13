import Link from 'next/link';
import { Mail, CheckCircle, BarChart2, Users, FileText } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-rose-150 bg-white/85 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-rose-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center font-bold text-white shadow-md shadow-rose-200 group-hover:scale-105 transition">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-800 tracking-tight">
              Enterprise Email Automation
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              3 Thành Viên &bull; 9 Micro-Workflows &bull; 10 AI Agents
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-2 text-sm">
          <Link
            href="/tickets"
            className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-rose-600 hover:bg-rose-50/80 transition font-semibold flex items-center gap-1.5 border border-transparent hover:border-rose-200/60"
          >
            <Mail className="w-4 h-4 text-rose-500" />
            <span>Hộp Thư (TV1)</span>
          </Link>
          <Link
            href="/approval"
            className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition font-semibold flex items-center gap-1.5 border border-transparent hover:border-indigo-200/60"
          >
            <CheckCircle className="w-4 h-4 text-indigo-500" />
            <span>Duyệt RAG (TV2)</span>
          </Link>
          <Link
            href="/analytics"
            className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/80 transition font-semibold flex items-center gap-1.5 border border-transparent hover:border-emerald-200/60"
          >
            <BarChart2 className="w-4 h-4 text-emerald-500" />
            <span>Báo Cáo (TV2)</span>
          </Link>
          <Link
            href="/crm"
            className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-amber-600 hover:bg-amber-50/80 transition font-semibold flex items-center gap-1.5 border border-transparent hover:border-amber-200/60"
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>CRM Leads (TV3)</span>
          </Link>
          <Link
            href="/invoices"
            className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-purple-600 hover:bg-purple-50/80 transition font-semibold flex items-center gap-1.5 border border-transparent hover:border-purple-200/60"
          >
            <FileText className="w-4 h-4 text-purple-500" />
            <span>Hóa Đơn &amp; OCR (TV3)</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

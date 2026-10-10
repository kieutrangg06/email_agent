import Link from 'next/link';
import { Mail } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-rose-150 bg-white/85 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-rose-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center font-bold text-white shadow-md shadow-rose-200">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-800 tracking-tight">
              Email Automation &amp; Helpdesk
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Hệ Thống Tiếp Nhận &amp; Điều Phối Vé Hỗ Trợ
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-2 text-sm">
          <Link
            href="/tickets"
            className="px-3.5 py-1.5 rounded-lg text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 transition font-semibold flex items-center gap-1.5 border border-rose-200/60"
          >
            <Mail className="w-4 h-4 text-rose-500" />
            <span>Hộp Thư &amp; Vé Hỗ Trợ</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

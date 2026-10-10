import Link from 'next/link';

export function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            M1
          </div>
          <span className="font-semibold text-lg text-white tracking-tight">
            AI Email Triage &amp; Helpdesk SLA
          </span>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
            Member 1 Edition
          </span>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-2 text-sm">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Tổng quan (3 Luồng)
          </Link>
          <Link
            href="/tickets"
            className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Triage &amp; Ticket Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}

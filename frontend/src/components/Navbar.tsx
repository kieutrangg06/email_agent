import Link from 'next/link';

export function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            EA
          </div>
          <span className="font-semibold text-lg text-white tracking-tight">
            Email Automation CRM
          </span>
          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
            v1.0.0
          </span>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-2 text-sm">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Overview
          </Link>
          <Link
            href="/tickets"
            className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            M1: Tickets
          </Link>
          <Link
            href="/approvals"
            className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            M2: Approvals (HITL)
          </Link>
          <Link
            href="/crm"
            className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            M3: CRM Leads
          </Link>
          <Link
            href="/invoices"
            className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-pink-400"></span>
            M3: Invoices OCR
          </Link>
        </nav>
      </div>
    </header>
  );
}

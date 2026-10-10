import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Member 1: AI Email Triage & Helpdesk SLA Dispatcher',
  description: 'Enterprise Email Automation - Member 1 Standalone Project (3 Flows x 12 Nodes)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-800 text-center py-4 text-xs text-slate-500">
          Member 1: AI Email Triage &amp; Helpdesk SLA Dispatcher &copy; 2026 VKU Engineering
        </footer>
      </body>
    </html>
  );
}

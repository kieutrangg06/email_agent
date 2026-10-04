import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Intelligent Enterprise Email Automation & Helpdesk CRM',
  description: 'Enterprise AI Agent Monorepo with n8n, Next.js, NestJS, and PostgreSQL',
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
          Intelligent Enterprise Email Automation &copy; 2026 VKU Engineering
        </footer>
      </body>
    </html>
  );
}

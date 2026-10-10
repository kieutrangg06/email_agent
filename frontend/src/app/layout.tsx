import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Email Automation & Helpdesk CRM',
  description: 'Hệ Thống Tiếp Nhận Email, Phân Loại & Điều Phối Vé Hỗ Trợ Tự Động',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col text-slate-800 antialiased selection:bg-rose-200 selection:text-rose-900 bg-slate-50/50">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-rose-100/80 bg-white/70 backdrop-blur text-center py-4 text-xs text-slate-500 font-medium">
          Hệ Thống Tự Động Hóa Xử Lý Email &amp; Quản Lý Vé Hỗ Trợ Doanh Nghiệp
        </footer>
      </body>
    </html>
  );
}

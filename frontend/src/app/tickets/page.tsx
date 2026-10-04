'use client';

import React, { useState, useEffect } from 'react';

interface Ticket {
  id: number;
  ticket_code: string;
  sender_email: string;
  title: string;
  description: string;
  category: string;
  assigned_to: string;
  priority: string;
  status: string;
  first_response_sla: string;
  created_at: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch tickets from NestJS backend (fallback to demo data if offline)
    fetch('http://localhost:4000/api/v1/tickets')
      .then((res) => res.json())
      .then((data) => {
        setTickets(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback demo items
        setTickets([
          {
            id: 1,
            ticket_code: 'TICK-2026-0001',
            sender_email: 'client-alpha@enterprise.vn',
            title: 'Lỗi API 504 Gateway Timeout trên production',
            description: 'Hệ thống không truy cập được từ 08:30 sáng nay.',
            category: 'Technical',
            assigned_to: 'Nguyen Van Tech',
            priority: 'P1',
            status: 'OPEN',
            first_response_sla: '2026-10-04T14:30:00Z',
            created_at: '2026-10-04T12:30:00Z',
          },
          {
            id: 2,
            ticket_code: 'TICK-2026-0002',
            sender_email: 'finance@supplier.com',
            title: 'Yêu cầu kiểm tra đối soát công nợ Q3',
            description: 'Đề nghị xác nhận công nợ hóa đơn VAT tháng trước.',
            category: 'Finance',
            assigned_to: 'Tran Thi Accounting',
            priority: 'P3',
            status: 'IN_PROGRESS',
            first_response_sla: '2026-10-04T16:00:00Z',
            created_at: '2026-10-04T11:00:00Z',
          },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            Member 1: Helpdesk Tickets & SLA Dispatching
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Luồng 1 (AI Email Triage - 21 nodes) &amp; Luồng 2 (AI Ticket Generator - 20 nodes)
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-mono">
          Branch: feature/m1-triage-ticket
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Danh sách Ticket tiếp nhận</span>
          <span className="text-xs text-slate-500 font-mono">Tổng: {tickets.length} tickets</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Đang tải dữ liệu ticket...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã Ticket</th>
                  <th className="py-3 px-4">Tiêu đề &amp; Người gửi</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4">Độ ưu tiên</th>
                  <th className="py-3 px-4">KTV phụ trách</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tickets.map((t) => (
                  <tr key={t.ticket_code} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-emerald-400 font-medium">
                      {t.ticket_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{t.title}</div>
                      <div className="text-xs text-slate-400 font-mono">{t.sender_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          t.priority === 'P1'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{t.assigned_to}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';

interface Customer {
  id: number;
  email: string;
  full_name: string;
  company: string;
  phone: string;
  lead_score: number;
  status: string;
}

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/crm/customers')
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => {
        setCustomers([
          {
            id: 1,
            email: 'director@vietcorp.vn',
            full_name: 'Tran Van Binh',
            company: 'Viet Solution Corp',
            phone: '0912345678',
            lead_score: 85,
            status: 'QUALIFIED',
          },
          {
            id: 2,
            email: 'contact@techstart.io',
            full_name: 'Le Thi Hoang',
            company: 'TechStart Innovation',
            phone: '0987654321',
            lead_score: 45,
            status: 'NEW',
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
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            Member 3: AI CRM Leads &amp; Scoring Pipeline
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Luồng 5 (AI Email-to-CRM Lead Extraction - 21 nodes)
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-mono">
          Branch: feature/m3-crm-ocr
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Khách hàng Tiềm năng (Leads)</span>
          <span className="text-xs text-slate-500 font-mono">Tổng: {customers.length} contacts</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Đang tải danh sách CRM...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Doanh nghiệp</th>
                  <th className="py-3 px-4">Email / SĐT</th>
                  <th className="py-3 px-4">Lead Score (0-100)</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {customers.map((c) => (
                  <tr key={c.email} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-medium text-white">{c.full_name || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-300">{c.company || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <div className="text-amber-400">{c.email}</div>
                      <div className="text-slate-500">{c.phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              c.lead_score >= 80 ? 'bg-amber-400' : 'bg-slate-500'
                            }`}
                            style={{ width: `${c.lead_score}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs font-semibold text-white">
                          {c.lead_score}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {c.status}
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

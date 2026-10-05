'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface Customer {
  id: number;
  email: string;
  full_name: string;
  company: string;
  phone: string;
  lead_score: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    budget: '60000000',
    status: 'QUALIFIED',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCustomers = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/v1/crm/customers')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => {
        setCustomers([
          {
            id: 1,
            email: 'khoa.tran@example.com',
            full_name: 'Trần Anh Khoa',
            company: 'Tập đoàn Công nghệ Alpha',
            phone: '0912345678',
            lead_score: 90,
            status: 'PRIORITY_SALES',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            email: 'director@vietcorp.vn',
            full_name: 'Trần Văn Bình',
            company: 'Viet Solution Corp',
            phone: '0912345678',
            lead_score: 85,
            status: 'QUALIFIED',
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            email: 'lan.mai@vku.udn.vn',
            full_name: 'Mai Hương Lan',
            company: 'Đại học VKU',
            phone: '0988776655',
            lead_score: 65,
            status: 'FOLLOWED_UP',
            created_at: new Date().toISOString(),
          },
          {
            id: 4,
            email: 'contact@partner.vn',
            full_name: 'Nguyễn Văn Minh',
            company: 'Minh Phát Logistics',
            phone: '0903334444',
            lead_score: 85,
            status: 'QUALIFIED',
            created_at: new Date().toISOString(),
          },
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      alert('Vui lòng nhập Email khách hàng');
      return;
    }
    setIsSubmitting(true);
    try {
      const budgetNum = Number(formData.budget) || 0;
      let calculatedScore = 50;
      if (budgetNum >= 50000000) calculatedScore += 40;
      if (formData.phone) calculatedScore += 10;

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        leadScore: calculatedScore,
        dealValue: budgetNum,
        status: calculatedScore >= 80 ? 'PRIORITY_SALES' : formData.status,
      };

      const res = await fetch('http://localhost:4000/api/v1/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('API request failed');

      showToast(`Đã thêm/cập nhật Lead thành công (Score: ${calculatedScore})!`);
      setIsModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        company: '',
        phone: '',
        budget: '60000000',
        status: 'QUALIFIED',
      });
      fetchCustomers();
    } catch (err: any) {
      showToast('Có lỗi khi tạo lead: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (type: 'vip' | 'regular') => {
    if (type === 'vip') {
      setFormData({
        fullName: 'Lê Hoàng Nam',
        email: 'nam.le@vietinfratech.com',
        company: 'VietInfra Tech Holdings',
        phone: '0908889999',
        budget: '120000000',
        status: 'PRIORITY_SALES',
      });
    } else {
      setFormData({
        fullName: 'Phạm Thu Trang',
        email: 'trang.pham@novastart.vn',
        company: 'NovaStart Co.',
        phone: '0933221100',
        budget: '25000000',
        status: 'NEW',
      });
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesStatus =
        filterStatus === 'ALL' || c.status.toUpperCase() === filterStatus.toUpperCase();

      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        c.full_name?.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [customers, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const priority = customers.filter(
      (c) => c.lead_score >= 80 || c.status === 'PRIORITY_SALES'
    ).length;
    const qualified = customers.filter(
      (c) => c.lead_score >= 60 && c.lead_score < 80
    ).length;
    const followedUp = customers.filter((c) => c.status === 'FOLLOWED_UP').length;

    return { total, priority, qualified, followedUp };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-amber-500 text-slate-950 font-medium px-4 py-2.5 rounded-lg shadow-xl border border-amber-400 flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse"></span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Member 3: AI CRM Leads &amp; Scoring Pipeline
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Luồng 5: AI Email-to-CRM Lead Extraction &amp; Auto Follow-up (21 nodes n8n)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <span>+</span> Giả lập Lead AI
          </button>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition"
          >
            {loading ? 'Đang tải...' : 'Làm mới ↻'}
          </button>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-mono">
            feature/m3-crm-ocr
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase font-mono">Tổng số Leads</div>
          <div className="text-2xl font-bold text-white mt-1.5">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Khách hàng trong hệ thống</div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
          <div className="text-xs text-amber-400 uppercase font-mono font-medium">VIP / Priority</div>
          <div className="text-2xl font-bold text-amber-400 mt-1.5">{stats.priority}</div>
          <div className="text-xs text-amber-500/80 mt-1">Điểm Lead Score &ge; 80</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 uppercase font-mono">Tiềm năng (Qualified)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5">{stats.qualified}</div>
          <div className="text-xs text-slate-500 mt-1">Điểm Lead Score 60 - 79</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-blue-400 uppercase font-mono">Đã chăm sóc</div>
          <div className="text-2xl font-bold text-blue-400 mt-1.5">{stats.followedUp}</div>
          <div className="text-xs text-slate-500 mt-1">Đã gửi email Follow-up</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PRIORITY_SALES', label: 'Priority Sales (VIP)' },
              { id: 'QUALIFIED', label: 'Qualified' },
              { id: 'FOLLOWED_UP', label: 'Followed Up' },
              { id: 'NEW', label: 'Mới (New)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                  filterStatus === tab.id
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, email, công ty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="inline-block w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div>Đang tải danh sách CRM Leads...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Không tìm thấy khách hàng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Doanh nghiệp</th>
                  <th className="py-3 px-4">Email / Hotline</th>
                  <th className="py-3 px-4">Điểm Lead Score (0 - 100)</th>
                  <th className="py-3 px-4">Trạng thái CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCustomers.map((c) => {
                  const isVip = c.lead_score >= 80;
                  const isQualified = c.lead_score >= 60 && c.lead_score < 80;

                  return (
                    <tr key={c.email} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                        {isVip && (
                          <span className="text-amber-400 text-xs" title="VIP Lead">
                            ★
                          </span>
                        )}
                        <span>{c.full_name || 'Khách hàng'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{c.company || 'Doanh nghiệp liên hệ'}</td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="text-amber-400 font-medium">{c.email}</div>
                        <div className="text-slate-500 mt-0.5">{c.phone || 'Chưa có SĐT'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isVip
                                  ? 'bg-amber-400'
                                  : isQualified
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${Math.min(c.lead_score, 100)}%` }}
                            ></div>
                          </div>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isVip
                                ? 'text-amber-400'
                                : isQualified
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {c.lead_score} pts
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
                            c.status === 'PRIORITY_SALES'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                              : c.status === 'QUALIFIED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : c.status === 'FOLLOWED_UP'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Giả lập Lead AI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Giả lập AI Bóc tách Lead &amp; Chấm điểm CRM
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Chọn mẫu nhanh:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('vip')}
                className="px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/25"
              >
                Mẫu VIP (Ngân sách 120tr - 100đ)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('regular')}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded hover:bg-slate-700"
              >
                Mẫu Standard (25tr - 60đ)
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Họ và Tên</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Lê Hoàng Nam"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nam.le@vietinfra.vn"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0908889999"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tên Doanh nghiệp</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="VietInfra Tech Holdings"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quy mô ngân sách (VND)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="60000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Lead & Chấm Điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

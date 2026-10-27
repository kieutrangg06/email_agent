'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';
import { Users, DollarSign, TrendingUp, Send, RefreshCw, Plus, Clock, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  lead_score: number;
  is_unsubscribed: boolean;
  created_at?: string;
}

interface Deal {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  lead_score?: number;
  deal_name: string;
  expected_budget: number;
  stage: string;
  campaign_tag: string;
  assigned_sales_rep: string;
  followup_count: number;
  last_contacted_at: string;
  created_at: string;
}

export default function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'deals' | 'customers'>('deals');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Lead Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadFullName, setLeadFullName] = useState('Trần Văn Giám Đốc');
  const [leadCompany, setLeadCompany] = useState('Tập đoàn Công nghệ ABC');
  const [leadEmail, setLeadEmail] = useState('trangltk.24it@vku.udn.vn');
  const [leadPhone, setLeadPhone] = useState('+84 905 123 456');
  const [dealName, setDealName] = useState('Hợp đồng giải pháp Email Automation Enterprise');
  const [dealBudget, setDealBudget] = useState(250000000);
  const [dealStage, setDealStage] = useState('PROPOSAL');
  const [leadScore, setLeadScore] = useState(95);
  const [dealNotes, setDealNotes] = useState('Khách hàng có ngân sách lớn, yêu cầu triển khai trong tháng tới.');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFullName || !leadEmail) {
      showToast('Vui lòng điền họ tên và email!');
      return;
    }
    setIsSubmittingLead(true);
    try {
      // 1. Tạo Customer
      const custRes = await fetch(`${API_BASE_URL}/api/v1/crm/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: leadFullName,
          email: leadEmail,
          phone: leadPhone,
          company_name: leadCompany,
          lead_score: Number(leadScore),
        }),
      });
      const custData = await custRes.json();

      // 2. Tạo Deal
      await fetch(`${API_BASE_URL}/api/v1/crm/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: custData?.id,
          customer_name: leadFullName,
          customer_email: leadEmail,
          deal_name: dealName,
          expected_budget: Number(dealBudget),
          stage: dealStage,
          campaign_tag: 'Inbound VIP',
          assigned_sales_rep: 'Lê Thị Bích',
          note: dealNotes,
        }),
      });

      showToast(`Đã thêm Lead VIP: ${leadFullName} (${Number(dealBudget).toLocaleString('vi-VN')} đ)`);
      setShowAddLeadModal(false);
      await fetchData();
    } catch {
      showToast('Lỗi khi thêm Lead vào hệ thống');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/crm/customers`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/api/v1/crm/deals`).then((r) => (r.ok ? r.json() : [])),
      ]);
      setCustomers(Array.isArray(cRes) ? cRes : []);
      setDeals(Array.isArray(dRes) ? dRes : []);
    } catch {
      setCustomers([]);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDeals = deals.filter((d) => (filterStage === 'ALL' ? true : d.stage === filterStage));

  const totalPipeline = deals.reduce((acc, d) => acc + Number(d.expected_budget || 0), 0);
  const vipCount = customers.filter((c) => c.lead_score >= 80).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl border border-rose-500/30 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-rose-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Đường Ống Bán Hàng &amp; Khách Hàng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi cơ hội kinh doanh, phân khúc tiềm năng và chăm sóc khách hàng tự động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddLeadModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-rose-200"
            title="Mở form thêm cơ hội kinh doanh / Lead mới"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Lead Bán Hàng (Test Thật)</span>
          </button>

          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-xs sm:text-sm font-medium transition shadow-xs"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4 text-rose-500" />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Giá Trị Pipeline</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalPipeline.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">VNĐ</span>
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{deals.length} cơ hội kinh doanh</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Tiềm Năng VIP (&ge; 80 pts)</div>
          <div className="text-2xl font-black text-amber-600 mt-2">{vipCount}</div>
          <div className="text-xs text-slate-400 mt-1">Được ưu tiên tư vấn khẩn cấp</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Số Khách Hàng</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{customers.length}</div>
          <div className="text-xs text-slate-400 mt-1">Khách hàng trong cơ sở dữ liệu</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang Chăm Sóc (Quoted)</div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {deals.filter((d) => d.stage === 'QUOTED').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Đang trong chu kỳ liên hệ</div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('deals')}
            className={`pb-3 font-semibold text-sm transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'deals' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cơ Hội Bán Hàng (Deals Pipeline)</span>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-3 font-semibold text-sm transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'customers' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hồ Sơ Khách Hàng (Customer Scores)</span>
          </button>
        </div>

        {activeTab === 'deals' && (
          <div className="flex items-center gap-1.5 pb-2">
            {['ALL', 'NEW_INQUIRY', 'QUOTED', 'COLD_LEAD', 'WON'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStage(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterStage === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-rose-100/70 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Đang tải dữ liệu đường ống CRM...</div>
        ) : activeTab === 'deals' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Cơ Hội (Deal)</th>
                  <th className="px-5 py-3.5">Khách Hàng / Công Ty</th>
                  <th className="px-5 py-3.5">Ngân Sách Dự Kiến</th>
                  <th className="px-5 py-3.5">Điểm Tiềm Năng</th>
                  <th className="px-5 py-3.5">Giai Đoạn</th>
                  <th className="px-5 py-3.5">Follow-up</th>
                  <th className="px-5 py-3.5">Phụ Trách</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      Chưa có cơ hội bán hàng nào trong giai đoạn này.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const score = Number(deal.lead_score || 70);
                    return (
                      <tr key={deal.id} className="hover:bg-rose-50/20 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{deal.deal_name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">Mã #{deal.id} &bull; {deal.campaign_tag}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{deal.customer_name || 'Khách hàng'}</div>
                          <div className="text-xs text-slate-500">{deal.customer_email} &bull; {deal.customer_phone || 'N/A'}</div>
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-700">
                          {Number(deal.expected_budget || 0).toLocaleString('vi-VN')} VNĐ
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                score >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {score} PTS
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              deal.stage === 'NEW_INQUIRY'
                                ? 'bg-blue-100 text-blue-700'
                                : deal.stage === 'QUOTED'
                                ? 'bg-amber-100 text-amber-700'
                                : deal.stage === 'COLD_LEAD'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {deal.stage}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Đã gửi {deal.followup_count} lần</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(deal.last_contacted_at).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-700">
                          {deal.assigned_sales_rep || 'Nguyễn Văn An'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Họ &amp; Tên Khách Hàng</th>
                  <th className="px-5 py-3.5">Doanh Nghiệp / Đơn Vị</th>
                  <th className="px-5 py-3.5">Email &amp; Số Điện Thoại</th>
                  <th className="px-5 py-3.5">Điểm Tiềm Năng (Score)</th>
                  <th className="px-5 py-3.5">Trạng Thái Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-rose-50/20 transition">
                    <td className="px-5 py-4 font-bold text-slate-900">{c.full_name}</td>
                    <td className="px-5 py-4 text-slate-700 font-medium">{c.company_name}</td>
                    <td className="px-5 py-4 text-xs">
                      <div className="text-slate-800 font-medium">{c.email}</div>
                      <div className="text-slate-400">{c.phone || 'Chưa cập nhật SĐT'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.lead_score >= 80 ? 'bg-amber-500' : c.lead_score >= 60 ? 'bg-blue-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(c.lead_score, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs text-slate-700">{c.lead_score} / 100</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {c.is_unsubscribed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Từ chối nhận tin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng nhận mail
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL THÊM LEAD MỚI */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 uppercase">
                  CRM Inbound Test
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">Thêm Khách Hàng &amp; Cơ Hội Bán Hàng</h3>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fill Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeadFullName('Trần Văn Giám Đốc');
                  setLeadCompany('Tập đoàn Công nghệ ABC');
                  setLeadEmail('trangltk.24it@vku.udn.vn');
                  setLeadPhone('+84 905 123 456');
                  setDealName('Hợp đồng giải pháp Email Automation Enterprise');
                  setDealBudget(250000000);
                  setDealStage('PROPOSAL');
                  setLeadScore(95);
                  setDealNotes('Khách hàng VIP cần triển khai gấp trong tháng 11.');
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>⚡ Nạp Mẫu Lead VIP (250.000.000 đ - Score 95)</span>
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Họ &amp; Tên Khách Hàng</label>
                  <input
                    type="text"
                    required
                    value={leadFullName}
                    onChange={(e) => setLeadFullName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs"
                    placeholder="VD: Trần Văn Giám Đốc"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Doanh Nghiệp / Công Ty</label>
                  <input
                    type="text"
                    required
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs"
                    placeholder="VD: Tập đoàn ABC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email Liên Hệ</label>
                  <input
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs"
                    placeholder="trangltk.24it@vku.udn.vn"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Số Điện Thoại (+84)</label>
                  <input
                    type="text"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs"
                    placeholder="+84 905 123 456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Tên Hợp Đồng / Deal</label>
                  <input
                    type="text"
                    required
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs"
                    placeholder="Tên gói sản phẩm"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Điểm Lead Score</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={leadScore}
                    onChange={(e) => setLeadScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Quy Mô Ngân Sách (VNĐ)</label>
                  <input
                    type="number"
                    required
                    step="1000000"
                    value={dealBudget}
                    onChange={(e) => setDealBudget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Giai Đoạn Pipeline</label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs"
                  >
                    <option value="PROPOSAL">Proposal / Báo Giá</option>
                    <option value="QUOTED">Quoted / Đàm Phán</option>
                    <option value="DISCOVERY">Discovery / Tìm Hiểu</option>
                    <option value="CLOSED_WON">Closed Won / Chốt Thành Công</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Ghi Chú Nhu Cầu</label>
                <textarea
                  rows={2}
                  value={dealNotes}
                  onChange={(e) => setDealNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-rose-500 text-xs"
                  placeholder="Ghi chú chi tiết về nhu cầu mua hàng..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold shadow-md shadow-rose-200 disabled:opacity-50"
                >
                  {isSubmittingLead ? 'Đang Lưu...' : 'Lưu Lead & Tạo Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

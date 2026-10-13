'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Mail,
  LifeBuoy,
  Clock,
  Sparkles,
  Calendar,
  FileText,
  ChevronRight,
  TrendingUp,
  Inbox,
  AlertOctagon,
} from 'lucide-react';

interface DailySummary {
  id: number;
  report_date: string;
  summary_date?: string;
  total_emails_received: number;
  total_tickets_created: number;
  sla_compliance_rate: number;
  executive_summary: string;
  anomaly_detected: boolean;
  total_received?: number;
  total_p1?: number;
  total_pending_tickets?: number;
  key_insights?: string;
  risk_summary?: string;
  recommendations?: any;
  incident_spike?: boolean;
  incident_count?: number;
  baseline_count?: number;
  increase_percent?: number;
  created_at: string;
}

export default function AnalyticsPage() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null);

  const fetchSummaries = () => {
    setLoading(true);
    fetch('http://localhost:4000/api/v1/digest')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch digest');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setSummaries(data);
          if (data.length > 0 && !selectedSummary) {
            setSelectedSummary(data[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setSummaries([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const latest = summaries.length > 0 ? summaries[0] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Card */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-rose-150 shadow-sm shadow-rose-100/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-semibold tracking-wide inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              THÀNH VIÊN 2 • EXECUTIVE INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Báo Cáo Điều Hành &amp; Tổng Kết 24h
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Theo dõi số liệu vận hành tự động, tỷ lệ SLA và giám sát đột biến sự cố nghiêm trọng (Luồng 6 Cron Digest).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSummaries}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-xs sm:text-sm font-medium transition shadow-xs"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw className={`w-4 h-4 text-rose-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Latest KPI Overview */}
      {latest && (
        <div className="space-y-4">
          {/* Incident Spike Banner if detected */}
          {(latest.anomaly_detected || latest.incident_spike) && (
            <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 shadow-sm shadow-rose-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm shadow-rose-300">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-rose-900">
                    CẢNH BÁO ĐỘT BIẾN SỰ CỐ KHẨN CẤP (INCIDENT SPIKE DETECTED)
                  </h3>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    Tỷ lệ phát sinh sự cố P1 tăng vọt so với ngưỡng an toàn trung bình 7 ngày. Luồng 6 đã tự động kích hoạt gửi điện khẩn tới Ban Giám Đốc.
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs uppercase tracking-wider shrink-0 self-start sm:self-auto">
                Mức độ: Cấp Bách (P1)
              </span>
            </div>
          )}

          {/* 4 KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Tổng Email Tiếp Nhận</p>
                <p className="text-2xl font-extrabold text-slate-800">
                  {latest.total_emails_received || latest.total_received || 0}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ngày {latest.report_date || latest.summary_date}</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Tổng Vé Đã Tạo</p>
                <p className="text-2xl font-extrabold text-purple-700">
                  {latest.total_tickets_created || 0}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Phân tuyến điều phối KTV</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Tỷ Lệ Đạt SLA</p>
                <p className="text-2xl font-extrabold text-emerald-700">
                  {latest.sla_compliance_rate ? `${Number(latest.sla_compliance_rate).toFixed(1)}%` : '100%'}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Mục tiêu: &ge; 95%</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-150 shadow-xs flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  latest.anomaly_detected || latest.incident_spike ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Trạng Thái Vận Hành</p>
                <p
                  className={`text-xl sm:text-2xl font-extrabold ${
                    latest.anomaly_detected || latest.incident_spike ? 'text-rose-600' : 'text-teal-700'
                  }`}
                >
                  {latest.anomaly_detected || latest.incident_spike ? 'Đột Biến P1' : 'Ổn Định'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">So sánh baseline 7 ngày</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: History List */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-rose-150 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Lịch Sử Báo Cáo ({summaries.length})
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">daily_summaries</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                <span>Đang tải lịch sử báo cáo...</span>
              </div>
            ) : summaries.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                <Inbox className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                Chưa có bản ghi nào trong bảng daily_summaries
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                {summaries.map((item) => {
                  const isSelected = selectedSummary?.id === item.id;
                  const isSpike = item.anomaly_detected || item.incident_spike;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSummary(item)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-rose-50/80 border-rose-300 shadow-xs ring-1 ring-rose-200'
                          : 'bg-white border-slate-200/80 hover:bg-rose-50/30 hover:border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-rose-500" />
                          {item.report_date || item.summary_date}
                        </span>
                        {isSpike ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            SPIKE P1
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ỔN ĐỊNH
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                        <span>Email: <strong className="text-slate-700">{item.total_emails_received || item.total_received || 0}</strong></span>
                        <span>Vé: <strong className="text-purple-700">{item.total_tickets_created || 0}</strong></span>
                        <span>SLA: <strong className="text-emerald-700">{item.sla_compliance_rate ? `${Number(item.sla_compliance_rate).toFixed(0)}%` : '100%'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-2">
          {selectedSummary ? (
            <div className="bg-white rounded-3xl border border-rose-150 shadow-sm shadow-rose-100/20 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-rose-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-500" />
                    Chi Tiết Báo Cáo Ngày: {selectedSummary.report_date || selectedSummary.summary_date}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Khởi tạo lúc: {new Date(selectedSummary.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-mono font-bold">
                  BẢN GHI #{selectedSummary.id}
                </span>
              </div>

              {/* Executive Summary Narrative */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Tóm Tắt Điều Hành (AI Executive Narrative - Agent 5)
                </h4>
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedSummary.executive_summary || selectedSummary.key_insights || 'Chưa có nội dung tóm tắt cho ngày này.'}
                </div>
              </div>

              {/* Risk Summary if exists */}
              {selectedSummary.risk_summary && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Phân Tích Nguy Cơ &amp; Điểm Nghẽn Vận Hành
                  </h4>
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    {selectedSummary.risk_summary}
                  </div>
                </div>
              )}

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Lưu lượng Email</div>
                  <div className="text-xl font-extrabold text-slate-800 mt-1">
                    {selectedSummary.total_emails_received || selectedSummary.total_received || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Tiếp nhận hộp thư</div>
                </div>

                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Số vé phát sinh</div>
                  <div className="text-xl font-extrabold text-purple-700 mt-1">
                    {selectedSummary.total_tickets_created || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Điều phối KTV</div>
                </div>

                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                  <div className="text-[11px] text-slate-400 font-medium">Tỷ lệ đạt SLA</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-1">
                    {selectedSummary.sla_compliance_rate ? `${Number(selectedSummary.sla_compliance_rate).toFixed(1)}%` : '100%'}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Cam kết dịch vụ</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-rose-150 text-slate-400 text-sm">
              <Calendar className="w-8 h-8 text-rose-300 mb-2" />
              <span>Chọn một ngày báo cáo để xem phân tích chi tiết</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

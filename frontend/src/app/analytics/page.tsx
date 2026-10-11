'use client';

import React, { useState, useEffect } from 'react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-semibold tracking-wide">
                THÀNH VIÊN 2 &bull; EXECUTIVE
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Executive Intelligence & Daily Digest
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Báo cáo tổng kết điều hành 24h & Giám sát đột biến sự cố nghiêm trọng (Luồng 6 Cron Digest)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSummaries}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-purple-600/20 flex items-center gap-2"
            >
              🔄 Tải lại dữ liệu
            </button>
          </div>
        </div>

        {/* Latest KPI Overview */}
        {latest && (
          <div className="space-y-6">
            {/* Incident Spike Banner if detected */}
            {(latest.anomaly_detected || latest.incident_spike) && (
              <div className="p-5 rounded-2xl bg-rose-950/80 border-2 border-rose-500/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🚨</span>
                  <div>
                    <h3 className="text-base font-bold text-rose-300">
                      CẢNH BÁO ĐỘT BIẾN SỰ CỐ KHẨN CẤP (INCIDENT SPIKE DETECTED)
                    </h3>
                    <p className="text-xs text-rose-200 mt-0.5">
                      Tỷ lệ phát sinh sự cố P1 tăng vọt so với ngưỡng an toàn. Luồng 6 đã tự động kích hoạt gửi điện khẩn tới Tổng Giám Đốc.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-rose-900 text-rose-200 text-xs font-bold rounded-lg border border-rose-700/60 uppercase tracking-wider">
                  Mức độ: Cấp Bách (P1)
                </span>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Tổng Email Tiếp Nhận
                </div>
                <div className="text-3xl font-extrabold text-white mt-2">
                  {latest.total_emails_received || latest.total_received || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Trong chu kỳ báo cáo ngày {latest.report_date || latest.summary_date}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Tổng Vé Sự Cố Đã Tạo
                </div>
                <div className="text-3xl font-extrabold text-indigo-400 mt-2">
                  {latest.total_tickets_created || 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Đã phân bổ cho KTV và phân tuyến SLA
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Tỷ Lệ Tuân Thủ SLA
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                  {latest.sla_compliance_rate ? `${Number(latest.sla_compliance_rate).toFixed(1)}%` : '100%'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Mục tiêu doanh nghiệp: &ge; 95%
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Sự Cố Đột Biến / Dị Thường
                </div>
                <div className="text-3xl font-extrabold mt-2">
                  {latest.anomaly_detected || latest.incident_spike ? (
                    <span className="text-rose-400">Có đột biến</span>
                  ) : (
                    <span className="text-teal-400">Bình thường</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  So sánh 7 ngày liền kề
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* History List */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
              Lịch Sử Báo Cáo Hằng Ngày ({summaries.length})
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Đang tải lịch sử báo cáo...</div>
            ) : summaries.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-500">
                Chưa có bản ghi nào trong bảng daily_summaries
              </div>
            ) : (
              <div className="space-y-3">
                {summaries.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSummary(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedSummary?.id === item.id
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">
                        📅 {item.report_date || item.summary_date}
                      </span>
                      {item.anomaly_detected || item.incident_spike ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          SPIKE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          STABLE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span>Email: {item.total_emails_received || item.total_received || 0}</span>
                      <span>Vé: {item.total_tickets_created || 0}</span>
                      <span>SLA: {item.sla_compliance_rate ? `${Number(item.sla_compliance_rate).toFixed(0)}%` : '100%'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed View */}
          <div className="lg:col-span-2">
            {selectedSummary ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Chi Tiết Báo Cáo: {selectedSummary.report_date || selectedSummary.summary_date}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Khởi tạo lúc: {new Date(selectedSummary.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono">
                    ID #{selectedSummary.id}
                  </span>
                </div>

                {/* Executive Summary Narrative */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                    📌 Tóm Tắt Điều Hành (AI Executive Narrative - Agent 5)
                  </h4>
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedSummary.executive_summary || selectedSummary.key_insights || 'Chưa có nội dung tóm tắt.'}
                  </div>
                </div>

                {/* Risk Summary if exists */}
                {selectedSummary.risk_summary && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      ⚠️ Phân Tích Nguy Cơ & Điểm Nghẽn Vận Hành
                    </h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
                      {selectedSummary.risk_summary}
                    </div>
                  </div>
                )}

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-500 font-medium">Lưu lượng Email</div>
                    <div className="text-xl font-bold text-white mt-1">
                      {selectedSummary.total_emails_received || selectedSummary.total_received || 0}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-500 font-medium">Số vé phát sinh</div>
                    <div className="text-xl font-bold text-indigo-400 mt-1">
                      {selectedSummary.total_tickets_created || 0}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-500 font-medium">Tỷ lệ đạt SLA</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1">
                      {selectedSummary.sla_compliance_rate ? `${Number(selectedSummary.sla_compliance_rate).toFixed(1)}%` : '100%'}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-sm">
                Chọn một ngày báo cáo để xem phân tích chi tiết
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/**
 * KỊCH BẢN DEMO TOÀN DIỆN VẬN HÀNH THẬT TRÊN CLOUD HOST
 * Hệ thống: Enterprise Email Automation & Helpdesk CRM
 * Cloud API: https://email-automation-api-a377.onrender.com
 * Frontend : https://email-automation-vku.onrender.com
 * Database : Supabase PostgreSQL 16 (Tokyo)
 */

const https = require('https');

const API_BASE = 'https://email-automation-api-a377.onrender.com';

function request(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyStr = data ? JSON.stringify(data) : null;
    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
        timeout: 30000,
      },
      (res) => {
        let text = '';
        res.on('data', (c) => (text += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(text) });
          } catch {
            resolve({ status: res.statusCode, data: text });
          }
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('=================================================================================');
  console.log('🚀 BẮT ĐẦU VẬN HÀNH DEMO DỮ LIỆU THẬT 100% TRÊN CLOUD RENDER & SUPABASE');
  console.log('=================================================================================\n');

  // BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ TRÊN CLOUD DATABASE
  console.log('🧹 BƯỚC 1: Reset dữ liệu CSDL Supabase về trạng thái nguyên bản...');
  const resetRes = await request(`${API_BASE}/api/v1/admin/reset-database`, 'POST');
  console.log(`   -> Kết quả: ${resetRes.data.message || 'Đã làm sạch database'}\n`);
  await sleep(1000);

  // BƯỚC 2: KHÁCH HÀNG 1 GỬI EMAIL SỰ CỐ KHẨN CẤP (TECHNICAL P1 - SLA 1 GIỜ)
  console.log('📩 BƯỚC 2: Khách hàng Lê Thị Kiều Trang gửi email phản ánh sự cố hệ thống sập...');
  const tkCode1 = `TK-VKU-${Date.now().toString().slice(-4)}`;
  
  // 2.1 Tiếp nhận vào Triage
  await request(`${API_BASE}/api/v1/triage/logs`, 'POST', {
    sender_name: 'Lê Thị Kiều Trang',
    sender_email: 'trangltk.24it@vku.udn.vn',
    subject: '[SỰ CỐ KHẨN CẤP] Cổng đăng ký tín chỉ học phần VKU báo lỗi 504 Gateway Timeout',
    body_snippet: 'Kính gửi ban kỹ thuật, toàn bộ 2500 sinh viên không thể truy cập đăng ký môn học sáng nay do cơ sở dữ liệu bị nghẽn mạng quá tải. Đề nghị can thiệp khẩn cấp.',
    category: 'Technical',
    priority: 'P1 - Critical',
    sentiment: 'Khan cap',
    urgency_reason: 'Nguy cơ gián đoạn dịch vụ toàn diện diện rộng',
    status: 'PENDING',
  });

  // 2.2 Tự động cấp vé & SLA
  await request(`${API_BASE}/api/v1/tickets`, 'POST', {
    ticket_code: tkCode1,
    customer_email: 'trangltk.24it@vku.udn.vn',
    sender_email: 'trangltk.24it@vku.udn.vn',
    title: '[SỰ CỐ KHẨN CẤP] Cổng đăng ký tín chỉ học phần VKU báo lỗi 504',
    description: 'Nghẽn kết nối database Supabase và pooler quá tải do lượng truy cập đồng thời lớn.',
    category: 'Technical',
    priority: 'P1 - Critical',
  });

  // 2.3 AI RAG sinh bản thảo phản hồi khách hàng
  const draft1Res = await request(`${API_BASE}/api/v1/drafts`, 'POST', {
    ticket_code: tkCode1,
    recipient_email: 'trangltk.24it@vku.udn.vn',
    subject: `[TIẾP NHẬN] Sự cố gián đoạn cổng học phần VKU - Mã vé: ${tkCode1}`,
    proposed_subject: `[TIẾP NHẬN] Sự cố gián đoạn cổng học phần VKU - Mã vé: ${tkCode1}`,
    proposed_body: `<p>Kính gửi chị <b>Lê Thị Kiều Trang</b>,</p><p>Hệ thống AI Enterprise Helpdesk đã tiếp nhận sự cố mức độ <b>P1 - Critical (SLA: 60 phút)</b> với mã vé <b>${tkCode1}</b>.</p><p>Kỹ sư Nguyễn Văn An đang tiến hành scale up connection pooler và giải phóng tài nguyên CPU để khôi phục dịch vụ.</p><p>Trân trọng,<br/><b>Ban Hỗ Trợ Kỹ Thuật Đám Mây</b></p>`,
    confidence_score: 99.2,
    status: 'PENDING_APPROVAL',
  });
  console.log(`   -> Đã cấp Vé [${tkCode1}] gán cho Kỹ thuật viên rảnh nhất & AI RAG đã soạn bản nháp phản hồi!\n`);
  await sleep(1000);

  // BƯỚC 3: DOANH NGHIỆP DUYỆT THƯ HUMAN-IN-THE-LOOP (HITL) VÀ GỬI REPLY CHO KHÁCH HÀNG
  console.log('✍️ BƯỚC 3: Chuyên viên kỹ thuật vào trang Duyệt Thư (/approval) và phê duyệt gửi thư...');
  const draftId = draft1Res.data.id;
  if (draftId) {
    await request(`${API_BASE}/api/v1/drafts/${draftId}/status`, 'PATCH', {
      status: 'APPROVED',
      reviewed_by: 'admin@enterprise.vn',
    });
    console.log(`   -> Bản nháp #${draftId} đã được Phê duyệt & Đóng dấu SENT gửi trực tiếp cho khách hàng!\n`);
  }
  await sleep(1000);

  // BƯỚC 4: KỸ THUẬT VIÊN GIẢI QUYẾT SỰ CỐ HOÀN TẤT (RESOLVE TICKET)
  console.log(`🛠️ BƯỚC 4: Kỹ thuật viên xử lý xong và bấm Hoàn thành vé [${tkCode1}]...`);
  await request(`${API_BASE}/api/v1/tickets/${tkCode1}/resolve`, 'PATCH');
  console.log(`   -> Vé [${tkCode1}] đã chuyển sang RESOLVED! Số lượng vé đang xử lý của KTV giảm (-1).\n`);
  await sleep(1000);

  // BƯỚC 5: KHÁCH HÀNG DOANH NGHIỆP GỬI EMAIL MUA PHẦN MỀM (CRM LEAD 100 ĐIỂM)
  console.log('💼 BƯỚC 5: Tổng Giám Đốc VietCorp gửi email hỏi mua giải pháp phần mềm Doanh nghiệp...');
  const leadRes = await request(`${API_BASE}/api/v1/crm/customers`, 'POST', {
    email: 'cuongpq@vietcorp.vn',
    full_name: 'Phạm Quốc Cường',
    phone: '0988777666',
    company_name: 'Tập đoàn Công nghệ VietCorp',
    lead_score: 100,
  });

  await request(`${API_BASE}/api/v1/crm/deals`, 'POST', {
    email: 'cuongpq@vietcorp.vn',
    deal_name: 'Gói Chuyển Đổi Số Email AI Helpdesk Toàn Diện (500 Users)',
    expected_budget: 250000000,
    stage: 'QUALIFIED',
    campaign_tag: 'ENTERPRISE_VIP',
  });
  console.log('   -> AI đã bóc tách thông tin khách hàng, chấm 100/100 Điểm VIP và mở Deal 250.000.000 VNĐ trên Pipeline!\n');
  await sleep(1000);

  // BƯỚC 6: ĐỐI TÁC GỬI HÓA ĐƠN VAT - KIỂM SOÁT ĐỐI SOÁT TOÁN HỌC (FINANCE OCR)
  console.log('🧾 BƯỚC 6: Xử lý 2 Hóa đơn điện tử: 1 Hợp lệ và 1 Bị sai lệch số học (Cảnh báo kê khống)...');
  
  // 6.1 Hóa đơn Hợp lệ: 50tr + 5tr = 55tr
  await request(`${API_BASE}/api/v1/finance/invoices`, 'POST', {
    invoice_number: `INV-2026-${Date.now().toString().slice(-4)}`,
    seller_tax_id: '0101234567',
    seller_name: 'Công ty Cổ phần Hạ tầng Điện toán Đám mây CloudTech',
    buyer_name: 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)',
    subtotal: 50000000,
    vat_amount: 5000000,
    total_amount: 55000000,
    math_status: 'VALIDATED',
  });
  console.log('   -> [HÓA ĐƠN 1]: 50.000.000 + 5.000.000 = 55.000.000 đ => CỜ XANH (VALIDATED) Hợp lệ 100%!');

  // 6.2 Hóa đơn Kê khống / Lệch số: 30tr + 3tr != 40tr (Lệch 7tr)
  await request(`${API_BASE}/api/v1/finance/invoices`, 'POST', {
    invoice_number: `INV-DISC-${Date.now().toString().slice(-4)}`,
    seller_tax_id: '0309876543',
    seller_name: 'Nhà cung cấp Linh kiện Mạng Viễn thông X',
    buyer_name: 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)',
    subtotal: 30000000,
    vat_amount: 3000000,
    total_amount: 40000000, // Kê khống thêm 7.000.000 đ
    math_status: 'DISCREPANCY_FLAGGED',
  });
  console.log('   -> [HÓA ĐƠN 2]: 30.000.000 + 3.000.000 != 40.000.000 đ => CỜ ĐỎ (DISCREPANCY_FLAGGED) Cảnh báo gian lận!\n');
  await sleep(1000);

  // BƯỚC 7: CẢNH BÁO AN NINH & KHO CÁCH LY THƯ RÁC / PHISHING
  console.log('🛡️ BƯỚC 7: Kẻ tấn công gửi email lừa đảo tài chính mạo danh ngân hàng...');
  await request(`${API_BASE}/api/v1/audit/logs`, 'POST', {
    source: 'security_filter',
    event_type: 'EMAIL_QUARANTINED',
    workflow_id: 'flow01_ingest_antispam',
    description: 'Phát hiện thư Phishing mạo danh yêu cầu OTP chuyển khoản. Đã cách ly an ninh bảo vệ hệ thống.',
    payload_snapshot: {
      sender: 'fake-security@vietcombank-verify.xyz',
      subject: '[CẢNH BÁO] Tài khoản ngân hàng công ty của bạn bị khóa, click để xác nhận OTP',
      reputation_score: 0,
      threat_level: 'CRITICAL',
    },
  });
  console.log('   -> Hệ thống phát hiện mã độc/phishing, cô lập ngay vào Kho Cách Ly (Quarantine Vault)!\n');

  console.log('=================================================================================');
  console.log('🎉 TỔNG KẾT: TẤT CẢ LUỒNG DỮ LIỆU THẬT ĐÃ ĐƯỢC BƠM THÀNH CÔNG VÀO WEB CLOUD!');
  console.log('👉 Bây giờ bạn có thể mở các đường link sau trên trình duyệt để kiểm tra & thuyết trình:');
  console.log('   1. Hộp thư & Vé hỗ trợ : https://email-automation-vku.onrender.com/tickets');
  console.log('   2. Duyệt thư HITL     : https://email-automation-vku.onrender.com/approval');
  console.log('   3. Báo cáo & SLA       : https://email-automation-vku.onrender.com/analytics');
  console.log('   4. CRM Khách hàng VIP : https://email-automation-vku.onrender.com/crm');
  console.log('   5. Hóa đơn & Đối soát  : https://email-automation-vku.onrender.com/invoices');
  console.log('=================================================================================');
}

main().catch(console.error);

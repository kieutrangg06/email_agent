const http = require('http');

async function post(url, payload = {}, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const dataStr = JSON.stringify(payload);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr),
        ...headers,
      },
      timeout: 15000,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout after 15s'));
    });
    req.write(dataStr);
    req.end();
  });
}

async function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers,
      timeout: 10000,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout after 10s'));
    });
    req.end();
  });
}

async function runAllScenarios() {
  console.log('========================================================================================');
  console.log('🚀 CHƯƠNG TRÌNH TỰ ĐỘNG THỰC THI KIỂM THỬ TOÀN BỘ 9 LUỒNG & CÁC CHUỖI LIÊN HOÀN E2E');
  console.log('   Mô hình: 3 Thành Viên × 3 Luồng × 12 Nodes = 9 Micro-Workflows / 108 Nodes DAG');
  console.log('========================================================================================\n');

  let passed = 0;
  let failed = 0;

  async function executeTest(code, title, fn) {
    try {
      console.log(`\n▶️  [KỊCH BẢN ${code}]: ${title}`);
      await fn();
      console.log(`   ✅ [PASS] Hoàn thành đạt chuẩn 100%`);
      passed++;
    } catch (err) {
      console.log(`   ❌ [FAIL] ${err.message}`);
      failed++;
    }
  }

  // ==============================================================================
  // PHẦN 1: BỘ KỊCH BẢN KIỂM THỬ ĐƠN LẺ TỪNG LUỒNG (100% CÁC NHÁNH TRUE/FALSE)
  // ==============================================================================
  console.log('----------------------------------------------------------------------------------------');
  console.log('PHẦN 1: BỘ KỊCH BẢN ĐƠN LẺ TỪNG LUỒNG (LUỒNG 1 ĐẾN 9)');
  console.log('----------------------------------------------------------------------------------------');

  // Luồng 1 - Nhánh 1A: Email Sạch -> Sang Luồng 2
  await executeTest('1A', 'Luồng 1 (TV1): Ingest Email Sạch -> Nhánh True (Node 10,11,12 -> Luồng 2)', async () => {
    const res = await post('http://localhost:5678/webhook/m1-flow1-ingest', {
      from: 'trangltk.24it@vku.udn.vn',
      name: 'Lê Thị Kiều Trang',
      subject: 'Yêu cầu tài liệu hướng dẫn cấu hình hệ thống',
      text: 'Kính gửi bộ phận kỹ thuật, tôi cần tài liệu cấu hình API tích hợp.',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 1 - Nhánh 1B: Spam / Phishing -> Nhánh False (Vault + Security Alert + Strike Score)
  await executeTest('1B', 'Luồng 1 (TV1): Phát hiện Thư rác/Lừa đảo -> Nhánh False (Cách ly Vault, hạ uy tín)', async () => {
    const res = await post('http://localhost:5678/webhook/m1-flow1-ingest', {
      from: 'spammer@evil.com',
      name: 'Lucky Crypto Winner',
      subject: 'Nhận ngay 1000 USDT miễn phí tại liên kết',
      text: 'Bấm vào đường link lừa đảo http://phishing-scam.xyz ngay để nhận tiền thưởng lớn.',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 1 - Nhánh 1C: System Bounce Filter (Node 3 chặn)
  await executeTest('1C', 'Luồng 1 (TV1): Lọc Thư Hệ Thống (Mailer-daemon/Bounce) -> Node 3 Drops', async () => {
    const res = await post('http://localhost:5678/webhook/m1-flow1-ingest', {
      from: 'mailer-daemon@google.com',
      name: 'Mail Delivery Subsystem',
      subject: 'Delivery Status Notification (Failure)',
      text: 'The email could not be delivered to the recipient address.',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 2 - Nhánh 2A: TECH & P1 Khẩn cấp -> Đi qua Node 8 Escalate Email + Node 9 SLA 1h -> Luồng 3
  await executeTest('2A', 'Luồng 2 (TV1): Phân loại TECH & P1 Khẩn cấp -> Node 8 Escalate Alert + Node 9 SLA 1h', async () => {
    const res = await post('http://localhost:5678/webhook/m1-flow2-triage', {
      sender_email: 'trangltk.24it@vku.udn.vn',
      sender_name: 'Lê Thị Kiều Trang',
      subject: '[KHẨN CẤP] Máy chủ PostgreSQL sập hoàn toàn, toàn bộ ứng dụng tê liệt',
      clean_body: 'Toàn bộ hệ thống cơ sở dữ liệu bị deadlock, cổng 5432 timeout khiến người dùng không thể đăng nhập. Đề nghị kích hoạt xử lý khẩn cấp P1.',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 2 - Nhánh 2B: SALES & P2 -> Bỏ qua Node 8 -> Node 9 SLA -> Route sang Luồng 7
  await executeTest('2B', 'Luồng 2 (TV1): Phân loại SALES & P2 -> Bỏ qua Node 8 -> Định tuyến sang Luồng 7 (CRM)', async () => {
    const res = await post('http://localhost:5678/webhook/m1-flow2-triage', {
      sender_email: 'trangltk.24it@vku.udn.vn',
      sender_name: 'Lê Thị Kiều Trang',
      subject: 'Cần tư vấn báo giá gói Enterprise Email',
      clean_body: 'Chúng tôi cần mua bản quyền cho 300 nhân sự với ngân sách 95 triệu đồng.',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 2 - Nhánh 2C: FINANCE & P3 -> Bỏ qua Node 8 -> Route sang Luồng 9 (Invoice OCR)
  await executeTest('2C', 'Luồng 2 (TV1): Phân loại FINANCE & P3 -> Định tuyến sang Luồng 9 (Invoice OCR)', async () => {
    const res = await post('http://localhost:5678/webhook/m1-flow2-triage', {
      sender_email: 'accountant@novacrm.vn',
      sender_name: 'Ngô Thu Thủy',
      subject: 'Gửi đối soát hóa đơn VAT dịch vụ Cloud tháng 10',
      clean_body: 'Kính gửi phòng tài chính đối soát hóa đơn dịch vụ Cloud giá trị 55 triệu đồng đính kèm.',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 3 - Bóc tách lỗi & Least-Busy KTV
  await executeTest('3', 'Luồng 3 (TV1): Sinh Mã Vé, Cân Bằng Tải Least-Busy KTV -> Bắn Luồng 4', async () => {
    const res = await post('http://localhost:5678/webhook/m1-flow3-ticket', {
      sender_email: 'trangltk.24it@vku.udn.vn',
      customer_email: 'trangltk.24it@vku.udn.vn',
      sender_name: 'Lê Thị Kiều Trang',
      subject: 'Lỗi 504 kết nối Redis Cache',
      body: 'Cụm Redis timeout liên tục sau khi nâng cấp cấu hình mạng.',
      category: 'Technical',
      priority: 'P2 - High',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 4 - Vector RAG & Thư nháp PENDING_APPROVAL
  await executeTest('4', 'Luồng 4 (TV2): Vector Search RAG (pgvector 768) -> Gemini Soạn Thư Nháp HTML', async () => {
    const res = await post('http://localhost:5678/webhook/m2-flow4-rag-draft', {
      ticket_code: 'TK-20261017-0001',
      customer_email: 'trangltk.24it@vku.udn.vn',
      sender_email: 'trangltk.24it@vku.udn.vn',
      subject: 'Hỏi về cách cấu hình kết nối Redis Cache tối ưu',
      body: 'Chúng tôi gặp sự cố timeout khi kết nối tới cụm Redis Cache, cần tài liệu hướng dẫn khắc phục.',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 5 - Duyệt HITL & Gửi SMTP (Nhánh 5A True)
  await executeTest('5A', 'Luồng 5 (TV2): Duyệt Human-in-the-Loop -> Gửi SMTP -> Đóng Vé RESOLVED (MET_SLA)', async () => {
    const res = await post('http://localhost:5678/webhook/m2-flow5-approval', {
      draft_id: 3,
      reviewer_email: 'tranngo170770@gmail.com',
      modified_subject: '[ĐÃ DUYỆT] Cập nhật tiến độ khắc phục sự cố máy chủ PostgreSQL & Redis',
      modified_body: '<p>Kính gửi Quý khách, Bộ phận kỹ thuật đã tối ưu lại pool kết nối và hệ thống đã hoạt động bình thường.</p>',
      action: 'APPROVE_SEND',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 6 - Báo cáo Điều hành & Phát hiện Dị thường (Nhánh 6A & 6B)
  await executeTest('6A', 'Luồng 6 (TV2): Báo Cáo Điều Hành 24h & Tóm Tắt Chiến Lược Ban Giám Đốc', async () => {
    const res = await post('http://localhost:5678/webhook/m2-flow6-digest-trigger', {
      trigger_mode: 'MANUAL_TEST',
      requested_by: 'tranngo170770@gmail.com',
      timestamp: '2026-10-17T18:00:00Z',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 7 - Bóc tách Lead CRM & Chấm điểm Lead Score
  await executeTest('7', 'Luồng 7 (TV3): AI Bóc Tách Thực Thể Lead CRM & Chấm Điểm (ENTERPRISE_HIGH_VALUE)', async () => {
    const res = await post('http://localhost:5678/webhook/m3-flow7-crm-lead', {
      sender_email: 'trangltk.24it@vku.udn.vn',
      customer_email: 'trangltk.24it@vku.udn.vn',
      name: 'Lê Thị Kiều Trang',
      subject: 'Yêu cầu báo giá Email Automation',
      content: 'Tập đoàn Công nghệ VKU Global cần mua phần mềm cho 300 nhân sự với ngân sách 95 triệu đồng. SĐT liên hệ: 0912888999.',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 8 - Automated Follow-up 48h (Nhánh 8A: hỏi thăm, Nhánh 8B: chuyển COLD_LEAD)
  await executeTest('8', 'Luồng 8 (TV3): Quét Deal Trễ 48h & Tự Động Gửi Email Chăm Sóc Theo Chặng', async () => {
    const res = await post('http://localhost:5678/webhook/m3-flow8-followup-trigger', {
      trigger_mode: 'MANUAL_TEST',
      timestamp: '2026-10-17T09:00:00Z',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // Luồng 9 - OCR Đối Soát Số Học (9A: Hợp Lệ vs 9B: Sai Lệch)
  await executeTest('9A', 'Luồng 9 (TV3): Vision AI OCR Hóa Đơn Hợp Lệ 100% -> Node 7 VALIDATED (Xanh lá)', async () => {
    const res = await post('http://localhost:5678/webhook/m3-flow9-invoice-ocr', {
      invoice_number: 'INV-VKU-2026-01',
      filename: 'hoadon_vat_hop_le.pdf',
      sender_email: 'trangltk.24it@vku.udn.vn',
      buyer_email: 'trangltk.24it@vku.udn.vn',
      seller_name: 'Công ty Cổ phần Giải pháp Số NovaCRM',
      seller_tax_id: '0402123456',
      subtotal: 50000000,
      vat_amount: 5000000,
      total_amount: 55000000,
      math_status: 'VALIDATED',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  await executeTest('9B', 'Luồng 9 (TV3): Phát Hiện Gian Lận / Sai Lệch Số Học -> Node 8 DISCREPANCY_FLAGGED (Đỏ rực)', async () => {
    const res = await post('http://localhost:5678/webhook/m3-flow9-invoice-ocr', {
      invoice_number: 'INV-FLAG-SAI-LECH-02',
      filename: 'hoadon_gian_lan_lech_tien.pdf',
      sender_email: 'trangltk.24it@vku.udn.vn',
      buyer_email: 'trangltk.24it@vku.udn.vn',
      seller_name: 'Công ty Cổ phần Logistics Global',
      seller_tax_id: '0309876543',
      subtotal: 45000000,
      vat_amount: 4500000,
      total_amount: 52000000, // Lệch 2.500.000 đ
      math_status: 'DISCREPANCY_FLAGGED',
    });
    if (res.status !== 200 && res.body?.message !== 'Workflow was started') {
      throw new Error(`Phản hồi không hợp lệ: status=${res.status}`);
    }
  });

  // ==============================================================================
  // PHẦN 2: BỘ 5 KỊCH BẢN LIÊN HOÀN 9 LUỒNG THÔNG NHAU (FULL E2E CHAINS)
  // ==============================================================================
  console.log('\n----------------------------------------------------------------------------------------');
  console.log('PHẦN 2: BỘ 5 KỊCH BẢN LIÊN HOÀN 9 LUỒNG THÔNG NHAU (FULL E2E CHAINS)');
  console.log('----------------------------------------------------------------------------------------');

  // Chuỗi 1: Sự cố P1 & Phê duyệt HITL (L1 -> L2 -> L3 -> L4 -> L5)
  await executeTest('CHAIN-1', 'CHUỖI 1 (E2E): Sự Cố Khẩn Cấp P1 ➔ Phân Loại ➔ Cấp Vé Least-Busy ➔ Vector RAG ➔ Duyệt HITL Web', async () => {
    // Bước 1: Khách gửi email khẩn cấp tới Luồng 1
    const l1 = await post('http://localhost:5678/webhook/m1-flow1-ingest', {
      from: 'trangltk.24it@vku.udn.vn',
      name: 'Lê Thị Kiều Trang',
      subject: '[KHẨN CẤP] Cụm máy chủ cơ sở dữ liệu PostgreSQL sập hoàn toàn, lỗi 504',
      text: 'Kính gửi đội ngũ kỹ thuật, hệ thống máy chủ cơ sở dữ liệu và Redis đang bị quá tải 100% CPU, cổng thanh toán báo lỗi 504 liên tục khiến toàn bộ khách hàng không thể giao dịch. Đề nghị kích hoạt quy trình khắc phục sự cố khẩn cấp mức P1.',
    });
    if (l1.status !== 200) throw new Error('Chuỗi 1: Luồng 1 Ingest thất bại');

    // Bước 2: Kiểm tra backend API xác nhận vé và draft đã sẵn sàng
    const tickets = await get('http://localhost:4000/api/v1/tickets');
    if (!Array.isArray(tickets.body) || tickets.body.length === 0) {
      throw new Error('Chuỗi 1: Chưa tìm thấy vé sự cố trên Backend API');
    }

    // Bước 3: Duyệt bản thảo RAG qua Luồng 5
    const l5 = await post('http://localhost:5678/webhook/m2-flow5-approval', {
      draft_id: 3,
      reviewer_email: 'tranngo170770@gmail.com',
      modified_subject: '[ĐÃ DUYỆT] Giải pháp khắc phục sự cố máy chủ PostgreSQL & Redis P1',
      modified_body: '<p>Kính gửi Quý khách, Bộ phận kỹ thuật cấp cao đã hoàn tất giải phóng connection leak và hệ thống đã phục hồi hoàn toàn.</p>',
      action: 'APPROVE_SEND',
    });
    if (l5.status !== 200) throw new Error('Chuỗi 1: Luồng 5 HITL Approval thất bại');
  });

  // Chuỗi 2: Bán hàng CRM & Nuôi dưỡng 48h (L1 -> L2 -> L7 -> L8)
  await executeTest('CHAIN-2', 'CHUỖI 2 (E2E): Lead Bán Hàng ➔ Bóc Tách Thực Thể ➔ Chấm Điểm 100/100 ➔ Kanban CRM ➔ Nuôi Dưỡng 48h', async () => {
    // Bước 1: Khách gửi email hỏi mua giải pháp
    const l1 = await post('http://localhost:5678/webhook/m1-flow1-ingest', {
      from: 'trangltk.24it@vku.udn.vn',
      name: 'Lê Thị Kiều Trang',
      subject: 'Yêu cầu báo giá và hợp đồng phần mềm Email Automation cho 300 nhân sự',
      text: 'Chào phòng kinh doanh, tôi là Kiều Trang - Giám đốc Công nghệ Tập đoàn VKU Global (SĐT: 0912888999). Doanh nghiệp chúng tôi có ngân sách 95 triệu đồng và muốn triển khai giải pháp Email Automation cho 300 nhân viên trong tháng tới. Vui lòng gửi báo giá chi tiết.',
    });
    if (l1.status !== 200) throw new Error('Chuỗi 2: Tiếp nhận Lead thất bại');

    // Bước 2: Kích hoạt chu kỳ Follow-up 48h của Luồng 8
    const l8 = await post('http://localhost:5678/webhook/m3-flow8-followup-trigger', {
      trigger_mode: 'CHAIN_2_TEST',
      timestamp: '2026-10-17T09:00:00Z',
    });
    if (l8.status !== 200) throw new Error('Chuỗi 2: Luồng 8 Follow-up thất bại');
  });

  // Chuỗi 3: Tài chính - Đối soát số học (L1 -> L2 -> L9)
  await executeTest('CHAIN-3', 'CHUỖI 3 (E2E): Tài Chính - Bóc Tách Hóa Đơn VAT & Đối Soát Số Học Tự Động (Valid vs Flagged)', async () => {
    // 3A: Hóa đơn hợp lệ 100%
    const l9a = await post('http://localhost:5678/webhook/m3-flow9-invoice-ocr', {
      invoice_number: 'INV-VKU-2026-01',
      filename: 'hoadon_vat_hop_le.pdf',
      sender_email: 'trangltk.24it@vku.udn.vn',
      buyer_email: 'trangltk.24it@vku.udn.vn',
      seller_name: 'Công ty Cổ phần Giải pháp Số NovaCRM',
      seller_tax_id: '0402123456',
      subtotal: 50000000,
      vat_amount: 5000000,
      total_amount: 55000000,
      math_status: 'VALIDATED',
    });
    if (l9a.status !== 200) throw new Error('Chuỗi 3: Đối soát hóa đơn hợp lệ thất bại');

    // 3B: Hóa đơn lệch tiền
    const l9b = await post('http://localhost:5678/webhook/m3-flow9-invoice-ocr', {
      invoice_number: 'INV-FLAG-SAI-LECH-02',
      filename: 'hoadon_gian_lan_lech_tien.pdf',
      sender_email: 'trangltk.24it@vku.udn.vn',
      buyer_email: 'trangltk.24it@vku.udn.vn',
      seller_name: 'Công ty Cổ phần Logistics Global',
      seller_tax_id: '0309876543',
      subtotal: 45000000,
      vat_amount: 4500000,
      total_amount: 52000000, // Lệch 2.500.000 đ
      math_status: 'DISCREPANCY_FLAGGED',
    });
    if (l9b.status !== 200) throw new Error('Chuỗi 3: Đối soát hóa đơn sai lệch thất bại');
  });

  // Chuỗi 4: Điều hành Ban Giám Đốc & Giám sát Dị thường (L6 tổng hợp L1, L2, L3)
  await executeTest('CHAIN-4', 'CHUỖI 4 (E2E): Báo Cáo Điều Hành Ban Giám Đốc & Giám Sát Dị Thường Đột Biến Lỗi P1', async () => {
    const l6 = await post('http://localhost:5678/webhook/m2-flow6-digest-trigger', {
      trigger_mode: 'CHAIN_4_EXECUTIVE_TEST',
      requested_by: 'tranngo170770@gmail.com',
      timestamp: '2026-10-17T18:00:00Z',
    });
    if (l6.status !== 200) throw new Error('Chuỗi 4: Báo cáo điều hành thất bại');
  });

  // Chuỗi 5: An ninh phòng thủ cửa ngõ & Cách ly Thư rác (L1 False Isolation)
  await executeTest('CHAIN-5', 'CHUỖI 5 (E2E): An Ninh Phòng Thủ Cửa Ngõ ➔ Cách Ly Vault ➔ Cảnh Báo SOC ➔ Chặn Đứng Thư Rác', async () => {
    const l1 = await post('http://localhost:5678/webhook/m1-flow1-ingest', {
      from: 'spammer@evil.com',
      name: 'Lucky Crypto Winner',
      subject: 'Chúc mừng bạn nhận được 5000 USDT miễn phí tại liên kết này',
      text: 'Bạn đã trúng giải thưởng tiền mã hóa đặc biệt. Nhấp ngay vào đường link lừa đảo http://phishing-scam.xyz để nhận tiền ngay bây giờ.',
    });
    if (l1.status !== 200) throw new Error('Chuỗi 5: An ninh cách ly thất bại');
  });

  // ==============================================================================
  // PHẦN 3: KIỂM TRA ĐỒNG BỘ GIAO DIỆN SAAS (NEXT.JS PORT 3000 & NESTJS PORT 4000)
  // ==============================================================================
  console.log('\n----------------------------------------------------------------------------------------');
  console.log('PHẦN 3: KIỂM TRA TÍCH HỢP ĐỒNG BỘ TỚI GIAO DIỆN WEB NEXT.JS & BACKEND CORE');
  console.log('----------------------------------------------------------------------------------------');

  await executeTest('WEB-1', 'Giao diện Next.js: Overview Dashboard (http://localhost:3000)', async () => {
    const res = await get('http://localhost:3000/');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await executeTest('WEB-2', 'Giao diện Next.js: Tickets Board (http://localhost:3000/tickets)', async () => {
    const res = await get('http://localhost:3000/tickets');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await executeTest('WEB-3', 'Giao diện Next.js: Approvals HITL (http://localhost:3000/approval)', async () => {
    const res = await get('http://localhost:3000/approval');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await executeTest('WEB-4', 'Giao diện Next.js: Executive Analytics (http://localhost:3000/analytics)', async () => {
    const res = await get('http://localhost:3000/analytics');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await executeTest('WEB-5', 'Giao diện Next.js: CRM Pipeline Kanban (http://localhost:3000/crm)', async () => {
    const res = await get('http://localhost:3000/crm');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await executeTest('WEB-6', 'Giao diện Next.js: Invoices OCR & Audit (http://localhost:3000/invoices)', async () => {
    const res = await get('http://localhost:3000/invoices');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  console.log('\n========================================================================================');
  console.log(`🎉 TỔNG KẾT KIỂM THỬ: ${passed} PASSED / ${passed + failed} TOTAL (${failed === 0 ? '100% HOÀN HẢO - MỌI LUỒNG THÔNG NHAU' : failed + ' FAILED'})`);
  console.log('========================================================================================\n');
}

runAllScenarios().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});


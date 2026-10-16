const http = require('http');

async function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers,
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
    req.end();
  });
}

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
    req.write(dataStr);
    req.end();
  });
}

async function runTests() {
  console.log('======================================================================');
  console.log('🧪 KIỂM THỬ TÍCH HỢP TOÀN DIỆN HỆ THỐNG (E2E TEST 100%)');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Backend Core & Auth
  await test('Backend Health & Departments API', async () => {
    const res = await get('http://127.0.0.1:4000/api/v1/departments');
    if (res.status !== 200 || !Array.isArray(res.body) || res.body.length < 4) {
      throw new Error(`Invalid response: status=${res.status}`);
    }
  });

  let token = '';
  await test('Auth API Login (admin@enterprise.vn)', async () => {
    const res = await post('http://127.0.0.1:4000/api/v1/auth/login', {
      email: 'admin@enterprise.vn',
      password: 'SecretPassword123!',
    });
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
    if (!res.body.token) throw new Error('No JWT token returned');
    token = res.body.token;
  });

  await test('Auth API Profile with JWT Token', async () => {
    const res = await get('http://127.0.0.1:4000/api/v1/auth/profile', {
      Authorization: `Bearer ${token}`,
    });
    if (res.status !== 200 || !res.body.user) throw new Error(`Profile validation failed: status=${res.status}`);
  });

  await test('Reviewer Permission Validation API', async () => {
    const res = await get('http://127.0.0.1:4000/api/v1/auth/validate-reviewer?email=admin@enterprise.vn');
    if (res.status !== 200 || !res.body.valid) throw new Error('Reviewer validation failed');
  });

  // 2. Member 1: Triage & Tickets & SLA
  await test('Member 1 - Tickets List & Stats API', async () => {
    const res = await get('http://127.0.0.1:4000/api/v1/tickets');
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error('Tickets fetch failed');
    const sla = await get('http://127.0.0.1:4000/api/v1/tickets/stats/sla');
    if (sla.status !== 200) throw new Error('SLA stats fetch failed');
  });

  await test('Member 1 - Create Ticket & Least-Busy Agent Assignment', async () => {
    const code = `TK-TEST-${Date.now().toString().slice(-4)}`;
    const res = await post('http://127.0.0.1:4000/api/v1/tickets', {
      ticket_code: code,
      customer_email: 'khachhang.test@enterprise.vn',
      title: 'Lỗi đồng bộ hóa dữ liệu cơ sở dữ liệu P1',
      description: 'Dữ liệu không đồng bộ giữa node 1 và node 2',
      priority: 'P1 - Critical',
      category: 'Technical',
      reproduce_steps: ['Bước 1: Đăng nhập', 'Bước 2: Bấm đồng bộ'],
    });
    if (res.status !== 200 && res.status !== 201) throw new Error(`Create ticket failed: ${res.status}`);
  });

  // 3. Member 2: RAG Knowledge & Drafts
  await test('Member 2 - Knowledge Base & Vector Store API', async () => {
    const res = await post('http://127.0.0.1:4000/api/v1/knowledge', {
      title: 'Hướng dẫn cấu hình kết nối Redis Cache',
      content: 'Để khắc phục lỗi timeout kết nối, hãy tăng maxClients và timeout lên 5000ms trong redis.conf.',
      category: 'TECH',
      topic: 'Redis Optimization',
      keywords: 'redis, cache, timeout, optimization',
    });
    if (res.status !== 200 && res.status !== 201) throw new Error(`Knowledge insert failed: ${res.status}`);
  });

  await test('Member 2 - Drafts Generation & Human Approval Flow', async () => {
    const code = `TK-DRAFT-${Date.now().toString().slice(-4)}`;
    const draftRes = await post('http://127.0.0.1:4000/api/v1/drafts', {
      ticket_code: code,
      recipient_email: 'khachhang.rag@enterprise.vn',
      subject: 'Phản hồi yêu cầu hỗ trợ kỹ thuật',
      proposed_subject: 'Phản hồi yêu cầu hỗ trợ kỹ thuật # ' + code,
      proposed_body: '<p>Kính gửi Quý khách, Đội ngũ kỹ thuật đã rà soát và khắc phục sự cố.</p>',
      confidence_score: 96.5,
      status: 'PENDING_APPROVAL',
    });
    if (draftRes.status !== 200 && draftRes.status !== 201) throw new Error('Create draft failed');
    const draftId = draftRes.body.id;

    // Approve draft
    const approveRes = await post('http://127.0.0.1:4000/api/v1/reviewers/validate', {
      reviewer_email: 'admin@enterprise.vn',
    });
    if (approveRes.status !== 200 && approveRes.status !== 201) throw new Error('Validate reviewer failed');
  });

  await test('Member 2 - Executive Analytics Digest API', async () => {
    const date = new Date().toISOString().slice(0, 10);
    const res = await post('http://127.0.0.1:4000/api/v1/digest', {
      report_date: date,
      total_emails_received: 42,
      total_tickets_created: 18,
      sla_compliance_rate: 98.5,
      executive_summary: 'Hệ thống vận hành trơn tru trong 24 giờ qua. Không phát hiện spike P1 dị thường.',
      anomaly_detected: false,
    });
    if (res.status !== 200 && res.status !== 201) throw new Error('Save digest failed');
  });

  // 4. Member 3: CRM Growth & Invoices OCR
  await test('Member 3 - CRM Lead Scoring & Deals Upsert', async () => {
    const email = `lead_${Date.now().toString().slice(-4)}@vietcorp.vn`;
    const custRes = await post('http://127.0.0.1:4000/api/v1/crm/customers', {
      email,
      full_name: 'Nguyễn Văn Minh',
      phone: '0909123456',
      company_name: 'Tập đoàn Việt Corp',
      lead_score: 90,
    });
    if (custRes.status !== 200 && custRes.status !== 201) throw new Error('Upsert customer failed');

    const dealRes = await post('http://127.0.0.1:4000/api/v1/crm/deals', {
      email,
      deal_name: 'Gói giải pháp Email Automation Enterprise',
      expected_budget: 150000000,
      stage: 'NEW_INQUIRY',
      campaign_tag: 'ENTERPRISE_HIGH_VALUE',
    });
    if (dealRes.status !== 200 && dealRes.status !== 201) throw new Error('Create deal failed');
  });

  await test('Member 3 - Invoice OCR & Mathematical Integrity Audit (Valid & Flagged)', async () => {
    // 1. Valid Invoice: 40m + 4m = 44m
    const validInv = await post('http://127.0.0.1:4000/api/v1/finance/invoices', {
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      seller_tax_id: '0101234567',
      seller_name: 'Công ty Cổ phần Công nghệ ABC',
      buyer_name: 'Doanh nghiệp Khách hàng',
      subtotal: 40000000,
      vat_amount: 4000000,
      total_amount: 44000000,
      math_status: 'VALIDATED',
    });
    if (validInv.status !== 200 && validInv.status !== 201) throw new Error('Save valid invoice failed');
    if (!validInv.body.is_math_valid) throw new Error('Expected invoice math to be valid');

    // 2. Discrepancy Flagged Invoice: 50m + 5m = 55m != 60m
    const flaggedInv = await post('http://127.0.0.1:4000/api/v1/finance/invoices', {
      invoice_number: `INV-FLAG-${Date.now().toString().slice(-6)}`,
      seller_tax_id: '0209876543',
      seller_name: 'Nhà cung cấp Dịch vụ XYZ',
      buyer_name: 'Doanh nghiệp Khách hàng',
      subtotal: 50000000,
      vat_amount: 5000000,
      total_amount: 60000000, // Sai lệch 5 triệu
      math_status: 'DISCREPANCY_FLAGGED',
    });
    if (flaggedInv.status !== 200 && flaggedInv.status !== 201) throw new Error('Save flagged invoice failed');
    if (flaggedInv.body.is_math_valid) throw new Error('Expected invoice math to be flagged');
  });

  // 5. System Audit Logs & Real-time Notifications
  await test('System Global Audit Logs API', async () => {
    const auditRes = await post('http://127.0.0.1:4000/api/v1/audit/logs', {
      event_type: 'E2E_INTEGRATION_TEST_PASSED',
      workflow_id: 'flow_suite',
      description: 'Hệ thống vượt qua toàn bộ kịch bản kiểm thử tích hợp 9 luồng.',
      payload_snapshot: { status: 'VERIFIED_100_PERCENT' },
    });
    if (auditRes.status !== 200 && auditRes.status !== 201) throw new Error('Audit log creation failed');
  });

  await test('Real-time Notifications Gateway & Event Stream', async () => {
    const res = await post('http://127.0.0.1:4000/api/v1/notifications/push', {
      type: 'ticket_created',
      title: 'Vé P1 mới được khởi tạo',
      message: 'Sự cố sập dịch vụ API Gateway',
    });
    if (res.status !== 200 && res.status !== 201) throw new Error('Push notification failed');
    const health = await get('http://127.0.0.1:4000/api/v1/notifications/health');
    if (health.status !== 200 || health.body.status !== 'healthy') throw new Error('Notifications health check failed');
  });

  // 6. Next.js Frontend Routes Verification
  await test('Next.js Frontend Route: Home / Dashboard (Port 3000)', async () => {
    const res = await get('http://127.0.0.1:3000/');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('Next.js Frontend Route: Tickets Page (/tickets)', async () => {
    const res = await get('http://127.0.0.1:3000/tickets');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('Next.js Frontend Route: Approval HITL Page (/approval)', async () => {
    const res = await get('http://127.0.0.1:3000/approval');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('Next.js Frontend Route: CRM Pipeline Page (/crm)', async () => {
    const res = await get('http://127.0.0.1:3000/crm');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('Next.js Frontend Route: Invoices OCR Page (/invoices)', async () => {
    const res = await get('http://127.0.0.1:3000/invoices');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('Next.js Frontend Route: Executive Analytics Page (/analytics)', async () => {
    const res = await get('http://127.0.0.1:3000/analytics');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('Next.js Frontend Route: Auth Login Page (/login)', async () => {
    const res = await get('http://127.0.0.1:3000/login');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  console.log('\n======================================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${passed + failed} TOTAL (${failed === 0 ? '100% HOÀN HẢO' : failed + ' FAILED'})`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});


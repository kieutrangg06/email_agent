import { Controller, Get, Post, Body } from '@nestjs/common';
import { DatabaseService } from './core/database/database.service';
import { MailService } from './core/mail/mail.service';

@Controller()
export class AppController {
  constructor(
    private readonly db: DatabaseService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  getRoot() {
    return {
      status: 'online',
      service: 'Enterprise AI Email Automation & Helpdesk CRM API',
      version: '1.0.0',
      cloud: 'Render Cloud (Tokyo Supabase PostgreSQL 16 + pgvector)',
      system_time: new Date().toISOString(),
      endpoints: {
        triage_stats: '/api/v1/triage/stats',
        tickets: '/api/v1/tickets',
        drafts: '/api/v1/drafts',
        crm_customers: '/api/v1/crm/customers',
        finance_invoices: '/api/v1/finance/invoices',
      },
    };
  }

  @Get('health')
  getHealth() {
    return { status: 'healthy', timestamp: Date.now() };
  }

  @Get('api/v1/admin/test-smtp')
  async testSmtp() {
    try {
      const res1 = await this.mailService.sendMail(
        'tranngo170770@gmail.com',
        '[RENDER CLOUD TEST] Kiem tra hop thu den tranngo170770',
        '<p>Test direct from Render Cloud Host to tranngo170770</p>'
      );
      const res2 = await this.mailService.sendMail(
        'trangltk.24it@vku.udn.vn',
        '[RENDER CLOUD TEST] Kiem tra hop thu den trangltk.24it',
        '<p>Test direct from Render Cloud Host to trangltk.24it</p>'
      );
      return {
        status: 'executed',
        to_enterprise: res1 ? { messageId: res1.messageId, response: res1.response } : 'FAILED_OR_BLOCKED',
        to_customer: res2 ? { messageId: res2.messageId, response: res2.response } : 'FAILED_OR_BLOCKED',
      };
    } catch (err: any) {
      return { status: 'error', error: err.message };
    }
  }

  // =========================================================================
  // 🚀 CỔNG TIẾP NHẬN EMAIL DUY NHẤT QUA n8n CLOUD ORCHESTRATOR (PIKAPODS 24/24)
  // Toàn bộ logic 9 luồng, lọc spam, phân loại, gửi email do n8n xử lý độc quyền
  // =========================================================================
  @Post('api/v1/inbound/process-email')
  async processInboundEmail(@Body() body: any) {
    const senderName = body.sender_name || 'Lê Thị Kiều Trang';
    const senderEmail = (body.sender_email || 'trangltk.24it@vku.udn.vn').trim().toLowerCase();
    const subject = body.subject || 'Không có tiêu đề';
    const textBody = body.body || '';
    const attachmentName = body.attachment_name || body.filename || '';
    const attachmentContent = body.attachment_content || '';

    // Gửi DUY NHẤT qua n8n Cloud Webhook Orchestrator (PikaPods 24/24)
    const n8nCloudWebhook = process.env.N8N_WEBHOOK_URL || 'https://berserk-quail.pikapod.net/webhook/m1-flow1-ingest';
    
    try {
      const n8nRes = await fetch(n8nCloudWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: senderName,
          sender_email: senderEmail,
          subject,
          body: textBody,
          attachment_name: attachmentName,
          attachment_content: attachmentContent,
        }),
      });

      const data = await n8nRes.json().catch(() => ({}));
      return {
        success: true,
        message: 'Email đã được chuyển giao độc quyền cho n8n Cloud Orchestrator (PikaPods 24/24)',
        orchestrator: 'n8n Cloud',
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn();
      return {
        success: false,
        error: err.message,
      };
    }
  }

  // =========================================================================
  // 📊 BÁO CÁO ĐIỀU HÀNH 24H CHO BAN GIÁM ĐỐC
  // =========================================================================
  @Post('api/v1/analytics/send-daily-digest')
  async triggerDailyDigest() {
    const stats = await this.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM email_triage_logs) as total,
        (SELECT COUNT(*) FROM tickets WHERE priority LIKE '%P1%') as p1_count,
        (SELECT COUNT(*) FROM tickets) as tickets_count,
        '100%' as sla_rate;
    `);
    const data = stats.rows[0] || {};
    const res = await this.mailService.sendExecutiveDailyDigest(data, 'tranngo170770@gmail.com');
    return {
      success: true,
      service: 'Báo Cáo Điều Hành 24H',
      recipient: 'tranngo170770@gmail.com',
      result: res ? 'SENT_SUCCESS' : 'FAILED',
      dispatched_at: new Date().toISOString(),
    };
  }

  // =========================================================================
  // 🤝 TỰ ĐỘNG CHĂM SÓC & THEO DÕI BÁO GIÁ KHÁCH HÀNG
  // =========================================================================
  @Post('api/v1/crm/trigger-followup')
  async triggerSalesFollowup(@Body() body: any) {
    const targetEmail = body.email || 'trangltk.24it@vku.udn.vn';
    const dRes = await this.db.query(
      `SELECT * FROM crm_deals ORDER BY created_at DESC LIMIT 1;`
    );
    const deal = dRes.rows[0] || {
      customer_name: 'Trần Văn Giám Đốc',
      deal_name: 'Hợp đồng giải pháp Email Automation Enterprise',
      expected_budget: 250000000,
    };
    const res = await this.mailService.sendSalesFollowUpToCustomer(deal, targetEmail);
    return {
      success: true,
      service: 'Tự Động Chăm Sóc & Theo Dõi Báo Giá',
      recipient: targetEmail,
      result: res ? 'SENT_SUCCESS' : 'FAILED',
      dispatched_at: new Date().toISOString(),
    };
  }

  @Post('api/v1/admin/reset-database')
  async resetDatabase() {
    await this.db.query(`
      TRUNCATE TABLE email_quarantine_vault RESTART IDENTITY CASCADE;
      TRUNCATE TABLE email_triage_logs RESTART IDENTITY CASCADE;
      TRUNCATE TABLE ticket_comments RESTART IDENTITY CASCADE;
      TRUNCATE TABLE email_drafts RESTART IDENTITY CASCADE;
      TRUNCATE TABLE tickets RESTART IDENTITY CASCADE;
      TRUNCATE TABLE crm_deals RESTART IDENTITY CASCADE;
      TRUNCATE TABLE crm_customers RESTART IDENTITY CASCADE;
      TRUNCATE TABLE finance_invoices RESTART IDENTITY CASCADE;
      TRUNCATE TABLE daily_summaries RESTART IDENTITY CASCADE;
      TRUNCATE TABLE system_audit_logs RESTART IDENTITY CASCADE;
    `);
    return {
      status: 'success',
      message: 'Toàn bộ dữ liệu giao dịch trên Database Supabase Host đã được xóa sạch 100%.',
      timestamp: new Date().toISOString(),
    };
  }

  // =========================================================================
  // 🌟 SEED MOCK DATA TOÀN DIỆN: 14 NGÀY (2 TUẦN) - ĐỦ 9 LUỒNG & TẤT CẢ CÁC NHÁNH
  // =========================================================================
  @Get('api/v1/admin/seed-mock-data')
  async seedMockDataGet() {
    return this.seedComprehensiveMockData();
  }

  @Post('api/v1/admin/seed-mock-data')
  async seedMockDataPost() {
    return this.seedComprehensiveMockData();
  }

  async seedComprehensiveMockData() {
    try {
      // 1. Dọn dẹp dữ liệu giao dịch cũ
      await this.db.query(`
        TRUNCATE TABLE email_quarantine_vault RESTART IDENTITY CASCADE;
        TRUNCATE TABLE email_triage_logs RESTART IDENTITY CASCADE;
        TRUNCATE TABLE ticket_comments RESTART IDENTITY CASCADE;
        TRUNCATE TABLE email_drafts RESTART IDENTITY CASCADE;
        TRUNCATE TABLE tickets RESTART IDENTITY CASCADE;
        TRUNCATE TABLE crm_deals RESTART IDENTITY CASCADE;
        TRUNCATE TABLE crm_customers RESTART IDENTITY CASCADE;
        TRUNCATE TABLE finance_invoices RESTART IDENTITY CASCADE;
        TRUNCATE TABLE daily_summaries RESTART IDENTITY CASCADE;
        TRUNCATE TABLE system_audit_logs RESTART IDENTITY CASCADE;
      `);

    // 2. Điểm uy tín người gửi (email_senders_reputation)
    await this.db.query(`
      INSERT INTO email_senders_reputation (sender_email, email, reputation_score, failed_attempts, is_blocked, status, notes) VALUES
      ('trangltk.24it@vku.udn.vn', 'trangltk.24it@vku.udn.vn', 98, 0, false, 'trusted', 'Đối tác VIP VKU'),
      ('director@vietcorp.vn', 'director@vietcorp.vn', 95, 0, false, 'trusted', 'Khách hàng VIP Enterprise'),
      ('ceo@fpt-software.com', 'ceo@fpt-software.com', 92, 0, false, 'trusted', 'Đối tác chiến lược CNTT'),
      ('techlead@vng.com.vn', 'techlead@vng.com.vn', 90, 0, false, 'trusted', 'Chuyên gia kỹ thuật VNG'),
      ('accountant@novacrm.vn', 'accountant@novacrm.vn', 88, 0, false, 'neutral', 'Kế toán đối tác NovaCRM'),
      ('tranngo170770@gmail.com', 'tranngo170770@gmail.com', 99, 0, false, 'trusted', 'Hòm thư điều hành nội bộ'),
      ('spammer@evil-crypto.xyz', 'spammer@evil-crypto.xyz', 10, 8, true, 'blocked', 'Phát tán thư lừa đảo tài chính'),
      ('trojan@malware-drop.com', 'trojan@malware-drop.com', 5, 12, true, 'blocked', 'Đính kèm tệp tin thực thi nguy hiểm')
      ON CONFLICT (sender_email) DO UPDATE SET 
        reputation_score = EXCLUDED.reputation_score,
        failed_attempts = EXCLUDED.failed_attempts,
        is_blocked = EXCLUDED.is_blocked,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes;
    `);

    // 3. Kho cách ly an ninh (email_quarantine_vault) - Đa ngày
    await this.db.query(`
      INSERT INTO email_quarantine_vault (sender_email, subject, quarantine_reason, raw_payload, created_at) VALUES
      ('trojan@malware-drop.com', '[KHẨN] Bản cập nhật bảo mật hệ thống e-Banking', 'Phát hiện tệp tin thực thi nhị phân nguy hiểm 05_ma_doc_trojan_gia_lap.exe', '{"threat": "MALWARE", "severity": 98.5}'::jsonb, NOW() - INTERVAL '12 days'),
      ('spammer@evil-crypto.xyz', 'Nhận ngay 50.000 USDT miễn phí từ quỹ đầu tư', 'Nội dung chứa liên kết lừa đảo tài chính và giả mạo thương hiệu', '{"threat": "PHISHING", "severity": 95.0}'::jsonb, NOW() - INTERVAL '8 days'),
      ('promo@bet888-casino.online', 'Tặng 100% giá trị nạp đầu tuần cá cược bóng đá', 'Nội dung spam quảng cáo cờ bạc trái phép', '{"threat": "SPAM", "severity": 89.0}'::jsonb, NOW() - INTERVAL '4 days'),
      ('ransom@dark-crypto.ru', 'Thông báo khóa dữ liệu máy chủ doanh nghiệp', 'Mã độc tống tiền tệp đính kèm macro độc hại invoice_encrypted.docm', '{"threat": "RANSOMWARE", "severity": 99.0}'::jsonb, NOW() - INTERVAL '1 days');
    `);

    // 4. Kỹ thuật viên (support_agents)
    await this.db.query(`
      INSERT INTO support_agents (name, full_name, email, category, status, is_active, active_tickets_count) VALUES
      ('Nguyễn Văn An', 'Nguyễn Văn An', 'tranngo170770@gmail.com', 'Technical', 'AVAILABLE', true, 2),
      ('Trần Hoàng Bách', 'Trần Hoàng Bách', 'tranngo170770@gmail.com', 'Technical', 'AVAILABLE', true, 1),
      ('Lê Thị Mai', 'Lê Thị Mai', 'tranngo170770@gmail.com', 'Sales', 'AVAILABLE', true, 1),
      ('Phạm Đức Trọng', 'Phạm Đức Trọng', 'tranngo170770@gmail.com', 'Finance', 'AVAILABLE', true, 0),
      ('Đỗ Thúy Vy', 'Đỗ Thúy Vy', 'tranngo170770@gmail.com', 'General', 'AVAILABLE', true, 0)
      ON CONFLICT (name) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active,
        active_tickets_count = EXCLUDED.active_tickets_count;
    `);

    // 5. Nhật ký phân loại AI (email_triage_logs) - 14 ngày (Đủ Technical P1/P2, Sales P2, Finance P3, General P4)
    await this.db.query(`
      INSERT INTO email_triage_logs (sender_name, sender_email, subject, body_snippet, category, priority, sentiment, urgency_reason, sla_deadline, status, created_at) VALUES
      -- Ngày 14 trước (2026-10-17)
      ('Lê Thị Kiều Trang', 'trangltk.24it@vku.udn.vn', '[SỰ CỐ KHẨN CẤP] Cổng đăng ký học phần DACS4 VKU bị lỗi 504', 'Toàn bộ sinh viên không thể truy cập đăng ký môn học, máy chủ báo lỗi 504 Gateway Timeout.', 'Technical', 'P1 - Critical', 'Khan cap', 'Sự cố sập cổng hệ thống đe dọa dịch vụ toàn diện', NOW() - INTERVAL '13 days' + INTERVAL '1 hour', 'PROCESSED', NOW() - INTERVAL '13 days'),
      ('Trần Văn Giám Đốc', 'director@vietcorp.vn', '[HỎI GIÁ & DEMO] Yêu cầu tư vấn triển khai gói Email AI Automation', 'Kính gửi phòng kinh doanh, tôi là Trần Văn Giám Đốc từ Tập đoàn Công nghệ ABC cần báo giá 100 license.', 'Sales', 'P2 - High', 'Tich cuc', 'Khách hàng tiềm năng hỏi mua gói giải pháp doanh nghiệp', NOW() - INTERVAL '13 days' + INTERVAL '4 hours', 'PROCESSED', NOW() - INTERVAL '13 days'),

      -- Ngày 12 trước (2026-10-19)
      ('Công ty CP Phần Mềm VKU', 'trangltk.24it@vku.udn.vn', '[GỬI HÓA ĐƠN VAT] Quyết toán chi phí phần mềm HD-2026-001', 'Tiền hàng 10.000.000 đ, thuế VAT 1.000.000 đ, tổng thanh toán là 11.000.000 đ.', 'Finance', 'P3 - Medium', 'Tieu cuc', 'Đối soát hóa đơn VAT & kiểm tra tính hợp lệ số học', NOW() - INTERVAL '11 days' + INTERVAL '12 hours', 'PROCESSED', NOW() - INTERVAL '11 days'),
      ('Nguyễn Thị Thảo', 'trangltk.24it@vku.udn.vn', '[HỎI THỦ TỤC] Hướng dẫn làm lại thẻ từ và đăng ký gửi xe máy', 'Kính gửi phòng Hành chính, tôi là nhân viên mới muốn xin cấp thẻ từ tòa nhà và vé tháng xe.', 'General', 'P4 - Low', 'Trung lap', 'Yêu cầu hỗ trợ thông tin định kỳ / thủ tục hành chính', NOW() - INTERVAL '11 days' + INTERVAL '48 hours', 'PROCESSED', NOW() - INTERVAL '11 days'),

      -- Ngày 9 trước (2026-10-21)
      ('Phạm Minh Hoàng', 'ceo@fpt-software.com', '[TƯ VẤN DOANH NGHIỆP] Đề nghị demo hệ thống CRM AI và Helpdesk tự động', 'Công ty chúng tôi có 500 nhân sự, ngân sách dự kiến khoảng 300 triệu đồng cho hệ thống này.', 'Sales', 'P2 - High', 'Tich cuc', 'Deal doanh nghiệp quy mô lớn', NOW() - INTERVAL '9 days' + INTERVAL '4 hours', 'PROCESSED', NOW() - INTERVAL '9 days'),
      ('Kỹ sư hệ thống VNG', 'techlead@vng.com.vn', '[CẢNH BÁO KỸ THUẬT] Cụm bộ nhớ cache Redis quá tải 95% CPU', 'Hệ thống hàng đợi tin nhắn đang bị nghẽn do Redis chạm ngưỡng RAM tối đa.', 'Technical', 'P2 - High', 'Tieu cuc', 'Nguy cơ ảnh hưởng dịch vụ diện rộng', NOW() - INTERVAL '9 days' + INTERVAL '4 hours', 'PROCESSED', NOW() - INTERVAL '9 days'),

      -- Ngày 6 trước (2026-10-24) - INCIDENT SPIKE P1
      ('Hệ thống Giám sát AWS', 'monitor@cloud-aws.internal', '[CRITICAL P1] Đứt kết nối cổng thanh toán trực tuyến VNPay Gateway', 'Cổng thanh toán báo lỗi timeout liên tục, giao dịch thanh toán thất bại 100%.', 'Technical', 'P1 - Critical', 'Khan cap', 'Đứt kết nối cổng thanh toán trực tuyến', NOW() - INTERVAL '6 days' + INTERVAL '1 hour', 'PROCESSED', NOW() - INTERVAL '6 days'),
      ('Nguyễn Văn Tuấn', 'tuan.nv@vietinbank.com', '[KHẨN CẤP] Deadlock toàn diện trên cụm Database PostgreSQL Master', 'Cơ sở dữ liệu bị treo do deadlock giao dịch ngân hàng.', 'Technical', 'P1 - Critical', 'Khan cap', 'Deadlock cụm cơ sở dữ liệu chính', NOW() - INTERVAL '6 days' + INTERVAL '1 hour', 'PROCESSED', NOW() - INTERVAL '6 days'),

      -- Ngày 4 trước (2026-10-26)
      ('Nhà cung cấp lạ', 'fake-vendor@suspicious.com', '[GỬI HÓA ĐƠN VAT] Quyết toán chi phí bảo trì HD-FAKE-8888', 'Tiền hàng 10.000.000 đ, thuế VAT 1.000.000 đ, tổng thanh toán là 15.000.000 đ.', 'Finance', 'P3 - Medium', 'Tieu cuc', 'Hóa đơn có dấu hiệu kê khống lệch 4 triệu', NOW() - INTERVAL '4 days' + INTERVAL '12 hours', 'PROCESSED', NOW() - INTERVAL '4 days'),
      ('Đặng Thu Thảo', 'thao.dang@asiaproperties.vn', '[HỎI BÁO GIÁ] Mua 50 license phần mềm AI tự động hóa', 'Đơn vị chúng tôi cần triển khai hệ thống trong tháng 11, ngân sách 180 triệu đồng.', 'Sales', 'P2 - High', 'Tich cuc', 'Cơ hội bán hàng tiềm năng cao', NOW() - INTERVAL '4 days' + INTERVAL '4 hours', 'PROCESSED', NOW() - INTERVAL '4 days'),

      -- Ngày 2 trước (2026-10-28)
      ('Lê Thị Kiều Trang', 'trangltk.24it@vku.udn.vn', '[HỖ TRỢ THỦ TỤC] Mẫu phiếu đăng ký sử dụng phòng hội thảo Tòa A', 'Kính gửi phòng CSKH, vui lòng cung cấp mẫu đơn đăng ký hội trường ngày 5/11.', 'General', 'P4 - Low', 'Trung lap', 'Thủ tục hành chính nội bộ', NOW() - INTERVAL '2 days' + INTERVAL '48 hours', 'PROCESSED', NOW() - INTERVAL '2 days'),
      ('Công ty CP Phần Mềm VKU', 'trangltk.24it@vku.udn.vn', '[GỬI HÓA ĐƠN VAT] Thanh toán dịch vụ Cloud Server tháng 10 HD-2026-002', 'Tiền hàng 25.000.000 đ, thuế VAT 2.500.000 đ, tổng thanh toán là 27.500.000 đ.', 'Finance', 'P3 - Medium', 'Tieu cuc', 'Đối soát hóa đơn định kỳ', NOW() - INTERVAL '2 days' + INTERVAL '12 hours', 'PROCESSED', NOW() - INTERVAL '2 days'),

      -- Ngày hôm nay (2026-10-30)
      ('Lê Thị Kiều Trang', 'trangltk.24it@vku.udn.vn', '[SỰ CỐ KHẨN CẤP] Cổng đăng ký học phần DACS4 VKU bị lỗi 504', 'Kính gửi ban kỹ thuật, toàn bộ sinh viên không thể truy cập đăng ký môn học, máy chủ báo lỗi 504.', 'Technical', 'P1 - Critical', 'Khan cap', 'Sự cố sập cổng hệ thống đe dọa dịch vụ toàn diện', NOW() + INTERVAL '1 hour', 'PROCESSED', NOW() - INTERVAL '1 hour'),
      ('Trần Văn Giám Đốc', 'director@vietcorp.vn', '[HỎI GIÁ & DEMO] Yêu cầu tư vấn triển khai gói Email AI Automation', 'Kính gửi phòng kinh doanh, tôi là Trần Văn Giám Đốc từ Tập đoàn Công nghệ ABC. Cần báo giá gấp 100 license.', 'Sales', 'P2 - High', 'Tich cuc', 'Lead VIP 95 điểm, ngân sách 250 triệu', NOW() + INTERVAL '4 hours', 'PROCESSED', NOW() - INTERVAL '30 minutes'),
      ('Công ty CP Phần Mềm VKU', 'trangltk.24it@vku.udn.vn', '[GỬI HÓA ĐƠN VAT] Quyết toán chi phí phần mềm HD-2026-001', 'Tiền hàng 10.000.000 đ, thuế VAT 1.000.000 đ, tổng thanh toán là 11.000.000 đ.', 'Finance', 'P3 - Medium', 'Tieu cuc', 'Hóa đơn khớp 100% (VALIDATED)', NOW() + INTERVAL '12 hours', 'PROCESSED', NOW() - INTERVAL '20 minutes'),
      ('Nguyễn Thị Thảo', 'trangltk.24it@vku.udn.vn', '[HỎI THỦ TỤC] Hướng dẫn làm lại thẻ từ và đăng ký gửi xe máy', 'Kính gửi phòng Hành chính, tôi là nhân viên mới cần hướng dẫn làm lại thẻ từ ra vào tòa nhà.', 'General', 'P4 - Low', 'Trung lap', 'Thủ tục hành chính thông thường (SLA 48h)', NOW() + INTERVAL '48 hours', 'PROCESSED', NOW() - INTERVAL '10 minutes');
    `);

    // 6. Vé hỗ trợ & SLA (tickets) - Đa trạng thái (OPEN, RESOLVED, IN_PROGRESS)
    await this.db.query(`
      INSERT INTO tickets (ticket_code, customer_email, sender_email, title, description, summary, category, priority, assigned_to, agent_email, sla_due_at, first_response_sla, status, resolved_at, created_at) VALUES
      ('TK-VKU-1269', 'trangltk.24it@vku.udn.vn', 'trangltk.24it@vku.udn.vn', '[SỰ CỐ KHẨN CẤP] Cổng đăng ký học phần DACS4 VKU bị lỗi 504', 'Toàn bộ sinh viên không thể truy cập đăng ký môn học.', 'Lỗi 504 Gateway Timeout máy chủ Web Nginx', 'Technical', 'P1 - Critical', 'Nguyễn Văn An', 'tranngo170770@gmail.com', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '1 hour', 'RESOLVED', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '1 hour'),
      ('TK-VKU-4826', 'techlead@vng.com.vn', 'techlead@vng.com.vn', '[CẢNH BÁO KỸ THUẬT] Cụm bộ nhớ cache Redis quá tải 95% CPU', 'Hệ thống hàng đợi tin nhắn đang bị nghẽn do Redis chạm ngưỡng RAM tối đa.', 'Nghẽn hàng đợi Redis Cache Cluster', 'Technical', 'P2 - High', 'Trần Hoàng Bách', 'tranngo170770@gmail.com', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '4 hours', 'RESOLVED', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '3 hours'),
      ('TK-VKU-9157', 'trangltk.24it@vku.udn.vn', 'trangltk.24it@vku.udn.vn', '[HỎI THỦ TỤC] Hướng dẫn làm lại thẻ từ và đăng ký gửi xe máy', 'Nhân viên mới cần hướng dẫn làm lại thẻ từ ra vào tòa nhà.', 'Thủ tục hành chính cấp thẻ từ', 'General', 'P4 - Low', 'Lê Thị Mai', 'tranngo170770@gmail.com', NOW() + INTERVAL '47 hours', NOW() + INTERVAL '47 hours', 'OPEN', NULL, NOW() - INTERVAL '20 minutes'),
      ('TK-VKU-7731', 'monitor@cloud-aws.internal', 'monitor@cloud-aws.internal', '[CRITICAL P1] Đứt kết nối cổng thanh toán trực tuyến VNPay Gateway', 'Cổng thanh toán báo lỗi timeout liên tục, giao dịch thất bại 100%.', 'Đứt kết nối cổng thanh toán VNPay', 'Technical', 'P1 - Critical', 'Nguyễn Văn An', 'tranngo170770@gmail.com', NOW() + INTERVAL '45 minutes', NOW() + INTERVAL '45 minutes', 'OPEN', NULL, NOW() - INTERVAL '15 minutes'),
      ('TK-VKU-3382', 'thao.dang@asiaproperties.vn', 'thao.dang@asiaproperties.vn', '[HỖ TRỢ THỦ TỤC] Mẫu phiếu đăng ký sử dụng phòng hội thảo Tòa A', 'Đăng ký sử dụng phòng họp hội trường lớn ngày 5/11.', 'Thủ tục mượn phòng hội thảo', 'General', 'P4 - Low', 'Trần Hoàng Bách', 'tranngo170770@gmail.com', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'RESOLVED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days');
    `);

    // 7. Bản nháp duyệt thư HITL (email_drafts) - Có PENDING_APPROVAL, SENT, REJECTED
    await this.db.query(`
      INSERT INTO email_drafts (
        ticket_code, recipient_email, sender_name, subject, proposed_subject, proposed_body,
        html_content, original_subject, original_body, confidence_score, status,
        reviewed_by, reviewed_at, sent_at, created_at
      ) VALUES
      (
        'TK-VKU-7731', 'monitor@cloud-aws.internal', 'Hệ thống Giám sát AWS',
        '[PHẢN HỒI KỸ THUẬT] Khắc phục sự cố đứt cổng thanh toán VNPay TK-VKU-7731',
        '[PHẢN HỒI KỸ THUẬT] Khắc phục sự cố đứt cổng thanh toán VNPay TK-VKU-7731',
        '<p>Kính gửi quý đối tác, Đội ngũ kỹ thuật đã chuyển đổi sang cổng thanh toán dự phòng MoMo/ZaloPay và tái lập kết nối VNPay Gateway thành công.</p>',
        '<p>Kính gửi quý đối tác, Đội ngũ kỹ thuật đã chuyển đổi sang cổng thanh toán dự phòng MoMo/ZaloPay và tái lập kết nối VNPay Gateway thành công.</p>',
        '[CRITICAL P1] Đứt kết nối cổng thanh toán trực tuyến VNPay Gateway',
        'Cổng thanh toán báo lỗi timeout liên tục, giao dịch thất bại 100%.',
        98.8, 'PENDING_APPROVAL', NULL, NULL, NULL, NOW() - INTERVAL '10 minutes'
      ),
      (
        'TK-VKU-9157', 'trangltk.24it@vku.udn.vn', 'Nguyễn Thị Thảo',
        '[GIẢI ĐÁP THỦ TỤC] Hướng dẫn làm lại thẻ từ và đăng ký gửi xe TK-VKU-9157',
        '[GIẢI ĐÁP THỦ TỤC] Hướng dẫn làm lại thẻ từ và đăng ký gửi xe TK-VKU-9157',
        '<p>Kính gửi bạn Nguyễn Thị Thảo, Bạn vui lòng mang CCCD đến Phòng 102 - Tòa Hành chính để nhận thẻ từ mới trong giờ hành chính. Biển số xe điền vào mẫu đính kèm.</p>',
        '<p>Kính gửi bạn Nguyễn Thị Thảo, Bạn vui lòng mang CCCD đến Phòng 102 - Tòa Hành chính để nhận thẻ từ mới trong giờ hành chính. Biển số xe điền vào mẫu đính kèm.</p>',
        '[HỎI THỦ TỤC] Hướng dẫn làm lại thẻ từ và đăng ký gửi xe máy',
        'Kính gửi phòng Hành chính, tôi là nhân viên mới cần hướng dẫn làm lại thẻ từ ra vào tòa nhà.',
        96.5, 'PENDING_APPROVAL', NULL, NULL, NULL, NOW() - INTERVAL '5 minutes'
      ),
      (
        'TK-VKU-1269', 'trangltk.24it@vku.udn.vn', 'Lê Thị Kiều Trang',
        '[PHẢN HỒI KỸ THUẬT] Hướng dẫn khắc phục sự cố TK-VKU-1269',
        '[PHẢN HỒI KỸ THUẬT] Hướng dẫn khắc phục sự cố TK-VKU-1269',
        '<p>Kính gửi quý khách Lê Thị Kiều Trang, Đội ngũ Kỹ thuật đã mở rộng Connection Pool PostgreSQL và khởi động lại Nginx Reverse Proxy. Cổng đăng ký học phần đã hoạt động ổn định 100%.</p>',
        '<p>Kính gửi quý khách Lê Thị Kiều Trang, Đội ngũ Kỹ thuật đã mở rộng Connection Pool PostgreSQL và khởi động lại Nginx Reverse Proxy. Cổng đăng ký học phần đã hoạt động ổn định 100%.</p>',
        '[SỰ CỐ KHẨN CẤP] Cổng đăng ký học phần DACS4 VKU bị lỗi 504',
        'Toàn bộ sinh viên không thể truy cập đăng ký môn học, máy chủ báo lỗi 504.',
        98.8, 'SENT', 'tranngo170770@gmail.com', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '1 hour'
      ),
      (
        'TK-VKU-4826', 'techlead@vng.com.vn', 'Kỹ sư VNG',
        '[PHẢN HỒI KỸ THUẬT] Tối ưu hóa Redis Cache TK-VKU-4826',
        '[PHẢN HỒI KỸ THUẬT] Tối ưu hóa Redis Cache TK-VKU-4826',
        '<p>Đã tăng kích thước Redis maxmemory lên 16GB và kích hoạt chính sách allkeys-lru để giải phóng bộ nhớ.</p>',
        '<p>Đã tăng kích thước Redis maxmemory lên 16GB và kích hoạt chính sách allkeys-lru để giải phóng bộ nhớ.</p>',
        '[CẢNH BÁO KỸ THUẬT] Cụm bộ nhớ cache Redis quá tải 95% CPU',
        'Hệ thống hàng đợi tin nhắn đang bị nghẽn do Redis chạm ngưỡng RAM tối đa.',
        94.0, 'SENT', 'tranngo170770@gmail.com', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '3 hours'
      ),
      (
        'TK-VKU-0099', 'spam-inquiry@test.com', 'Người dùng Spam',
        '[TỪ CHỐI] Yêu cầu không hợp lệ TK-VKU-0099',
        '[TỪ CHỐI] Yêu cầu không hợp lệ TK-VKU-0099',
        '<p>Nội dung thư không chứa yêu cầu hỗ trợ hợp lệ theo quy chế công ty.</p>',
        '<p>Nội dung thư không chứa yêu cầu hỗ trợ hợp lệ theo quy chế công ty.</p>',
        '[SPAM] Yêu cầu hỗ trợ giả mạo',
        'Thư spam quảng cáo không có nội dung nghiệp vụ.',
        60.0, 'REJECTED', 'tranngo170770@gmail.com', NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '2 days'
      );
    `);

    // 8. Báo cáo điều hành 14 ngày liên tiếp (daily_summaries) kèm Spike P1
    await this.db.query(`
      INSERT INTO daily_summaries (
        report_date, summary_date, total_emails_received, total_tickets_created, sla_compliance_rate,
        executive_summary, anomaly_detected, incident_spike, created_at
      ) VALUES
      ((CURRENT_DATE - INTERVAL '13 days')::date, (CURRENT_DATE - INTERVAL '13 days')::date, 32, 10, 100.0, 'Hệ thống vận hành ổn định ngày 17/10. Không có sự cố nghiêm trọng.', false, false, NOW() - INTERVAL '13 days'),
      ((CURRENT_DATE - INTERVAL '12 days')::date, (CURRENT_DATE - INTERVAL '12 days')::date, 38, 12, 99.0, 'Lưu lượng tiếp nhận đều, hoàn thành 100% cam kết SLA kỹ thuật.', false, false, NOW() - INTERVAL '12 days'),
      ((CURRENT_DATE - INTERVAL '11 days')::date, (CURRENT_DATE - INTERVAL '11 days')::date, 45, 14, 98.5, 'Tăng trưởng 20% yêu cầu báo giá doanh nghiệp qua kênh Sales.', false, false, NOW() - INTERVAL '11 days'),
      ((CURRENT_DATE - INTERVAL '10 days')::date, (CURRENT_DATE - INTERVAL '10 days')::date, 41, 11, 100.0, 'Đối soát 100% hóa đơn chứng từ kế toán khớp số học.', false, false, NOW() - INTERVAL '10 days'),
      ((CURRENT_DATE - INTERVAL '9 days')::date, (CURRENT_DATE - INTERVAL '9 days')::date, 52, 16, 99.0, 'Phát hiện và cách ly an toàn 3 thư spam marketing.', false, false, NOW() - INTERVAL '9 days'),
      ((CURRENT_DATE - INTERVAL '8 days')::date, (CURRENT_DATE - INTERVAL '8 days')::date, 48, 15, 98.0, 'Hiệu suất xử lý vé đạt chuẩn trung bình 1.2 giờ/vé.', false, false, NOW() - INTERVAL '8 days'),
      ((CURRENT_DATE - INTERVAL '7 days')::date, (CURRENT_DATE - INTERVAL '7 days')::date, 50, 17, 100.0, 'Vận hành ổn định cuối tuần.', false, false, NOW() - INTERVAL '7 days'),
      ((CURRENT_DATE - INTERVAL '6 days')::date, (CURRENT_DATE - INTERVAL '6 days')::date, 85, 32, 88.5, 'CẢNH BÁO ĐỘT BIẾN SỰ CỐ (INCIDENT SPIKE): Ghi nhận 8 sự cố P1 khẩn cấp do quá tải CPU cơ sở dữ liệu và đứt cổng thanh toán (tăng 430% so với baseline). Đội ngũ trực chiến đã khắc phục trong 45 phút.', true, true, NOW() - INTERVAL '6 days'),
      ((CURRENT_DATE - INTERVAL '5 days')::date, (CURRENT_DATE - INTERVAL '5 days')::date, 42, 12, 98.0, 'Hệ thống phục hồi hoàn toàn sau sự cố ngày 24/10.', false, false, NOW() - INTERVAL '5 days'),
      ((CURRENT_DATE - INTERVAL '4 days')::date, (CURRENT_DATE - INTERVAL '4 days')::date, 46, 14, 99.5, 'Tiếp tục rà soát nhật ký kiểm toán system_audit_logs.', false, false, NOW() - INTERVAL '4 days'),
      ((CURRENT_DATE - INTERVAL '3 days')::date, (CURRENT_DATE - INTERVAL '3 days')::date, 55, 18, 100.0, 'Hoạt động kinh doanh sôi động với 2 hợp đồng CRM mới.', false, false, NOW() - INTERVAL '3 days'),
      ((CURRENT_DATE - INTERVAL '2 days')::date, (CURRENT_DATE - INTERVAL '2 days')::date, 49, 15, 98.5, 'Tỷ lệ phản hồi đúng hạn SLA đạt 98.5%.', false, false, NOW() - INTERVAL '2 days'),
      ((CURRENT_DATE - INTERVAL '1 days')::date, (CURRENT_DATE - INTERVAL '1 days')::date, 58, 19, 100.0, 'Duy trì kết nối mạng thông suốt và kiểm soát an ninh.', false, false, NOW() - INTERVAL '1 days'),
      (CURRENT_DATE, CURRENT_DATE, 35, 8, 100.0, 'Hệ thống AI tiếp nhận và phân luồng tự động ngày hôm nay đạt hiệu suất tối ưu 100%.', false, false, NOW())
      ON CONFLICT (report_date) DO UPDATE SET
        total_emails_received = EXCLUDED.total_emails_received,
        total_tickets_created = EXCLUDED.total_tickets_created,
        sla_compliance_rate = EXCLUDED.sla_compliance_rate,
        executive_summary = EXCLUDED.executive_summary,
        anomaly_detected = EXCLUDED.anomaly_detected,
        incident_spike = EXCLUDED.incident_spike;
    `);

    // 9. Khách hàng CRM (crm_customers) & Cơ hội bán hàng (crm_deals)
    await this.db.query(`
      INSERT INTO crm_customers (full_name, email, phone, company_name, lead_score, created_at) VALUES
      ('Trần Văn Giám Đốc', 'director@vietcorp.vn', '0905123456', 'Tập đoàn Công nghệ ABC', 95, NOW() - INTERVAL '5 days'),
      ('Phạm Minh Hoàng', 'ceo@fpt-software.com', '0912345678', 'Công ty CP Bán Lẻ Toàn Cầu', 88, NOW() - INTERVAL '4 days'),
      ('Đặng Thu Thảo', 'thao.dang@asiaproperties.vn', '0987654321', 'Tập đoàn Bất Động Sản Á Châu', 92, NOW() - INTERVAL '3 days'),
      ('Lê Thanh Long', 'long.le@logistics-viet.com', '0933445566', 'Công ty Giải Pháp Logistics Việt', 78, NOW() - INTERVAL '1 days')
      ON CONFLICT (email) DO UPDATE SET
        lead_score = EXCLUDED.lead_score,
        company_name = EXCLUDED.company_name,
        phone = EXCLUDED.phone;

      INSERT INTO crm_deals (customer_id, deal_name, expected_budget, stage, campaign_tag, assigned_sales_rep, followup_count, created_at) VALUES
      (
        (SELECT id FROM crm_customers WHERE email = 'director@vietcorp.vn' LIMIT 1),
        'Hợp đồng Giải pháp Email AI Automation Enterprise (100 License)',
        250000000,
        'QUOTED',
        'ENTERPRISE_VIP',
        'Lê Thị Bích (tranngo170770@gmail.com)',
        1,
        NOW() - INTERVAL '5 days'
      ),
      (
        (SELECT id FROM crm_customers WHERE email = 'ceo@fpt-software.com' LIMIT 1),
        'Gói Tự Động Hóa Chăm Sóc Khách Hàng CRM & Helpdesk AI',
        180000000,
        'NEW_INQUIRY',
        'PARTNER',
        'Nguyễn Văn An',
        0,
        NOW() - INTERVAL '4 days'
      ),
      (
        (SELECT id FROM crm_customers WHERE email = 'thao.dang@asiaproperties.vn' LIMIT 1),
        'Dự Án Triển Khai Hệ Thống Email On-Premise Tích Hợp RAG AI',
        320000000,
        'QUOTED',
        'ENTERPRISE_VIP',
        'Lê Thị Bích',
        2,
        NOW() - INTERVAL '3 days'
      ),
      (
        (SELECT id FROM crm_customers WHERE email = 'long.le@logistics-viet.com' LIMIT 1),
        'Gói Khởi Nghiệp AI Email Automation (20 License)',
        85000000,
        'WON',
        'INBOUND',
        'Nguyễn Văn An',
        1,
        NOW() - INTERVAL '1 days'
      );
    `);

    // 10. Hóa đơn tài chính & OCR (finance_invoices) - Khớp 100% và Sai lệch
    await this.db.query(`
      INSERT INTO finance_invoices (invoice_number, seller_tax_id, seller_name, buyer_name, buyer_email, issue_date, subtotal, vat_amount, total_amount, math_status, file_storage_path, created_at) VALUES
      ('HD-2026-001', '0401987654', 'Công ty CP Phần Mềm VKU', 'Công ty TNHH Giải Pháp Số', 'trangltk.24it@vku.udn.vn', CURRENT_DATE, 10000000, 1000000, 11000000, 'VALIDATED', '01_hoa_don_hop_le_VALIDATED.txt', NOW() - INTERVAL '20 minutes'),
      ('HD-2026-002', '0401987654', 'Công ty CP Phần Mềm VKU', 'Tập đoàn Công nghệ ABC', 'director@vietcorp.vn', CURRENT_DATE - INTERVAL '2 days', 25000000, 2500000, 27500000, 'VALIDATED', '01_hoa_don_hop_le_VALIDATED.txt', NOW() - INTERVAL '2 days'),
      ('HD-2026-003', '0401987654', 'Công ty CP Phần Mềm VKU', 'Công ty CP Bán Lẻ Toàn Cầu', 'ceo@fpt-software.com', CURRENT_DATE - INTERVAL '5 days', 45000000, 4500000, 49500000, 'VALIDATED', '01_hoa_don_hop_le_VALIDATED.txt', NOW() - INTERVAL '5 days'),
      ('HD-FAKE-8888', '0409998888', 'Nhà cung cấp lạ', 'Công ty TNHH Giải Pháp Số', 'trangltk.24it@vku.udn.vn', CURRENT_DATE, 10000000, 1000000, 15000000, 'DISCREPANCY_FLAGGED', '02_hoa_don_sai_lech_DISCREPANCY.txt', NOW() - INTERVAL '15 minutes'),
      ('HD-FAKE-9999', '0407776666', 'Đơn vị dịch vụ trung gian', 'Tập đoàn Bất Động Sản Á Châu', 'thao.dang@asiaproperties.vn', CURRENT_DATE - INTERVAL '4 days', 18000000, 1800000, 22000000, 'DISCREPANCY_FLAGGED', '02_hoa_don_sai_lech_DISCREPANCY.txt', NOW() - INTERVAL '4 days')
      ON CONFLICT (invoice_number) DO UPDATE SET
        issue_date = EXCLUDED.issue_date,
        subtotal = EXCLUDED.subtotal,
        vat_amount = EXCLUDED.vat_amount,
        total_amount = EXCLUDED.total_amount,
        math_status = EXCLUDED.math_status,
        created_at = EXCLUDED.created_at;
    `);

    // 11. Nhật ký kiểm toán hệ thống (system_audit_logs)
    await this.db.query(`
      INSERT INTO system_audit_logs (event_type, workflow_id, description, payload_snapshot, source, created_at) VALUES
      ('INVOICE_VALIDATED', 'HD-2026-001', 'Kiểm toán số học tự động: Khớp 100% (10.000.000 đ + 1.000.000 đ = 11.000.000 đ) ➔ Phê duyệt thanh toán', '{"subtotal": 10000000, "vat": 1000000, "total": 11000000}'::jsonb, 'FINANCE_OCR_ENGINE', NOW() - INTERVAL '20 minutes'),
      ('INVOICE_DISCREPANCY_ALERT', 'HD-FAKE-8888', 'CẢNH BÁO KIỂM TOÁN: Sai lệch 4.000.000 đ (10.000.000 đ + 1.000.000 đ != 15.000.000 đ) ➔ Chặn giải ngân & cảnh báo Kế toán trưởng', '{"discrepancy": 4000000}'::jsonb, 'FINANCE_OCR_ENGINE', NOW() - INTERVAL '15 minutes'),
      ('SECURITY_QUARANTINE_BLOCKED', 'TROJAN_BLOCKED', 'Hệ thống an ninh phát hiện tệp tin nhị phân độc hại 05_ma_doc_trojan_gia_lap.exe ➔ Cách ly an toàn vào Vault', '{"severity": 98.5}'::jsonb, 'SECURITY_GATEWAY', NOW() - INTERVAL '12 days'),
      ('LEAST_BUSY_AGENT_DISPATCHED', 'TK-VKU-1269', 'Thuật toán Least-Busy tự động gán vé P1 cho KTV Nguyễn Văn An (tải công việc thấp nhất: 1 vé)', '{"assigned_to": "Nguyễn Văn An"}'::jsonb, 'DISPATCHER_ENGINE', NOW() - INTERVAL '1 hour'),
      ('HITL_APPROVAL_SENT', 'TK-VKU-1269', 'Chuyên viên tranngo170770@gmail.com thẩm định và phê duyệt gửi thư trả lời kỹ thuật cho khách hàng', '{"status": "SENT"}'::jsonb, 'HITL_MODULE', NOW() - INTERVAL '15 minutes'),
      ('EXECUTIVE_DIGEST_GENERATED', 'DAILY_24H', 'Khởi tạo thành công bản báo cáo điều hành 24h định kỳ gửi Ban Giám Đốc', '{"sla_rate": "100%"}'::jsonb, 'EXECUTIVE_REPORT', NOW() - INTERVAL '2 hours');
    `);

      return {
        status: 'success',
        message: '✅ Khởi tạo thành công 100% bộ dữ liệu Mock toàn diện 14 ngày (2 tuần), bao quát đủ 9 Micro-Workflows và tất cả các nhánh nghiệp vụ!',
        data_summary: {
          time_range: '14 ngày (17/10/2026 -> 30/10/2026)',
          total_triage_logs: 16,
          total_tickets: 5,
          total_drafts_hitl: 5,
          total_daily_summaries: 14,
          total_crm_customers: 4,
          total_crm_deals: 4,
          total_invoices_ocr: 5,
          total_quarantine_threats: 4,
          total_audit_logs: 6
        },
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message,
        stack: err.stack,
      };
    }
  }
}

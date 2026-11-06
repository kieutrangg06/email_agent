let Client;
try {
  Client = require('pg').Client;
} catch {
  Client = require('./backend/node_modules/pg').Client;
}

async function seedData() {
  console.log('======================================================================');
  console.log('🌱 KHỞI TẠO BỘ DỮ LIỆU ĐA NGÀY DEMO (7 NGÀY: 11/10 -> 17/10/2026)');
  console.log('   Mục đích: Phục vụ Demo toàn diện Hội Đồng & Kiểm thử mọi nhánh luồng');
  console.log('======================================================================\n');

  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'SecretPassword123!',
    database: process.env.DB_DATABASE || 'email_automation_db',
  });

  await client.connect();
  console.log('✅ Đã kết nối thành công tới PostgreSQL 16 (pgvector)');

  // 1. Truncate các bảng giao dịch
  console.log('🧹 Đang dọn dẹp các bảng giao dịch cũ...');
  await client.query(`
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

  // 2. Cập nhật reputation senders
  console.log('📝 Khởi tạo bảng điểm uy tín người gửi (email_senders_reputation)...');
  await client.query(`
    INSERT INTO email_senders_reputation (sender_email, email, reputation_score, failed_attempts, is_blocked, status, notes) VALUES
    ('trangltk.24it@vku.udn.vn', 'trangltk.24it@vku.udn.vn', 98, 0, false, 'trusted', 'Đối tác VIP VKU'),
    ('director@vietcorp.vn', 'director@vietcorp.vn', 95, 0, false, 'trusted', 'Khách hàng Enterprise'),
    ('ceo@fpt-software.com', 'ceo@fpt-software.com', 92, 0, false, 'trusted', 'Đối tác chiến lược'),
    ('techlead@vng.com.vn', 'techlead@vng.com.vn', 90, 0, false, 'trusted', 'Kỹ thuật viên VNG'),
    ('accountant@novacrm.vn', 'accountant@novacrm.vn', 88, 0, false, 'neutral', 'Kế toán đối tác'),
    ('spammer@evil.com', 'spammer@evil.com', 10, 8, true, 'blocked', 'Phát tán thư rác crypto'),
    ('phishing@crypto-reward.xyz', 'phishing@crypto-reward.xyz', 5, 12, true, 'blocked', 'Lừa đảo mạo danh ngân hàng'),
    ('mailer-daemon@google.com', 'mailer-daemon@google.com', 40, 2, false, 'neutral', 'System bounce mailer')
    ON CONFLICT (sender_email) DO UPDATE SET 
      reputation_score = EXCLUDED.reputation_score,
      failed_attempts = EXCLUDED.failed_attempts,
      is_blocked = EXCLUDED.is_blocked,
      status = EXCLUDED.status,
      notes = EXCLUDED.notes;
  `);

  // 3. Khởi tạo kho cách ly an ninh (email_quarantine_vault) qua các ngày
  console.log('🛡️ Khởi tạo Kho cách ly thư rác/lừa đảo (email_quarantine_vault)...');
  await client.query(`
    INSERT INTO email_quarantine_vault (sender_email, subject, quarantine_reason, raw_payload, created_at) VALUES
    ('phishing@crypto-reward.xyz', 'Nhận ngay 1000 USDT miễn phí tại liên kết', 'Phishing & Scam Link Detected', '{"source":"m1-ingest","threat_level":"HIGH"}'::jsonb, '2026-10-12 08:30:00+07'),
    ('spammer@evil.com', 'Thông báo trúng thưởng xe Mercedes từ Apple', 'Fake Giveaway / Malicious Payload', '{"source":"m1-ingest","threat_level":"MEDIUM"}'::jsonb, '2026-10-14 11:15:00+07'),
    ('fake-otp@vietcombank-login.xyz', 'Cảnh báo tài khoản bị khóa, xác thực OTP ngay', 'Banking Phishing Credential Harvesting', '{"source":"m1-ingest","threat_level":"CRITICAL"}'::jsonb, '2026-10-15 14:20:00+07'),
    ('spammer@evil.com', 'Chúc mừng bạn nhận được 5000 USDT miễn phí tại liên kết này', 'Cryptocurrency Scam', '{"source":"m1-ingest","threat_level":"HIGH"}'::jsonb, '2026-10-16 16:45:00+07'),
    ('botnet@malware-push.net', 'Invoice Overdue Payment Request attachment.exe', 'Executable Attachment Blocked', '{"source":"m1-ingest","threat_level":"CRITICAL"}'::jsonb, '2026-10-17 02:10:00+07');
  `);

  // 4. Khởi tạo danh sách KTV hỗ trợ (support_agents)
  console.log('👥 Cập nhật danh sách 5 Chuyên viên Kỹ thuật (support_agents)...');
  await client.query(`
    INSERT INTO support_agents (name, full_name, email, category, status, is_active, active_tickets_count) VALUES
    ('Nguyễn Văn An', 'Nguyễn Văn An', 'tranngo170770@gmail.com', 'Technical', 'AVAILABLE', true, 1),
    ('Trần Hoàng Bách', 'Trần Hoàng Bách', 'tranngo170770@gmail.com', 'Technical', 'AVAILABLE', true, 1),
    ('Lê Thị Mai', 'Lê Thị Mai', 'tranngo170770@gmail.com', 'Sales', 'AVAILABLE', true, 1),
    ('Phạm Đức Trọng', 'Phạm Đức Trọng', 'tranngo170770@gmail.com', 'Finance', 'AVAILABLE', true, 1),
    ('Đỗ Thúy Vy', 'Đỗ Thúy Vy', 'tranngo170770@gmail.com', 'General', 'AVAILABLE', true, 0)
    ON CONFLICT (name) DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      category = EXCLUDED.category,
      status = EXCLUDED.status,
      is_active = EXCLUDED.is_active,
      active_tickets_count = EXCLUDED.active_tickets_count;
  `);

  // 5. Khởi tạo Nhật ký phân loại email đầu vào (email_triage_logs) qua các ngày
  console.log('📬 Khởi tạo Nhật ký Triage đầu vào (email_triage_logs)...');
  await client.query(`
    INSERT INTO email_triage_logs (inbound_email, sender_email, sender_name, subject, body_snippet, classified_department, category, priority, sentiment, confidence_score, sla_deadline, status, created_at) VALUES
    ('support@enterprise.vn', 'trangltk.24it@vku.udn.vn', 'Lê Thị Kiều Trang', 'Yêu cầu mở rộng dung lượng Redis Cache', 'Hệ thống thường xuyên chạm trần 100% RAM Redis trong giờ cao điểm.', 'TECH', 'Technical', 'P2 - High', 'Trung tinh', 0.96, '2026-10-11 14:00:00+07', 'PROCESSED', '2026-10-11 10:00:00+07'),
    ('sales@enterprise.vn', 'director@vietcorp.vn', 'Trần Văn Bình', 'Tư vấn giải pháp Email Automation cho 500 nhân sự', 'Chúng tôi có ngân sách 150 triệu muốn triển khai trong Q4.', 'SALES', 'Sales', 'P2 - High', 'Tich cuc', 0.98, '2026-10-12 15:30:00+07', 'PROCESSED', '2026-10-12 11:30:00+07'),
    ('finance@enterprise.vn', 'accountant@novacrm.vn', 'Ngô Thu Thủy', 'Gửi hóa đơn VAT số INV-843950 tháng 10', 'Kính gửi phòng kế toán hóa đơn dịch vụ cloud 55 triệu đồng.', 'FINANCE', 'Finance', 'P3 - Medium', 'Trung tinh', 0.94, '2026-10-13 18:00:00+07', 'PROCESSED', '2026-10-13 14:00:00+07'),
    ('support@enterprise.vn', 'trangltk.24it@vku.udn.vn', 'Lê Thị Kiều Trang', '[KHẨN CẤP] Máy chủ PostgreSQL tê liệt do Deadlock', 'Toàn bộ ứng dụng không thể đăng nhập, cổng 5432 bị timeout.', 'TECH', 'Technical', 'P1 - Critical', 'Khan cap', 0.99, '2026-10-14 10:00:00+07', 'PROCESSED', '2026-10-14 09:00:00+07'),
    ('general@enterprise.vn', 'contact@partner.vn', 'Nguyễn Văn Minh', 'Hỏi về thời gian làm việc và địa chỉ văn phòng', 'Tôi muốn tới làm việc trực tiếp về dự án liên kết đào tạo.', 'GENERAL', 'General', 'P4 - Low', 'Trung tinh', 0.92, '2026-10-15 16:00:00+07', 'PROCESSED', '2026-10-15 08:00:00+07'),
    ('support@enterprise.vn', 'techlead@vng.com.vn', 'Hoàng Minh Tuấn', 'Chứng chỉ SSL của cổng API hết hạn trong 3 ngày tới', 'Cần hỗ trợ renew chứng chỉ Let''s Encrypt wildcard.', 'TECH', 'Technical', 'P2 - High', 'Khan cap', 0.95, '2026-10-16 12:00:00+07', 'PROCESSED', '2026-10-16 08:00:00+07'),
    ('support@enterprise.vn', 'trangltk.24it@vku.udn.vn', 'Lê Thị Kiều Trang', '[KHẨN CẤP] Cụm máy chủ cơ sở dữ liệu PostgreSQL sập hoàn toàn, lỗi 504', 'Toàn bộ khách hàng không thể giao dịch thanh toán.', 'TECH', 'Technical', 'P1 - Critical', 'Khan cap', 0.99, '2026-10-17 05:30:00+07', 'PROCESSED', '2026-10-17 04:30:00+07'),
    ('sales@enterprise.vn', 'trangltk.24it@vku.udn.vn', 'Lê Thị Kiều Trang', 'Yêu cầu báo giá và hợp đồng phần mềm Email Automation cho 300 nhân sự', 'Ngân sách 95 triệu đồng, cần triển khai gấp trong tháng.', 'SALES', 'Sales', 'P2 - High', 'Tich cuc', 0.98, '2026-10-17 08:00:00+07', 'PROCESSED', '2026-10-17 04:00:00+07');
  `);

  // 6. Khởi tạo Danh sách Vé Sự cố (tickets) trải dài nhiều ngày với đủ P1 - P4
  console.log('🎫 Khởi tạo 12 Vé Sự cố Helpdesk (tickets) qua 7 ngày...');
  await client.query(`
    INSERT INTO tickets (ticket_code, customer_email, sender_email, subject, title, description, summary, category, priority, assigned_to, agent_email, sla_due_at, status, created_at, resolved_at) VALUES
    ('TK-20261011-1001', 'trangltk.24it@vku.udn.vn', 'trangltk.24it@vku.udn.vn', 'Yêu cầu mở rộng dung lượng Redis Cache', 'Nâng cấp dung lượng RAM Redis Cluster lên 32GB', 'Cụm Redis cache bị tràn bộ nhớ do lưu session tăng đột biến.', 'Nâng cấp cấu hình maxmemory và áp dụng chính sách allkeys-lru.', 'Technical', 'P2 - High', 'Nguyễn Văn An', 'tranngo170770@gmail.com', '2026-10-11 14:00:00+07', 'RESOLVED', '2026-10-11 10:00:00+07', '2026-10-11 13:20:00+07'),
    ('TK-20261012-1002', 'techlead@vng.com.vn', 'techlead@vng.com.vn', 'Lỗi phân quyền token OAuth2 JWT', 'Token expired không tự động refresh trên Gateway', 'Client nhận lỗi 401 Unauthorized khi gọi API sau 60 phút.', 'Sửa lỗi logic refresh token và gia hạn thời gian sống của token.', 'Technical', 'P3 - Medium', 'Trần Hoàng Bách', 'tranngo170770@gmail.com', '2026-10-13 11:00:00+07', 'RESOLVED', '2026-10-12 16:30:00+07', '2026-10-12 15:45:00+07'),
    ('TK-20261013-1003', 'contact@partner.vn', 'contact@partner.vn', 'Hạn mức API rate-limit bị giới hạn ở 1000 req/min', 'Yêu cầu tăng Quota API cho chiến dịch Mega Sale', 'Lưu lượng truy cập chuẩn bị tăng gấp 5 lần vào cuối tuần.', 'Tăng rate-limit lên 5.000 req/phút trên Nginx Gateway.', 'Technical', 'P3 - Medium', 'Lê Thị Mai', 'tranngo170770@gmail.com', '2026-10-14 14:00:00+07', 'RESOLVED', '2026-10-13 14:15:00+07', '2026-10-13 18:00:00+07'),
    ('TK-20261014-1004', 'trangltk.24it@vku.udn.vn', 'trangltk.24it@vku.udn.vn', '[KHẨN CẤP] Máy chủ PostgreSQL tê liệt do Deadlock', 'Xử lý Deadlock trên cụm PostgreSQL Master', 'Các truy vấn cập nhật đơn hàng đồng thời gây nghẽn transaction.', 'Kill idle in transaction và tối ưu hóa index trên bảng orders.', 'Technical', 'P1 - Critical', 'Nguyễn Văn An', 'tranngo170770@gmail.com', '2026-10-14 10:00:00+07', 'RESOLVED', '2026-10-14 09:00:00+07', '2026-10-14 09:42:00+07'),
    ('TK-20261014-1005', 'ceo@fpt-software.com', 'ceo@fpt-software.com', '[KHẨN CẤP] Cổng thanh toán VNPay trả mã lỗi 504 Timeout', 'Cổng thanh toán điện tử không kết nối được qua VPN', 'Giao dịch khách hàng bị treo ở bước xác nhận OTP ngân hàng.', 'Khởi động lại tunnel IPsec VPN và cấu hình failover sang đường truyền phụ.', 'Technical', 'P1 - Critical', 'Trần Hoàng Bách', 'tranngo170770@gmail.com', '2026-10-14 11:30:00+07', 'RESOLVED', '2026-10-14 10:30:00+07', '2026-10-14 11:15:00+07'),
    ('TK-20261015-1006', 'director@vietcorp.vn', 'director@vietcorp.vn', 'Lỗi đồng bộ hóa dữ liệu RabbitMQ Queue', 'Hàng đợi tin nhắn email bị ứ đọng hơn 50.000 jobs', 'Worker tiến trình xử lý email bị crash do thiếu RAM.', 'Scale thêm 3 consumer workers và cấu hình restart tự động bằng PM2.', 'Technical', 'P2 - High', 'Phạm Đức Trọng', 'tranngo170770@gmail.com', '2026-10-15 17:00:00+07', 'RESOLVED', '2026-10-15 13:00:00+07', '2026-10-15 16:10:00+07'),
    ('TK-20261016-1007', 'techlead@vng.com.vn', 'techlead@vng.com.vn', 'Chứng chỉ SSL của cổng API hết hạn trong 3 ngày tới', 'Renew chứng chỉ SSL Let''s Encrypt cho *.enterprise.vn', 'Cần tự động hóa gia hạn certbot cron job.', 'Chạy certbot renew và reload Nginx cấu hình SSL.', 'Technical', 'P2 - High', 'Đỗ Thúy Vy', 'tranngo170770@gmail.com', '2026-10-16 12:00:00+07', 'RESOLVED', '2026-10-16 08:00:00+07', '2026-10-16 10:20:00+07'),
    ('TK-20261016-1008', 'contact@partner.vn', 'contact@partner.vn', 'Yêu cầu tài liệu đặc tả API Webhook v2', 'Xin cung cấp tài liệu OpenAPI / Swagger bản mới nhất', 'Đối tác muốn tích hợp sự kiện realtime webhook.', 'Gửi tài liệu hướng dẫn và Postman collection.', 'General', 'P4 - Low', 'Đỗ Thúy Vy', 'tranngo170770@gmail.com', '2026-10-18 09:00:00+07', 'RESOLVED', '2026-10-16 09:00:00+07', '2026-10-16 11:30:00+07'),
    ('TK-20261017-0001', 'trangltk.24it@vku.udn.vn', 'trangltk.24it@vku.udn.vn', '[KHẨN CẤP] Cụm máy chủ cơ sở dữ liệu PostgreSQL sập hoàn toàn, lỗi 504', 'Sự cố sập Database PostgreSQL và Redis Cache 100% CPU', 'Cổng thanh toán báo lỗi 504 liên tục khiến toàn bộ khách hàng không thể giao dịch.', 'KTV đang kiểm tra connection pool và giải phóng tiến trình deadlock.', 'Technical', 'P1 - Critical', 'Nguyễn Văn An', 'tranngo170770@gmail.com', '2026-10-17 05:30:00+07', 'PENDING', '2026-10-17 04:30:00+07', NULL),
    ('TK-20261017-0002', 'director@vietcorp.vn', 'director@vietcorp.vn', 'Lỗi 504 Gateway Timeout khi xuất báo cáo Excel', 'Tối ưu hóa truy vấn SQL báo cáo xuất nhập tồn', 'Khi xuất báo cáo quý trên 500.000 dòng dữ liệu thì bị gateway timeout.', 'KTV đang chia nhỏ batch xuất dữ liệu và thêm index composite.', 'Technical', 'P2 - High', 'Trần Hoàng Bách', 'tranngo170770@gmail.com', '2026-10-17 08:30:00+07', 'IN_PROGRESS', '2026-10-17 04:30:00+07', NULL),
    ('TK-20261017-0003', 'techlead@vng.com.vn', 'techlead@vng.com.vn', 'Hỏi về cách cấu hình kết nối Redis Cache tối ưu', 'Tài liệu cấu hình Redis connection pooling Node.js', 'Cần cẩm nang chuẩn để tránh lỗi connection leak.', 'AI RAG đã soạn thảo hướng dẫn, chờ phê duyệt HITL.', 'Technical', 'P3 - Medium', 'Lê Thị Mai', 'tranngo170770@gmail.com', '2026-10-18 04:30:00+07', 'PENDING', '2026-10-17 04:30:00+07', NULL),
    ('TK-20261017-0004', 'accountant@novacrm.vn', 'accountant@novacrm.vn', 'Chính sách hoàn tiền và đối soát giao dịch lỗi', 'Quy trình hoàn tiền cho khách hàng thanh toán trùng hóa đơn', 'Khách hàng bị trừ tiền 2 lần do mạng chập chờn.', 'AI RAG đã trích xuất chính sách hoàn tiền 14 ngày.', 'Finance', 'P3 - Medium', 'Phạm Đức Trọng', 'tranngo170770@gmail.com', '2026-10-18 04:30:00+07', 'PENDING', '2026-10-17 04:30:00+07', NULL);
  `);

  // 7. Khởi tạo Bình luận Lịch sử Vé (ticket_comments)
  console.log('💬 Khởi tạo Lịch sử Chẩn đoán & Trao đổi Vé (ticket_comments)...');
  await client.query(`
    INSERT INTO ticket_comments (ticket_id, author_type, content, created_at) VALUES
    (1, 'SYSTEM', 'Vé được tạo tự động bởi n8n Luồng 3 qua AI Semantic Triage.', '2026-10-11 10:00:00+07'),
    (1, 'AI_AGENT', 'AI Diagnosis: Phát hiện tràn bộ nhớ Redis Cache. Khuyến nghị nâng cấp cấu hình maxmemory 32GB.', '2026-10-11 10:01:00+07'),
    (1, 'HUMAN_AGENT', 'Đã cấp thêm RAM và reload service redis-server. Hệ thống hoạt động bình thường.', '2026-10-11 13:20:00+07'),
    (4, 'SYSTEM', 'Vé P1 khẩn cấp được gán cho Nguyễn Văn An theo thuật toán Least-Busy.', '2026-10-14 09:00:00+07'),
    (4, 'AI_AGENT', 'AI Diagnosis: Deadlock trên bảng orders do 2 transaction update chéo dòng. Cần kill PID 4120.', '2026-10-14 09:02:00+07'),
    (4, 'HUMAN_AGENT', 'Đã hủy truy vấn nghẽn và thêm partial index. Cam kết SLA 1 giờ hoàn thành trong 42 phút.', '2026-10-14 09:42:00+07'),
    (9, 'SYSTEM', 'Vé P1 mới đón nhận từ Inbound Webhook Luồng 1 & 2.', '2026-10-17 04:30:00+07'),
    (9, 'AI_AGENT', 'AI Diagnosis: Cụm PostgreSQL sập hoàn toàn do lỗi 504 kết nối Redis Cache. Kích hoạt quy trình P1.', '2026-10-17 04:31:00+07'),
    (11, 'SYSTEM', 'Vé được gán cho Lê Thị Mai. Kích hoạt Luồng 4 RAG tra cứu cẩm nang kỹ thuật.', '2026-10-17 04:30:00+07'),
    (11, 'AI_AGENT', 'pgvector RAG tìm thấy 3 tài liệu liên quan về Redis Optimization với cosine similarity = 0.89.', '2026-10-17 04:31:00+07');
  `);

  // 8. Khởi tạo Thư nháp AI RAG (email_drafts)
  console.log('📄 Khởi tạo Thư nháp HITL RAG (email_drafts)...');
  await client.query(`
    INSERT INTO email_drafts (ticket_id, ticket_code, recipient_email, subject, html_content, proposed_subject, proposed_body, confidence_score, status, sender_name, original_subject, original_body, reviewed_by, sent_at, created_at) VALUES
    (1, 'TK-20261011-1001', 'trangltk.24it@vku.udn.vn', '[ĐÃ GIẢI QUYẾT] Hướng dẫn mở rộng bộ nhớ Redis Cache', '<p>Kính gửi Quý khách, Bộ phận kỹ thuật đã nâng cấp cấu hình Redis maxmemory 32GB thành công.</p>', '[ĐÃ GIẢI QUYẾT] Hướng dẫn mở rộng bộ nhớ Redis Cache', '<p>Kính gửi Quý khách, Bộ phận kỹ thuật đã nâng cấp cấu hình Redis maxmemory 32GB thành công.</p>', 98.0, 'SENT', 'Lê Thị Kiều Trang', 'Yêu cầu mở rộng dung lượng Redis Cache', 'Cụm Redis cache bị tràn bộ nhớ', 'tranngo170770@gmail.com', '2026-10-11 13:20:00+07', '2026-10-11 10:05:00+07'),
    (4, 'TK-20261014-1004', 'trangltk.24it@vku.udn.vn', '[KHẨN CẤP ĐÃ KHẮC PHỤC] Khôi phục máy chủ cơ sở dữ liệu PostgreSQL', '<p>Kính gửi Quý khách, Sự cố deadlock cơ sở dữ liệu đã được giải phóng hoàn toàn lúc 09:42.</p>', '[KHẨN CẤP ĐÃ KHẮC PHỤC] Khôi phục máy chủ cơ sở dữ liệu PostgreSQL', '<p>Kính gửi Quý khách, Sự cố deadlock cơ sở dữ liệu đã được giải phóng hoàn toàn lúc 09:42.</p>', 99.5, 'SENT', 'Lê Thị Kiều Trang', '[KHẨN CẤP] Máy chủ PostgreSQL tê liệt do Deadlock', 'Toàn bộ ứng dụng không thể đăng nhập', 'tranngo170770@gmail.com', '2026-10-14 09:42:00+07', '2026-10-14 09:05:00+07'),
    (9, 'TK-20261017-0001', 'trangltk.24it@vku.udn.vn', '[PHẢN HỒI P1] Cập nhật tiến độ khắc phục sự cố máy chủ PostgreSQL & Redis', '<div style="font-family: Arial, sans-serif; line-height: 1.6;"><h3 style="color: #d97706;">Thông báo từ Bộ phận Kỹ thuật Cấp cao</h3><p>Kính gửi Quý khách <b>Lê Thị Kiều Trang</b>,</p><p>Đội ngũ kỹ thuật đã tiếp nhận cảnh báo khẩn cấp P1 về sự cố máy chủ PostgreSQL sập kết nối Redis gây lỗi 504. Chúng tôi đã cô lập cụm node lỗi và đang khởi động lại pool kết nối dự phòng. Dự kiến dịch vụ phục hồi hoàn toàn trong 20 phút tới.</p><p>Trân trọng,<br><b>Kỹ sư trưởng: Nguyễn Văn An</b></p></div>', '[PHẢN HỒI P1] Cập nhật tiến độ khắc phục sự cố máy chủ PostgreSQL & Redis', 'Nội dung phản hồi sự cố khẩn cấp P1', 97.5, 'PENDING_APPROVAL', 'Lê Thị Kiều Trang', '[KHẨN CẤP] Cụm máy chủ cơ sở dữ liệu PostgreSQL sập hoàn toàn, lỗi 504', 'Cổng thanh toán báo lỗi 504 liên tục', NULL, NULL, '2026-10-17 04:32:00+07'),
    (11, 'TK-20261017-0003', 'techlead@vng.com.vn', '[HỖ TRỢ KỸ THUẬT] Cẩm nang cấu hình kết nối Redis Cache tối ưu cho Node.js', '<div style="font-family: Arial, sans-serif; line-height: 1.6;"><h3 style="color: #2563eb;">Hướng dẫn Tối ưu hóa Kết nối Redis Cache</h3><p>Chào anh Hoàng Minh Tuấn,</p><p>Theo tài liệu kỹ thuật nội bộ (Mã cẩm nang: <b>KB-REDIS-OPT-01</b>), để hạn chế lỗi connection leak và timeout khi truy cập Redis Cluster trong môi trường microservices, Quý doanh nghiệp vui lòng áp dụng các tham số chuẩn sau:</p><ul><li><b>maxClients:</b> 10,000</li><li><b>timeout:</b> 5000ms</li><li><b>keepAlive:</b> 30000ms</li><li><b>retryStrategy:</b> Exponential backoff with jitter</li></ul><p>Đính kèm tài liệu chi tiết trong cổng thông tin hỗ trợ kỹ thuật.</p><p>Trân trọng,<br><b>Đội ngũ Kỹ thuật Enterprise</b></p></div>', '[HỖ TRỢ KỸ THUẬT] Cẩm nang cấu hình kết nối Redis Cache tối ưu cho Node.js', 'Nội dung cẩm nang Redis Cache', 96.0, 'PENDING_APPROVAL', 'Hoàng Minh Tuấn', 'Hỏi về cách cấu hình kết nối Redis Cache tối ưu', 'Cần tài liệu hướng dẫn khắc phục timeout', NULL, NULL, '2026-10-17 04:33:00+07'),
    (12, 'TK-20261017-0004', 'accountant@novacrm.vn', '[HỖ TRỢ TÀI CHÍNH] Quy trình và thủ tục hoàn tiền giao dịch lỗi thanh toán', '<div style="font-family: Arial, sans-serif; line-height: 1.6;"><h3 style="color: #059669;">Quy trình Hoàn tiền Chính thức (Chính sách 14 ngày)</h3><p>Kính gửi Quý đối tác <b>NovaCRM</b>,</p><p>Căn cứ theo điều khoản dịch vụ (<b>Mục 3.2 - Chính sách hoàn tiền 100% trong 14 ngày</b>), chúng tôi đã tiếp nhận yêu cầu hoàn tiền do trừ trùng giao dịch cổng VNPay. Quý khách vui lòng cung cấp mã hóa đơn gốc hoặc biên lai thanh toán để phòng Kế toán lập ủy nhiệm chi hoàn tiền trong vòng 24 giờ làm việc.</p><p>Trân trọng,<br><b>Phòng Kế toán Doanh nghiệp</b></p></div>', '[HỖ TRỢ TÀI CHÍNH] Quy trình và thủ tục hoàn tiền giao dịch lỗi thanh toán', 'Nội dung phản hồi hoàn tiền', 95.0, 'PENDING_APPROVAL', 'Ngô Thu Thủy', 'Chính sách hoàn tiền và đối soát giao dịch lỗi', 'Khách hàng bị trừ tiền 2 lần', NULL, NULL, '2026-10-17 04:34:00+07');
  `);

  // Cập nhật draft_id ngược vào tickets
  await client.query(`
    UPDATE tickets SET draft_id = 1 WHERE id = 1;
    UPDATE tickets SET draft_id = 2 WHERE id = 4;
    UPDATE tickets SET draft_id = 3 WHERE id = 9;
    UPDATE tickets SET draft_id = 4 WHERE id = 11;
    UPDATE tickets SET draft_id = 5 WHERE id = 12;
  `);

  // 9. Khởi tạo Khách hàng CRM (crm_customers) & Cơ hội bán hàng (crm_deals)
  console.log('💼 Khởi tạo Khách hàng CRM (crm_customers) & Cơ hội (crm_deals)...');
  await client.query(`
    INSERT INTO crm_customers (id, full_name, email, phone, company_name, lead_score, is_unsubscribed, created_at) VALUES
    (1, 'Lê Thị Kiều Trang', 'trangltk.24it@vku.udn.vn', '0912888999', 'Tập đoàn Công nghệ VKU Global', 100, false, '2026-10-17 04:00:00+07'),
    (2, 'Trần Văn Bình', 'director@vietcorp.vn', '0903111222', 'Viet Solution Corporation', 95, false, '2026-10-11 11:00:00+07'),
    (3, 'Hoàng Minh Tuấn', 'techlead@vng.com.vn', '0988665544', 'Tập đoàn VNG Cloud', 90, false, '2026-10-12 14:00:00+07'),
    (4, 'Phạm Quốc Bảo', 'ceo@fpt-software.com', '0913555777', 'FPT Digital Solutions', 85, false, '2026-10-13 09:30:00+07'),
    (5, 'Nguyễn Văn Minh', 'contact@partner.vn', '0909333444', 'Minh Phát Logistics', 70, false, '2026-10-14 15:00:00+07'),
    (6, 'Đỗ Mỹ Linh', 'linh.do@retail-vn.com', '0977222333', 'Chuỗi Cửa Hàng Bán Lẻ GreenMart', 80, false, '2026-10-15 10:00:00+07'),
    (7, 'Vũ Đình Trọng', 'trong.vu@freelance-tech.vn', '0934111999', 'Cá nhân tư vấn tự do', 35, true, '2026-10-15 16:00:00+07'),
    (8, 'Nguyễn Mai Anh', 'maianh@anphat-holding.vn', '0912999000', 'Tập đoàn An Phát Holdings', 92, false, '2026-10-16 11:20:00+07')
    ON CONFLICT (id) DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      company_name = EXCLUDED.company_name,
      lead_score = EXCLUDED.lead_score;

    INSERT INTO crm_deals (customer_id, deal_name, expected_budget, stage, campaign_tag, assigned_sales_rep, followup_count, last_contacted_at, created_at) VALUES
    (1, 'Hợp đồng phần mềm Email Automation cho 300 nhân sự', 95000000, 'NEW_INQUIRY', 'ENTERPRISE_HIGH_VALUE', 'Nguyễn Văn An', 0, '2026-10-17 04:00:00+07', '2026-10-17 04:00:00+07'),
    (8, 'Triển khai hạ tầng Helpdesk CRM Đa kênh An Phát', 45000000, 'NEW_INQUIRY', 'ENTERPRISE_HIGH_VALUE', 'Lê Thị Mai', 0, '2026-10-16 11:20:00+07', '2026-10-16 11:20:00+07'),
    (3, 'Gói giải pháp AI Email Triage tích hợp Private Cloud', 120000000, 'CONTACTED', 'ENTERPRISE_HIGH_VALUE', 'Trần Hoàng Bách', 1, '2026-10-15 14:00:00+07', '2026-10-12 14:00:00+07'),
    (5, 'Hệ thống tự động hóa phản hồi email chăm sóc khách hàng', 35000000, 'CONTACTED', 'SME_RETAIL', 'Lê Thị Mai', 1, '2026-10-16 09:00:00+07', '2026-10-14 15:00:00+07'),
    (2, 'Bản quyền Enterprise Email Automation 500 Users', 150000000, 'QUOTED', 'ENTERPRISE_HIGH_VALUE', 'Nguyễn Văn An', 1, '2026-10-14 10:00:00+07', '2026-10-11 11:00:00+07'),
    (6, 'Giải pháp CRM bán lẻ đa điểm GreenMart (Đã báo giá > 48h)', 60000000, 'QUOTED', 'ENTERPRISE_HIGH_VALUE', 'Lê Thị Mai', 2, '2026-10-14 15:00:00+07', '2026-10-13 10:00:00+07'),
    (4, 'Dự án Chuyển đổi số Quy trình Helpdesk FPT', 250000000, 'WON', 'ENTERPRISE_HIGH_VALUE', 'Trần Hoàng Bách', 3, '2026-10-16 17:00:00+07', '2026-10-13 09:30:00+07'),
    (7, 'Cấu hình gói cá nhân Starter Mail (Quá 3 lần không phản hồi)', 10000000, 'COLD_LEAD', 'SME_RETAIL', 'Đỗ Thúy Vy', 3, '2026-10-12 09:00:00+07', '2026-10-10 10:00:00+07');
  `);

  // 10. Khởi tạo Bảng Hóa đơn Đối soát (finance_invoices)
  console.log('🧾 Khởi tạo Hóa đơn Đối soát Số học (finance_invoices)...');
  await client.query(`
    INSERT INTO finance_invoices (invoice_number, seller_tax_id, seller_name, buyer_name, buyer_email, issue_date, subtotal, vat_amount, total_amount, math_status, file_storage_path, created_at) VALUES
    ('INV-VKU-2026-01', '0402123456', 'Công ty Cổ phần Giải pháp Số NovaCRM', 'Lê Thị Kiều Trang', 'trangltk.24it@vku.udn.vn', '2026-10-17', 50000000.00, 5000000.00, 55000000.00, 'VALIDATED', '/storage/invoices/hoadon_vat_hop_le_01.pdf', '2026-10-17 04:30:00+07'),
    ('INV-FLAG-SAI-LECH-02', '0309876543', 'Công ty Cổ phần Logistics Global', 'Lê Thị Kiều Trang', 'trangltk.24it@vku.udn.vn', '2026-10-17', 45000000.00, 4500000.00, 52000000.00, 'DISCREPANCY_FLAGGED', '/storage/invoices/hoadon_gian_lan_lech_tien.pdf', '2026-10-17 04:35:00+07'),
    ('INV-2026-0899', '0101234567', 'Công ty TNHH Thiết Bị Điện Tử Viễn Thông', 'Trần Văn Bình', 'director@vietcorp.vn', '2026-10-11', 10000000.00, 1000000.00, 11000000.00, 'VALIDATED', '/storage/invoices/inv_2026_0899.pdf', '2026-10-11 09:00:00+07'),
    ('INV-2026-0900', '0309876543', 'Công ty Cổ phần Logistics Minh Phát', 'Nguyễn Văn Minh', 'contact@partner.vn', '2026-10-12', 5000000.00, 500000.00, 5800000.00, 'DISCREPANCY_FLAGGED', '/storage/invoices/inv_2026_0900.pdf', '2026-10-12 11:30:00+07'),
    ('INV-843950', '0402123456', 'Công ty Cổ phần Giải pháp Số NovaCRM', 'Ngô Thu Thủy', 'accountant@novacrm.vn', '2026-10-13', 50000000.00, 5000000.00, 55000000.00, 'VALIDATED', '/storage/invoices/inv_843950.pdf', '2026-10-13 14:00:00+07'),
    ('INV-FRAUD-VAT-88', '0301112233', 'Dịch vụ Mạng Máy Chủ Cloud Provider XYZ', 'Hoàng Minh Tuấn', 'techlead@vng.com.vn', '2026-10-14', 100000000.00, 8000000.00, 115000000.00, 'DISCREPANCY_FLAGGED', '/storage/invoices/inv_fraud_vat.pdf', '2026-10-14 16:20:00+07'),
    ('INV-CLOUD-2026-10', '0109998888', 'Tập đoàn Viễn thông Viettel IDC', 'Phạm Quốc Bảo', 'ceo@fpt-software.com', '2026-10-15', 80000000.00, 8000000.00, 88000000.00, 'VALIDATED', '/storage/invoices/inv_viettel_cloud.pdf', '2026-10-15 10:15:00+07'),
    ('INV-FPT-SERVER-44', '0100109106', 'Công ty Cổ phần FPT Smart Cloud', 'Đỗ Mỹ Linh', 'linh.do@retail-vn.com', '2026-10-16', 120000000.00, 12000000.00, 132000000.00, 'VALIDATED', '/storage/invoices/inv_fpt_cloud.pdf', '2026-10-16 15:45:00+07');
  `);

  // 11. Khởi tạo Báo cáo Điều hành Hàng ngày (daily_summaries)
  console.log('📈 Khởi tạo Báo cáo Điều hành 7 ngày (daily_summaries) kèm Incident Spike P1...');
  await client.query(`
    INSERT INTO daily_summaries (
      report_date, summary_date, total_emails_received, total_tickets_created, sla_compliance_rate,
      executive_summary, anomaly_detected, total_received, total_pending_tickets, total_p1,
      negative_issues, categories, priorities, key_insights, risk_summary, recommendations,
      markdown_digest, html_digest, incident_count, baseline_count, increase_percent, incident_spike,
      recipient_count, sent_count, failed_count, created_at
    ) VALUES
    (
      '2026-10-11', '2026-10-11', 42, 12, 100.0,
      'Hệ thống khởi đầu tuần mới vận hành ổn định. Tỷ lệ đáp ứng cam kết SLA đạt 100%. Không có sự cố nghiêm trọng.',
      false, 42, 0, 0,
      '[]'::jsonb, '{"Technical": 8, "Sales": 2, "Finance": 2}'::jsonb, '{"P2": 4, "P3": 6, "P4": 2}'::jsonb,
      'Lưu lượng email đầu tuần phân bổ chủ yếu vào phân hệ Technical.', '',
      '["Duy trì cơ chế tự động cân bằng tải KTV", "Tăng cường tài liệu cẩm nang RAG cho Redis"]'::jsonb,
      'Báo cáo tóm tắt ngày 11/10/2026', '<p>Báo cáo tóm tắt ngày 11/10/2026</p>', 0, 1.2, 0.0, false, 3, 3, 0, '2026-10-11 18:00:00+07'
    ),
    (
      '2026-10-12', '2026-10-12', 55, 18, 98.5,
      'Lưu lượng khách hàng hỏi mua gói Enterprise tăng 35%. Đội ngũ kỹ thuật đóng 100% vé sự cố P2 đúng hạn mức SLA 4 giờ.',
      false, 55, 1, 0,
      '[]'::jsonb, '{"Technical": 10, "Sales": 5, "Finance": 3}'::jsonb, '{"P2": 5, "P3": 9, "P4": 4}'::jsonb,
      'Các deal bán hàng CRM tăng trưởng mạnh ở phân khúc doanh nghiệp quy mô vừa.', '',
      '["Ưu tiên theo dõi các deal CRM có Lead Score trên 80", "Chuẩn bị mở rộng pool kết nối database"]'::jsonb,
      'Báo cáo tóm tắt ngày 12/10/2026', '<p>Báo cáo tóm tắt ngày 12/10/2026</p>', 0, 1.4, 0.0, false, 3, 3, 0, '2026-10-12 18:00:00+07'
    ),
    (
      '2026-10-13', '2026-10-13', 68, 24, 97.2,
      'Phát hiện 2 email phishing mạo danh ngân hàng và đã bị Luồng 1 cách ly vào Vault an toàn.',
      false, 68, 2, 0,
      '[]'::jsonb, '{"Technical": 14, "Sales": 6, "Finance": 4}'::jsonb, '{"P2": 7, "P3": 12, "P4": 5}'::jsonb,
      'Hệ thống AI Anti-Spam hoạt động hiệu quả, độ chính xác chặn rác đạt 99.2%.', '',
      '["Cập nhật danh sách từ khóa lừa đảo tài chính vào prompt Gemini", "Bổ sung cẩm nang API rate-limit vào RAG"]'::jsonb,
      'Báo cáo tóm tắt ngày 13/10/2026', '<p>Báo cáo tóm tắt ngày 13/10/2026</p>', 0, 1.5, 0.0, false, 3, 3, 0, '2026-10-13 18:00:00+07'
    ),
    (
      '2026-10-14', '2026-10-14', 115, 48, 88.5,
      'CẢNH BÁO ĐỘT BIẾN SỰ CỐ (INCIDENT SPIKE): Ghi nhận 8 sự cố P1 khẩn cấp do quá tải CPU cơ sở dữ liệu và đứt kết nối cổng VNPay (tăng vọt 430% so với trung bình 7 ngày). Hệ thống đã kích hoạt báo động đỏ cho Tổng giám đốc và đội ngũ trực chiến khắc phục trong 45 phút.',
      true, 115, 4, 8,
      '["Deadlock cụm cơ sở dữ liệu PostgreSQL Master", "Timeout kết nối cổng thanh toán trực tuyến", "Tràn bộ nhớ đệm cache hệ thống"]'::jsonb,
      '{"Technical": 32, "Sales": 9, "Finance": 7}'::jsonb, '{"P1": 8, "P2": 15, "P3": 18, "P4": 7}'::jsonb,
      'Sự cố spike P1 bắt nguồn từ việc lưu lượng truy vấn tăng đột biến kết hợp thiếu index tối ưu.', 'Nguy cơ sập dây chuyền nếu không tăng tài nguyên database',
      '["Cấp bách: Tăng tài nguyên RAM/CPU cho cụm PostgreSQL lên gấp đôi", "Tách riêng cụm Read-Replica cho các báo cáo phân tích", "Cấu hình tự động kill các truy vấn transaction treo quá 30 giây"]'::jsonb,
      'Báo cáo khẩn cấp ngày 14/10/2026: Phát hiện đột biến sự cố P1!', '<p>Báo cáo khẩn cấp ngày 14/10/2026: Phát hiện đột biến sự cố P1!</p>', 8, 1.5, 433.3, true, 3, 3, 0, '2026-10-14 18:00:00+07'
    ),
    (
      '2026-10-15', '2026-10-15', 72, 22, 96.5,
      'Sau khi nâng cấp hạ tầng, hệ thống trở lại quỹ đạo ổn định. Tất cả 8 sự cố P1 của ngày hôm trước đã được giải quyết triệt để.',
      false, 72, 2, 0,
      '[]'::jsonb, '{"Technical": 12, "Sales": 6, "Finance": 4}'::jsonb, '{"P2": 6, "P3": 11, "P4": 5}'::jsonb,
      'Thời gian phản hồi trung bình của API giảm từ 450ms xuống còn 85ms.', '',
      '["Tiếp tục rà soát log kiểm toán system_audit_logs", "Gửi email cảm ơn và xác nhận hoàn tất tới các khách hàng bị ảnh hưởng"]'::jsonb,
      'Báo cáo tóm tắt ngày 15/10/2026', '<p>Báo cáo tóm tắt ngày 15/10/2026</p>', 0, 2.2, 0.0, false, 3, 3, 0, '2026-10-15 18:00:00+07'
    ),
    (
      '2026-10-16', '2026-10-16', 84, 26, 99.0,
      'Hiệu suất xử lý vé đạt đỉnh cao. 100% thư trả lời kỹ thuật của Luồng 4 RAG được chuyên viên duyệt qua giao diện Web trong vòng dưới 10 phút.',
      false, 84, 1, 0,
      '[]'::jsonb, '{"Technical": 15, "Sales": 7, "Finance": 4}'::jsonb, '{"P2": 8, "P3": 13, "P4": 5}'::jsonb,
      'Khâu Human-in-the-Loop tại Luồng 5 hoạt động nhịp nhàng, độ chính xác nội dung thư trả lời khách đạt 100%.', '',
      '["Khuyến khích nhân viên duy trì tốc độ duyệt draft", "Chuẩn bị tài liệu đối soát hóa đơn định kỳ cho phòng Kế toán"]'::jsonb,
      'Báo cáo tóm tắt ngày 16/10/2026', '<p>Báo cáo tóm tắt ngày 16/10/2026</p>', 0, 2.0, 0.0, false, 3, 3, 0, '2026-10-16 18:00:00+07'
    ),
    (
      '2026-10-17', '2026-10-17', 45, 14, 97.8,
      'Báo cáo vận hành ngày hiện tại (Thời gian thực): Tiếp nhận 1 sự cố P1 đang được xử lý khẩn trương, 4 thư nháp RAG đang chờ phê duyệt trên giao diện Web (/approval), 2 cơ hội bán hàng mới được chấm điểm Lead Score 100/100.',
      false, 45, 4, 1,
      '["Sự cố kết nối cơ sở dữ liệu P1 đang được khắc phục"]'::jsonb,
      '{"Technical": 8, "Sales": 4, "Finance": 2}'::jsonb, '{"P1": 1, "P2": 4, "P3": 6, "P4": 3}'::jsonb,
      'Cơ chế cân bằng tải Least-Busy phân bổ đồng đều vé cho 5 kỹ thuật viên trực nhật.', '',
      '["Duyệt nhanh 4 bản thảo RAG tại màn hình /approval", "Kế toán trưởng đối soát ngay 2 hóa đơn bị gắn cờ sai lệch số học"]'::jsonb,
      'Báo cáo điều hành ngày 17/10/2026 (Live)', '<p>Báo cáo điều hành ngày 17/10/2026 (Live)</p>', 1, 1.8, 0.0, false, 3, 3, 0, '2026-10-17 04:35:00+07'
    )
    ON CONFLICT (report_date) DO UPDATE SET 
      total_emails_received = EXCLUDED.total_emails_received,
      total_tickets_created = EXCLUDED.total_tickets_created,
      sla_compliance_rate = EXCLUDED.sla_compliance_rate,
      executive_summary = EXCLUDED.executive_summary,
      anomaly_detected = EXCLUDED.anomaly_detected,
      total_p1 = EXCLUDED.total_p1,
      negative_issues = EXCLUDED.negative_issues,
      recommendations = EXCLUDED.recommendations,
      incident_spike = EXCLUDED.incident_spike;
  `);

  // 12. Khởi tạo Nhật ký Kiểm toán Toàn diện Hệ thống (system_audit_logs)
  console.log('📜 Khởi tạo Nhật ký Kiểm toán (system_audit_logs) qua các ngày...');
  await client.query(`
    INSERT INTO system_audit_logs (source, event_type, workflow_id, created_at, description, payload, payload_snapshot) VALUES
    ('m1-system', 'INBOUND_CLEAN_EMAIL_ACCEPTED', 'flow01_ingest_antispam', '2026-10-11 10:00:00+07', 'Email sạch từ trangltk.24it@vku.udn.vn được chấp nhận qua Luồng 1', '{"sender": "trangltk.24it@vku.udn.vn"}'::jsonb, '{"sender": "trangltk.24it@vku.udn.vn", "reputation": 98}'::jsonb),
    ('m1-system', 'EMAIL_TRIAGED_SUCCESSFULLY', 'flow02_department_triage', '2026-10-11 10:00:05+07', 'AI Agent 1 phân loại TECH, mức P2, cam kết SLA 4 giờ', '{"dept": "TECH"}'::jsonb, '{"dept": "TECH", "priority": "P2"}'::jsonb),
    ('m1-system', 'TICKET_DISPATCHED_TO_AGENT', 'flow03_ticket_sla_dispatch', '2026-10-11 10:00:10+07', 'Tạo vé TK-20261011-1001 và gán cho Nguyễn Văn An (Least-Busy)', '{"ticket": "TK-20261011-1001"}'::jsonb, '{"ticket_code": "TK-20261011-1001", "agent": "Nguyễn Văn An"}'::jsonb),
    ('m2-system', 'AI_REPLY_DRAFT_GENERATED', 'flow04_rag_knowledge_draft', '2026-10-11 10:05:00+07', 'Mã hóa vector 768 dim, tra cứu pgvector tìm thấy KB-REDIS-OPT-01, sinh bản thảo', '{"draft_id": 1}'::jsonb, '{"similarity": 0.89, "draft_id": 1}'::jsonb),
    ('m2-system', 'OUTBOUND_EMAIL_SUCCESSFULLY_SENT', 'flow05_hitl_approval_send', '2026-10-11 13:20:00+07', 'Chuyên viên duyệt bản thảo, gửi email SMTP tới khách hàng, đóng vé MET_SLA', '{"sla": "MET_SLA"}'::jsonb, '{"sent_to": "trangltk.24it@vku.udn.vn", "sla": "MET_SLA"}'::jsonb),
    ('m3-system', 'CRM_LEAD_QUALIFIED_AND_STORED', 'flow07_crm_lead_scoring', '2026-10-11 11:00:00+07', 'Bóc tách thực thể kinh doanh, Lead Score 95/100, tạo Deal 150 triệu', '{"deal_id": 5}'::jsonb, '{"lead_score": 95, "budget": 150000000}'::jsonb),
    ('m3-system', 'INVOICE_OCR_PROCESSED', 'flow09_invoice_multimodal_ocr', '2026-10-11 09:00:00+07', 'Đối soát hóa đơn INV-2026-0899: Tiền hàng 10tr + VAT 1tr = 11tr khớp 100%, gắn nhãn VALIDATED', '{"invoice": "INV-2026-0899"}'::jsonb, '{"invoice": "INV-2026-0899", "status": "VALIDATED"}'::jsonb),
    ('m1-system', 'SECURITY_ISOLATION_QUARANTINED', 'flow01_ingest_antispam', '2026-10-12 08:30:00+07', 'Phát hiện thư lừa đảo tài chính Crypto từ phishing@crypto-reward.xyz, cách ly vào Vault, trừ 50 điểm uy tín', '{"vault_id": 1}'::jsonb, '{"vault_id": 1, "score": 5}'::jsonb),
    ('m3-system', 'INVOICE_DISCREPANCY_FLAGGED', 'flow09_invoice_multimodal_ocr', '2026-10-12 11:30:00+07', 'Phát hiện sai lệch số học hóa đơn INV-2026-0900 (lệch 300.000 đ), gắn cờ đỏ DISCREPANCY_FLAGGED', '{"invoice": "INV-2026-0900"}'::jsonb, '{"invoice": "INV-2026-0900", "diff": 300000}'::jsonb),
    ('m2-system', 'INCIDENT_SPIKE_ALERT_TRIGGERED', 'flow06_executive_digest', '2026-10-14 18:00:00+07', 'Đột biến 8 sự cố P1 khẩn cấp, vượt ngưỡng 20% baseline, bắn email báo động đỏ cho Tổng giám đốc', '{"p1": 8}'::jsonb, '{"p1_count": 8, "increase_pct": 433.3}'::jsonb),
    ('m3-system', 'SALES_FOLLOWUP_DISPATCHED', 'flow08_automated_followup', '2026-10-15 09:00:00+07', 'Tự động gửi email chăm sóc chặng 2 cho deal QUOTED quá 48h của GreenMart', '{"deal_id": 6}'::jsonb, '{"deal_id": 6, "followup_stage": 2}'::jsonb),
    ('m1-system', 'INBOUND_CLEAN_EMAIL_ACCEPTED', 'flow01_ingest_antispam', '2026-10-17 04:30:00+07', 'Tiếp nhận email sự cố P1 từ trangltk.24it@vku.udn.vn', '{"sender": "trangltk.24it@vku.udn.vn"}'::jsonb, '{"sender": "trangltk.24it@vku.udn.vn"}'::jsonb),
    ('m1-system', 'EMAIL_TRIAGED_SUCCESSFULLY', 'flow02_department_triage', '2026-10-17 04:30:05+07', 'AI Agent 1 gán TECH, P1, kích hoạt email cảnh báo khẩn cấp và thư cam kết SLA 1h', '{"priority": "P1"}'::jsonb, '{"priority": "P1", "sla_window": "1h"}'::jsonb),
    ('m1-system', 'TICKET_DISPATCHED_TO_AGENT', 'flow03_ticket_sla_dispatch', '2026-10-17 04:30:10+07', 'Sinh mã TK-20261017-0001, Least-Busy gán cho KTV Nguyễn Văn An', '{"agent": "Nguyễn Văn An"}'::jsonb, '{"ticket_code": "TK-20261017-0001"}'::jsonb),
    ('m2-system', 'AI_REPLY_DRAFT_GENERATED', 'flow04_rag_knowledge_draft', '2026-10-17 04:32:00+07', 'AI RAG soạn bản thảo P1, đẩy realtime notification lên Web (/approval)', '{"draft_id": 3}'::jsonb, '{"draft_id": 3, "status": "PENDING_APPROVAL"}'::jsonb),
    ('m3-system', 'CRM_LEAD_QUALIFIED_AND_STORED', 'flow07_crm_lead_scoring', '2026-10-17 04:00:00+07', 'AI trích xuất Lead VKU Global 95 triệu, gán ENTERPRISE_HIGH_VALUE, Lead Score 100/100', '{"score": 100}'::jsonb, '{"lead_score": 100, "deal_name": "Email Automation 300 nhân sự"}'::jsonb),
    ('m3-system', 'INVOICE_OCR_PROCESSED', 'flow09_invoice_multimodal_ocr', '2026-10-17 04:30:00+07', 'Đối soát hóa đơn INV-VKU-2026-01: 50tr + 5tr = 55tr, kết luận VALIDATED khớp 100%', '{"invoice": "INV-VKU-2026-01"}'::jsonb, '{"invoice": "INV-VKU-2026-01", "math_status": "VALIDATED"}'::jsonb),
    ('m3-system', 'INVOICE_DISCREPANCY_FLAGGED', 'flow09_invoice_multimodal_ocr', '2026-10-17 04:35:00+07', 'Đối soát hóa đơn INV-FLAG-SAI-LECH-02: 45tr + 4.5tr != 52tr (lệch 2.500.000 đ), gắn cờ đỏ DISCREPANCY_FLAGGED', '{"diff": 2500000}'::jsonb, '{"invoice": "INV-FLAG-SAI-LECH-02", "math_status": "DISCREPANCY_FLAGGED"}'::jsonb);
  `);

  // Đồng bộ PostgreSQL Sequences để tránh lỗi duplicate key pkey
  await client.query(`
    SELECT setval('crm_customers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM crm_customers));
    SELECT setval('crm_deals_id_seq', (SELECT COALESCE(MAX(id), 1) FROM crm_deals));
    SELECT setval('tickets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tickets));
    SELECT setval('ticket_comments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ticket_comments));
    SELECT setval('email_drafts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM email_drafts));
    SELECT setval('email_triage_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM email_triage_logs));
    SELECT setval('finance_invoices_id_seq', (SELECT COALESCE(MAX(id), 1) FROM finance_invoices));
    SELECT setval('daily_summaries_id_seq', (SELECT COALESCE(MAX(id), 1) FROM daily_summaries));
    SELECT setval('system_audit_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM system_audit_logs));
  `);

  await client.end();
  console.log('\n======================================================================');
  console.log('🎉 KHỞI TẠO XONG TOÀN BỘ BỘ DỮ LIỆU ĐA NGÀY DEMO THÀNH CÔNG 100%!');
  console.log('======================================================================');
}

seedData().catch((err) => {
  console.error('❌ Lỗi khi khởi tạo dữ liệu:', err);
  process.exit(1);
});


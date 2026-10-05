-- ====================================================================
-- DATABASE SCRIPT 02: MEMBER 2 - KNOWLEDGE BASE, DRAFTS & SUMMARIES
-- (OWNER: MEMBER 2 - feature/m2-reply-rag)
-- ====================================================================

-- 1. Bảng Knowledge Base phục vụ RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    topic TEXT NOT NULL,
    keywords TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for fast full-text / ILIKE keyword lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_base_topic ON knowledge_base (topic);

INSERT INTO knowledge_base (topic, keywords, content) VALUES
('Chính sách hoàn tiền', 'hoan tien, refund, tra hang, hoan phi, payment', 'Khách hàng được quyền yêu cầu hoàn tiền 100% trong vòng 14 ngày kể từ khi kích hoạt nếu hệ thống gặp sự cố không thể khắc phục.'),
('Bảo mật dữ liệu', 'bao mat, dkim, spf, ma hoa, ssl, security, tls, aes', 'Hệ thống áp dụng chuẩn mã hóa AES-256 cho dữ liệu tĩnh và TLS 1.3 cho toàn bộ kết nối truyền nhận dữ liệu trên môi trường đám mây.'),
('Hỗ trợ đăng nhập & Đổi mật khẩu', 'mat khau, reset password, password, dang nhap, login, quen mat khau', 'Khách hàng có thể chủ động đặt lại mật khẩu bằng cách truy cập trang cài đặt tài khoản, chọn Quên mật khẩu và xác thực qua email OTP trong vòng 15 phút.'),
('Cam kết chất lượng dịch vụ SLA', 'sla, thoi gian xu ly, cam ket, uptime, phan hoi', 'Hệ thống cam kết thời gian phản hồi ban đầu trong 2 giờ đối với sự cố mức P1 (Khẩn cấp), 8 giờ đối với P2 (Nghiêm trọng), và 24 giờ đối với các yêu cầu thông thường.'),
('Hạn mức gọi API và Giới hạn tốc độ', 'rate limit, api limit, han muc, request per minute, quota', 'Mỗi tài khoản doanh nghiệp được cấp hạn mức mặc định là 1.000 requests/phút. Trường hợp cần tăng quota cho sự kiện quy mô lớn, vui lòng liên hệ Tech Support trước 48 giờ.')
ON CONFLICT DO NOTHING;

-- 2. Bảng Email Drafts chờ Human Approval (Human-in-the-Loop)
CREATE TABLE IF NOT EXISTS email_drafts (
    id SERIAL PRIMARY KEY,
    ticket_code TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    proposed_subject TEXT NOT NULL,
    proposed_body TEXT NOT NULL,
    confidence_score NUMERIC(5,2),
    status TEXT DEFAULT 'PENDING_APPROVAL' NOT NULL, -- 'PENDING_APPROVAL', 'APPROVED', 'MODIFIED', 'REJECTED', 'SENT', 'FAILED'
    sender_name VARCHAR(150),
    original_subject TEXT DEFAULT '' NOT NULL,
    original_body TEXT DEFAULT '' NOT NULL,
    knowledge_context JSONB DEFAULT '[]'::jsonb NOT NULL,
    approval_resume_url TEXT,
    n8n_execution_id VARCHAR(100),
    received_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    sent_at TIMESTAMP,
    reviewed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_drafts_status_created_at ON email_drafts (status, created_at DESC);

-- Sample Seed Data for Email Drafts
INSERT INTO email_drafts (
    ticket_code, recipient_email, sender_name, original_subject, original_body,
    proposed_subject, proposed_body, confidence_score, status, knowledge_context
) VALUES
(
    'TICK-2026-0001',
    'client-alpha@enterprise.vn',
    'Nguyễn Văn Alpha',
    'Sự cố lỗi mạng 504 khi truy xuất báo cáo',
    'Chào đội ngũ hỗ trợ, sáng nay hệ thống chúng tôi liên tục gặp lỗi 504 Gateway Timeout khi truy xuất báo cáo doanh thu.',
    'Re: Thông báo tiếp nhận và xử lý sự cố kỹ thuật 504 (TICK-2026-0001)',
    'Kính gửi Quý khách,

Cảm ơn Quý khách đã gửi thông tin. Đội ngũ kỹ thuật đã xác định được nguyên nhân do sự cố nghẽn lưu lượng tạm thời tại cụm máy chủ và đang khẩn trương khắc phục. Theo cam kết SLA mức độ P1, sự cố dự kiến được xử lý dứt điểm trong vòng 2 giờ tới.

Trân trọng,
Đội ngũ Kỹ thuật Doanh nghiệp',
    94.50,
    'PENDING_APPROVAL',
    '[{"id": 4, "topic": "Cam kết chất lượng dịch vụ SLA", "content": "Thời gian phản hồi P1 trong 2 giờ"}]'::jsonb
),
(
    'TICK-2026-0002',
    'billing-partner@corp.vn',
    'Trần Thị Beta',
    'Hỏi về chính sách hoàn tiền hợp đồng dịch vụ',
    'Kính gửi công ty, chúng tôi muốn hỏi về điều kiện được hoàn tiền trong tháng đầu sử dụng nếu có trục trặc.',
    'Re: Hướng dẫn chính sách hoàn tiền dịch vụ (TICK-2026-0002)',
    'Kính gửi Quý khách,

Theo chính sách của chúng tôi, khách hàng được quyền yêu cầu hoàn tiền 100% trong vòng 14 ngày kể từ khi kích hoạt nếu hệ thống gặp sự cố không thể khắc phục. Bộ phận Chăm sóc Khách hàng sẽ liên hệ để hỗ trợ Quý khách chi tiết các bước tiếp theo.

Trân trọng,
Bộ phận CSKH',
    88.00,
    'PENDING_APPROVAL',
    '[{"id": 1, "topic": "Chính sách hoàn tiền", "content": "Hoàn tiền 100% trong vòng 14 ngày"}]'::jsonb
)
ON CONFLICT DO NOTHING;

-- 3. Bảng Người nhận báo cáo điều hành hằng ngày
CREATE TABLE IF NOT EXISTS daily_digest_recipients (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('EXECUTIVE', 'OPERATIONS')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT daily_digest_recipients_recipient_email_recipient_type_key UNIQUE (recipient_email, recipient_type)
);

INSERT INTO daily_digest_recipients (recipient_email, recipient_type, is_active) VALUES
('tech-lead@vku.udn.vn', 'EXECUTIVE', true),
('cskh@vku.udn.vn', 'EXECUTIVE', true),
('admin-ops@vku.udn.vn', 'OPERATIONS', true)
ON CONFLICT DO NOTHING;

-- 4. Bảng Báo cáo điều hành hằng ngày (Daily Summaries & Incident Spike Detection)
CREATE TABLE IF NOT EXISTS daily_summaries (
    id SERIAL PRIMARY KEY,
    summary_date DATE DEFAULT CURRENT_DATE,
    total_received INT DEFAULT 0,
    total_pending_tickets INT DEFAULT 0 NOT NULL,
    total_p1 INT DEFAULT 0,
    negative_issues JSONB DEFAULT '[]'::jsonb NOT NULL,
    categories JSONB DEFAULT '{}'::jsonb NOT NULL,
    priorities JSONB DEFAULT '{}'::jsonb NOT NULL,
    key_insights TEXT,
    risk_summary TEXT DEFAULT '' NOT NULL,
    recommendations JSONB DEFAULT '[]'::jsonb NOT NULL,
    markdown_digest TEXT DEFAULT '' NOT NULL,
    html_digest TEXT DEFAULT '' NOT NULL,
    incident_count INT DEFAULT 0 NOT NULL,
    baseline_count NUMERIC(12,2),
    increase_percent NUMERIC(12,2),
    incident_spike BOOLEAN DEFAULT FALSE NOT NULL,
    recipient_count INT DEFAULT 0 NOT NULL,
    sent_count INT DEFAULT 0 NOT NULL,
    failed_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_summaries_summary_date ON daily_summaries (summary_date);

INSERT INTO daily_summaries (
    summary_date, total_received, total_pending_tickets, total_p1,
    key_insights, risk_summary, recommendations, incident_spike, incident_count,
    recipient_count, sent_count, failed_count
) VALUES (
    CURRENT_DATE,
    18,
    3,
    1,
    'Hệ thống ghi nhận 18 lượt email gửi đến hôm nay. Điểm nghẽn tập trung tại cụm API 504 vào buổi sáng, đã điều phối xử lý theo SLA.',
    'Rủi ro gián đoạn báo cáo định kỳ mức thấp, đã cô lập sự cố cụm gateway.',
    '["Tăng cường giám sát latency gateway", "Rà soát cache hệ thống trước giờ cao điểm"]'::jsonb,
    false,
    1,
    2,
    2,
    0
)
ON CONFLICT (summary_date) DO NOTHING;

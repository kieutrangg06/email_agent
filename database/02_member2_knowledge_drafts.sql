-- ====================================================================
-- DATABASE SCRIPT 02: MEMBER 2 - KNOWLEDGE BASE, DRAFTS & SUMMARIES
-- (OWNER: MEMBER 2 - feature/m2-reply-rag)
-- ====================================================================

-- Kích hoạt extension vector phục vụ tìm kiếm RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Bảng Knowledge Base phục vụ RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    topic TEXT,
    keywords TEXT,
    content TEXT NOT NULL,
    embedding vector(768), -- Embedding vector từ Gemini text-embedding-004
    category VARCHAR(50) DEFAULT 'TECH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for fast full-text & vector lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_base_title ON knowledge_base (title);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_topic ON knowledge_base (topic);

INSERT INTO knowledge_base (title, topic, keywords, content, category) VALUES
('Chính sách hoàn tiền', 'Chính sách hoàn tiền', 'hoan tien, refund, tra hang, hoan phi, payment', 'Khách hàng được quyền yêu cầu hoàn tiền 100% trong vòng 14 ngày kể từ khi kích hoạt nếu hệ thống gặp sự cố không thể khắc phục.', 'FINANCE'),
('Bảo mật dữ liệu', 'Bảo mật dữ liệu', 'bao mat, dkim, spf, ma hoa, ssl, security, tls, aes', 'Hệ thống áp dụng chuẩn mã hóa AES-256 cho dữ liệu tĩnh và TLS 1.3 cho toàn bộ kết nối truyền nhận dữ liệu trên môi trường đám mây.', 'TECH'),
('Hỗ trợ đăng nhập & Đổi mật khẩu', 'Hỗ trợ đăng nhập & Đổi mật khẩu', 'mat khau, reset password, password, dang nhap, login, quen mat khau', 'Khách hàng có thể chủ động đặt lại mật khẩu bằng cách truy cập trang cài đặt tài khoản, chọn Quên mật khẩu và xác thực qua email OTP trong vòng 15 phút.', 'TECH'),
('Cam kết chất lượng dịch vụ SLA', 'Cam kết chất lượng dịch vụ SLA', 'sla, thoi gian xu ly, cam ket, uptime, phan hoi', 'Hệ thống cam kết thời gian phản hồi ban đầu trong 2 giờ đối với sự cố mức P1 (Khẩn cấp), 8 giờ đối với P2 (Nghiêm trọng), và 24 giờ đối với các yêu cầu thông thường.', 'TECH'),
('Hạn mức gọi API và Giới hạn tốc độ', 'Hạn mức gọi API và Giới hạn tốc độ', 'rate limit, api limit, han muc, request per minute, quota', 'Mỗi tài khoản doanh nghiệp được cấp hạn mức mặc định là 1.000 requests/phút. Trường hợp cần tăng quota cho sự kiện quy mô lớn, vui lòng liên hệ Tech Support trước 48 giờ.', 'TECH')
ON CONFLICT DO NOTHING;

-- 2. Bảng Email Drafts chờ Human Approval (Human-in-the-Loop)
CREATE TABLE IF NOT EXISTS email_drafts (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES tickets(id),
    ticket_code TEXT,
    recipient_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    proposed_subject TEXT,
    proposed_body TEXT,
    confidence_score NUMERIC(5,2) DEFAULT 85.0,
    status VARCHAR(20) DEFAULT 'PENDING_APPROVAL' NOT NULL, -- PENDING_APPROVAL, SENT, REJECTED, APPROVED, MODIFIED
    sender_name VARCHAR(150),
    original_subject TEXT DEFAULT '' NOT NULL,
    original_body TEXT DEFAULT '' NOT NULL,
    knowledge_context JSONB DEFAULT '[]'::jsonb NOT NULL,
    approval_resume_url TEXT,
    n8n_execution_id VARCHAR(100),
    received_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    sent_at TIMESTAMP,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_drafts_status_created_at ON email_drafts (status, created_at DESC);

-- 3. Bảng Phản hồi / Bình luận của vé (Ticket Comments)
CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES tickets(id),
    author_type VARCHAR(20) NOT NULL, -- SYSTEM, AI_AGENT, HUMAN_AGENT
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Bảng Người nhận báo cáo điều hành hằng ngày
CREATE TABLE IF NOT EXISTS daily_digest_recipients (
    id SERIAL PRIMARY KEY,
    director_name VARCHAR(100) NOT NULL DEFAULT 'Ban Giám Đốc',
    email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_type VARCHAR(20) DEFAULT 'EXECUTIVE',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO daily_digest_recipients (director_name, email, recipient_email, recipient_type, is_active) VALUES
('Nguyễn Văn Giám Đốc', 'director@company.com', 'director@company.com', 'EXECUTIVE', true),
('Trần Thị Phó Giám Đốc', 'deputy-director@company.com', 'deputy-director@company.com', 'EXECUTIVE', true),
('Lê Tech Lead', 'tech-lead@vku.udn.vn', 'tech-lead@vku.udn.vn', 'OPERATIONS', true)
ON CONFLICT DO NOTHING;

-- 5. Bảng Báo cáo điều hành hằng ngày (Daily Summaries & Incident Spike Detection)
CREATE TABLE IF NOT EXISTS daily_summaries (
    id SERIAL PRIMARY KEY,
    report_date DATE UNIQUE NOT NULL,
    summary_date DATE,
    total_emails_received INT DEFAULT 0,
    total_tickets_created INT DEFAULT 0,
    sla_compliance_rate NUMERIC(5,2) DEFAULT 100.0,
    executive_summary TEXT,
    anomaly_detected BOOLEAN DEFAULT FALSE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_report_date ON daily_summaries (report_date);

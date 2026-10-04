-- ====================================================================
-- DATABASE SCRIPT 02: MEMBER 2 - KNOWLEDGE BASE, DRAFTS & SUMMARIES
-- (OWNER: MEMBER 2 - feature/m2-reply-rag)
-- ====================================================================

-- 1. Bảng Knowledge Base phục vụ RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    keywords TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO knowledge_base (topic, keywords, content) VALUES
('Chính sách hoàn tiền', 'hoan tien, refund, tra hang, hoan phi', 'Khách hàng được quyền yêu cầu hoàn tiền 100% trong vòng 14 ngày kể từ khi kích hoạt nếu hệ thống gặp sự cố không thể khắc phục.'),
('Bảo mật dữ liệu', 'bao mat, dkim, spf, ma hoa, ssl', 'Hệ thống áp dụng chuẩn mã hóa AES-256 cho dữ liệu tĩnh và TLS 1.3 cho toàn bộ kết nối truyền nhận.')
ON CONFLICT DO NOTHING;

-- 2. Bảng Email Drafts chờ Human Approval
CREATE TABLE IF NOT EXISTS email_drafts (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(50),
    recipient_email VARCHAR(255) NOT NULL,
    proposed_subject TEXT NOT NULL,
    proposed_body TEXT NOT NULL,
    confidence_score NUMERIC(5,2),
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'MODIFIED', 'REJECTED', 'SENT'
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Báo cáo điều hành hằng ngày
CREATE TABLE IF NOT EXISTS daily_summaries (
    id SERIAL PRIMARY KEY,
    summary_date DATE DEFAULT CURRENT_DATE,
    total_received INT DEFAULT 0,
    total_p1 INT DEFAULT 0,
    key_insights TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Seed Data for Testing
INSERT INTO email_drafts (ticket_code, recipient_email, proposed_subject, proposed_body, confidence_score, status)
VALUES
('TICK-2026-0001', 'client-alpha@enterprise.vn', 'Re: Thông báo tiếp nhận sự cố kỹ thuật 504', 'Kính gửi Quý khách, Đội ngũ kỹ thuật đã xác định được nguyên nhân do sự cố nghẽn mạng và đang tiến hành khắc phục khẩn cấp. SLA dự kiến hoàn tất trong 2 giờ tới.', 94.50, 'PENDING_APPROVAL')
ON CONFLICT DO NOTHING;

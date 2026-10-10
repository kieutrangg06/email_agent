-- ====================================================================
-- MEMBER 1 DATABASE: CORE SCHEMA, REPUTATION & QUARANTINE VAULT
-- ====================================================================

-- 1. Departments table (Theo chuẩn đề án + tương thích UI)
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE, -- 'TECH', 'SALES', 'FINANCE', 'GENERAL'
    name VARCHAR(100) UNIQUE NOT NULL,
    manager_email VARCHAR(255),
    head_email VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (code, name, description, manager_email, head_email, is_active) VALUES
('TECH', 'Technical', 'Khắc phục sự cố API, hạ tầng cơ sở dữ liệu, lỗi phân quyền hệ thống', 'tranglee12306@gmail.com', 'tranglee12306@gmail.com', true),
('SALES', 'Sales', 'Tiếp nhận yêu cầu báo giá, tư vấn bản quyền phần mềm, hợp đồng triển khai', 'tranglee12306@gmail.com', 'tranglee12306@gmail.com', true),
('FINANCE', 'Finance', 'Tiếp nhận đối soát sao kê, xuất hóa đơn điện tử VAT, thanh toán đối tác', 'tranglee12306@gmail.com', 'tranglee12306@gmail.com', true),
('GENERAL', 'General', 'Hỗ trợ giải đáp chung, điều phối lịch làm việc & hỗ trợ khách hàng', 'tranglee12306@gmail.com', 'tranglee12306@gmail.com', true)
ON CONFLICT (name) DO UPDATE SET 
    code = EXCLUDED.code, 
    description = EXCLUDED.description, 
    manager_email = EXCLUDED.manager_email,
    head_email = EXCLUDED.head_email,
    is_active = EXCLUDED.is_active;

-- 2. Sender Reputation (Whitelist / Blacklist / Reputation Score 0-100)
CREATE TABLE IF NOT EXISTS email_senders_reputation (
    id SERIAL PRIMARY KEY,
    sender_email VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    reputation_score INT DEFAULT 100, -- 0 đến 100
    failed_attempts INT DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'neutral', -- 'whitelist', 'blacklist', 'neutral', 'suspicious'
    notes TEXT,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bổ sung cột nếu bảng đã tồn tại từ trước
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_senders_reputation' AND column_name='sender_email') THEN
        ALTER TABLE email_senders_reputation ADD COLUMN sender_email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_senders_reputation' AND column_name='reputation_score') THEN
        ALTER TABLE email_senders_reputation ADD COLUMN reputation_score INT DEFAULT 100;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_senders_reputation' AND column_name='failed_attempts') THEN
        ALTER TABLE email_senders_reputation ADD COLUMN failed_attempts INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_senders_reputation' AND column_name='is_blocked') THEN
        ALTER TABLE email_senders_reputation ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_senders_reputation' AND column_name='last_seen_at') THEN
        ALTER TABLE email_senders_reputation ADD COLUMN last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

INSERT INTO email_senders_reputation (sender_email, email, reputation_score, failed_attempts, is_blocked, status, notes) VALUES
('spammer@evil.com', 'spammer@evil.com', 0, 5, true, 'blacklist', 'Máy chủ phát tán mã độc lừa đảo tiền số'),
('phishing@malicious-bank.xyz', 'phishing@malicious-bank.xyz', 0, 8, true, 'blacklist', 'Chiến dịch phishing giả mạo cổng thanh toán'),
('no-reply-marketing@bulkmailer.biz', 'no-reply-marketing@bulkmailer.biz', 10, 3, true, 'blacklist', 'Hệ thống gửi email rác hàng loạt')
ON CONFLICT (email) DO UPDATE SET 
    sender_email = EXCLUDED.sender_email,
    reputation_score = EXCLUDED.reputation_score,
    is_blocked = EXCLUDED.is_blocked;

-- 3. Email Quarantine Vault (Khu vực cách ly email độc hại / vi phạm)
CREATE TABLE IF NOT EXISTS email_quarantine_vault (
    id SERIAL PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    subject TEXT,
    raw_payload JSONB,
    quarantine_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. System Global Audit Logs
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) DEFAULT 'm1-system',
    event_type VARCHAR(100) NOT NULL,
    workflow_id VARCHAR(50),
    description TEXT,
    payload JSONB,
    payload_snapshot JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

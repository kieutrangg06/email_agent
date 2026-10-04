-- ====================================================================
-- DATABASE SCRIPT 00: CORE SCHEMA & REPUTATION (OWNER: TEAM LEAD)
-- ====================================================================

-- 1. Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    head_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (name, description, head_email) VALUES
('Technical', 'Khắc phục sự cố API, hạ tầng cơ sở dữ liệu, lỗi phân quyền hệ thống', 'tech-lead@vku.udn.vn'),
('Sales', 'Tiếp nhận yêu cầu báo giá, tư vấn bản quyền phần mềm, hợp đồng triển khai', 'sales@vku.udn.vn'),
('Finance', 'Tiếp nhận đối soát sao kê, xuất hóa đơn điện tử VAT, thanh toán đối tác', 'accounting@vku.udn.vn'),
('General', 'Hỗ trợ giải đáp chung, điều phối lịch làm việc & hỗ trợ khách hàng', 'cskh@vku.udn.vn')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, head_email = EXCLUDED.head_email;

-- 2. Sender Reputation (Whitelist / Blacklist)
CREATE TABLE IF NOT EXISTS email_senders_reputation (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'neutral', -- 'whitelist', 'blacklist', 'neutral'
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO email_senders_reputation (email, status, notes) VALUES
('spammer@evil.com', 'blacklist', 'Máy chủ phát tán mã độc lừa đảo tiền số'),
('no-reply-marketing@bulkmailer.biz', 'blacklist', 'Hệ thống gửi email rác hàng loạt')
ON CONFLICT (email) DO NOTHING;

-- 3. System Global Audit Logs
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) DEFAULT 'n8n-system',
    event_type VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

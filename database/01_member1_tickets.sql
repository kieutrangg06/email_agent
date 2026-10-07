-- ====================================================================
-- DATABASE SCRIPT 01: MEMBER 1 - TRIAGE & TICKETS
-- (OWNER: MEMBER 1 - feature/m1-triage-ticket)
-- ====================================================================

-- 1. Bảng lưu trữ Triage Logs (Luồng 1: AI Email Triage & Routing)
CREATE TABLE IF NOT EXISTS email_triage_logs (
    id SERIAL PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(100),
    subject TEXT NOT NULL,
    body_snippet TEXT,
    category VARCHAR(50) NOT NULL, -- 'Technical', 'Sales', 'Finance', 'General'
    priority VARCHAR(20) NOT NULL, -- 'P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'
    sentiment VARCHAR(50) NOT NULL, -- 'Khan cap', 'Tich cuc', 'Tieu cuc', 'Trung tinh'
    urgency_reason TEXT,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'DROPPED', 'ASSIGNED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tương thích các cột nếu bảng đã tồn tại
ALTER TABLE email_triage_logs ADD COLUMN IF NOT EXISTS sender_name VARCHAR(100);
ALTER TABLE email_triage_logs ADD COLUMN IF NOT EXISTS body_snippet TEXT;
ALTER TABLE email_triage_logs ADD COLUMN IF NOT EXISTS urgency_reason TEXT;
ALTER TABLE email_triage_logs ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_triage_logs ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING';

-- 2. Bảng Chuyên viên Hỗ trợ (Support Agents - phục vụ Luồng 2 điều phối vé)
CREATE TABLE IF NOT EXISTS support_agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Technical', 'Sales', 'Finance', 'General'
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'BUSY', 'OFFLINE'
    active_tickets_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Chuyên viên hỗ trợ
INSERT INTO support_agents (name, email, category, status, active_tickets_count) VALUES
('Nguyễn Văn An', 'an.nguyen@enterprise.vn', 'Technical', 'AVAILABLE', 1),
('Trần Hoàng Bách', 'bach.tran@enterprise.vn', 'Technical', 'AVAILABLE', 0),
('Lê Thị Mai', 'mai.le@enterprise.vn', 'Sales', 'AVAILABLE', 0),
('Phạm Đức Trọng', 'trong.pham@enterprise.vn', 'Finance', 'AVAILABLE', 0),
('Đỗ Thúy Vy', 'vy.do@enterprise.vn', 'General', 'AVAILABLE', 0)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    status = EXCLUDED.status;

-- 3. Bảng Tickets & SLA (Luồng 2: Ticket Generation & SLA Dispatching)
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(50) UNIQUE NOT NULL, -- 'TICK-2026-XXXX'
    sender_email VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    summary TEXT,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'P3 - Medium',
    assigned_to VARCHAR(100) NOT NULL,
    agent_email VARCHAR(255),
    first_response_sla TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Tương thích các cột nếu bảng đã tồn tại
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS agent_email VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS first_response_sla TIMESTAMP WITH TIME ZONE;

-- Chỉ mục tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_triage_status ON email_triage_logs(status);
CREATE INDEX IF NOT EXISTS idx_triage_category ON email_triage_logs(category);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- 4. Sample Seed Data cho Kiểm thử Triage & Tickets
INSERT INTO email_triage_logs (sender_email, sender_name, subject, body_snippet, category, priority, sentiment, urgency_reason, sla_deadline, status)
VALUES
('client-alpha@enterprise.vn', 'Alpha Enterprise', 'Sự cố lỗi hệ thống API Gateway 504 Timeout', 'Hệ thống báo lỗi 504 Gateway Timeout trên production từ 08:30 sáng, khách hàng không thanh toán được.', 'Technical', 'P1 - Critical', 'Khan cap', 'Sự cố hạ tầng nghiêm trọng ảnh hưởng trực tiếp đến thanh toán', NOW() + INTERVAL '2 hours', 'PROCESSED'),
('sales-lead@vietcorp.com', 'VietCorp Director', 'Đề xuất báo giá gói dịch vụ Doanh nghiệp Enterprise Cloud', 'Chúng tôi quan tâm đến giải pháp tự động hóa email cho 200 người dùng, đề nghị gửi bảng báo giá chi tiết.', 'Sales', 'P2 - High', 'Tich cuc', 'Cơ hội hợp đồng quy mô lớn cần phản hồi nhanh', NOW() + INTERVAL '4 hours', 'PROCESSED'),
('accounting@vendor.vn', 'Vendor Finance', 'Yêu cầu đối soát công nợ quý 3 và xuất hóa đơn điện tử', 'Kính gửi quý công ty bảng đối soát công nợ tháng 9, đề nghị kiểm tra và xác nhận thanh toán trước ngày 10.', 'Finance', 'P3 - Medium', 'Trung tinh', 'Yêu cầu chứng từ đối soát định kỳ theo quy trình kế toán', NOW() + INTERVAL '8 hours', 'PENDING')
ON CONFLICT DO NOTHING;

INSERT INTO tickets (ticket_code, sender_email, title, description, summary, category, priority, assigned_to, agent_email, first_response_sla, status)
VALUES
('TICK-2026-0001', 'client-alpha@enterprise.vn', 'Lỗi API 504 Gateway Timeout trên production', 'Khách hàng phản ánh hệ thống không truy cập được từ 08:30 sáng nay, giao dịch bị gián đoạn.', 'Hạ tầng cổng thanh toán timeout liên tục, nghi vấn nghẽn kết nối database pool.', 'Technical', 'P1 - Critical', 'Nguyễn Văn An', 'tranglee12306@gmail.com', NOW() + INTERVAL '2 hours', 'OPEN'),
('TICK-2026-0002', 'user-beta@techhub.io', 'Tài khoản quản trị viên bị khóa sau khi đổi mật khẩu', 'Tôi vừa thay đổi mật khẩu quản trị nhưng sau đó không thể đăng nhập được vào trang admin.', 'Lỗi đồng bộ token phiên đăng nhập sau thao tác đổi mật khẩu của admin.', 'Technical', 'P2 - High', 'Trần Hoàng Bách', 'tranglee12306@gmail.com', NOW() + INTERVAL '4 hours', 'IN_PROGRESS'),
('TICK-2026-0003', 'support@client-gamma.com', 'Hướng dẫn cấu hình Webhook tích hợp CRM ngoài', 'Xin hỗ trợ tài liệu kết nối webhook của hệ thống với nền tảng nội bộ bên công ty chúng tôi.', 'Yêu cầu tài liệu API specification và sample payload cho webhook endpoint.', 'General', 'P4 - Low', 'Đỗ Thúy Vy', 'tranglee12306@gmail.com', NOW() + INTERVAL '24 hours', 'RESOLVED')
ON CONFLICT (ticket_code) DO NOTHING;

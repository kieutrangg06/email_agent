-- ====================================================================
-- COMBINED INIT SQL FOR MEMBER 1: EMAIL TRIAGE & HELPDESK SLA
-- Chuẩn hóa theo Đề án Micro-Workflows: 3 Luồng x 12 Nodes
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS vector;

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

-- 5. Bảng lưu trữ Triage Logs (Luồng 1 & 2: Ingest & AI Triage - Agent 1)
CREATE TABLE IF NOT EXISTS email_triage_logs (
    id SERIAL PRIMARY KEY,
    inbound_email VARCHAR(255),
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(100),
    subject TEXT NOT NULL,
    body_snippet TEXT,
    classified_department VARCHAR(50), -- 'TECH', 'SALES', 'FINANCE', 'GENERAL'
    category VARCHAR(50) NOT NULL, -- 'Technical', 'Sales', 'Finance', 'General'
    priority VARCHAR(20) NOT NULL, -- 'P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low' hoặc 'P1', 'P2', 'P3', 'P4'
    sentiment VARCHAR(50) NOT NULL, -- 'Khan cap', 'Tich cuc', 'Tieu cuc', 'Trung tinh'
    confidence_score NUMERIC(4,2) DEFAULT 0.95,
    urgency_reason TEXT,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Chuyên viên Hỗ trợ (Support Agents - Phục vụ Luồng 3 điều phối vé)
CREATE TABLE IF NOT EXISTS support_agents (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    name VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    department_id INT REFERENCES departments(id),
    category VARCHAR(50) NOT NULL, -- 'Technical', 'Sales', 'Finance', 'General'
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'BUSY', 'OFFLINE'
    is_active BOOLEAN DEFAULT TRUE,
    active_tickets_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO support_agents (name, full_name, email, category, status, is_active, active_tickets_count) VALUES
('Nguyễn Văn An', 'Nguyễn Văn An', 'tranglee12306@gmail.com', 'Technical', 'AVAILABLE', true, 0),
('Trần Hoàng Bách', 'Trần Hoàng Bách', 'tranglee12306@gmail.com', 'Technical', 'AVAILABLE', true, 0),
('Lê Thị Mai', 'Lê Thị Mai', 'tranglee12306@gmail.com', 'Sales', 'AVAILABLE', true, 0),
('Phạm Đức Trọng', 'Phạm Đức Trọng', 'tranglee12306@gmail.com', 'Finance', 'AVAILABLE', true, 0),
('Đỗ Thúy Vy', 'Đỗ Thúy Vy', 'tranglee12306@gmail.com', 'General', 'AVAILABLE', true, 0)
ON CONFLICT (name) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_active = EXCLUDED.is_active;

-- 7. Bảng Tickets & SLA (Luồng 3: Ticket Generation & SLA Dispatching)
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(50) UNIQUE NOT NULL, -- 'TK-YYYYMMDD-XXXX' hoặc 'TICK-2026-XXXX'
    customer_email VARCHAR(255),
    sender_email VARCHAR(255) NOT NULL,
    subject TEXT,
    title TEXT NOT NULL,
    description TEXT,
    summary TEXT,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'P3 - Medium',
    assigned_agent_id INT REFERENCES support_agents(id),
    assigned_to VARCHAR(100) NOT NULL,
    agent_email VARCHAR(255),
    sla_due_at TIMESTAMP WITH TIME ZONE,
    first_response_sla TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 8. Bảng Ghi chú và Phân tích Sự cố (Ticket Comments - Phục vụ Node 8 Luồng 3)
CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INT REFERENCES tickets(id),
    ticket_code VARCHAR(50),
    author_type VARCHAR(20) NOT NULL, -- 'SYSTEM', 'AI_AGENT', 'HUMAN_AGENT'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes tối ưu hiệu năng
CREATE INDEX IF NOT EXISTS idx_triage_status ON email_triage_logs(status);
CREATE INDEX IF NOT EXISTS idx_triage_category ON email_triage_logs(category);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_code ON ticket_comments(ticket_code);

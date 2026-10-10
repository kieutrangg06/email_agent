-- ====================================================================
-- MEMBER 1 DATABASE: TRIAGE LOGS, AGENTS & TICKETS
-- ====================================================================

-- 1. Bảng lưu trữ Triage Logs (Luồng 1 & 2: Ingest & AI Triage)
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

-- 2. Bảng Chuyên viên Hỗ trợ (Support Agents - Phục vụ Luồng 3 điều phối vé)
CREATE TABLE IF NOT EXISTS support_agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Technical', 'Sales', 'Finance', 'General'
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'BUSY', 'OFFLINE'
    active_tickets_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO support_agents (name, email, category, status, active_tickets_count) VALUES
('Nguyễn Văn An', 'tranglee12306@gmail.com', 'Technical', 'AVAILABLE', 0),
('Trần Hoàng Bách', 'tranglee12306@gmail.com', 'Technical', 'AVAILABLE', 0),
('Lê Thị Mai', 'tranglee12306@gmail.com', 'Sales', 'AVAILABLE', 0),
('Phạm Đức Trọng', 'tranglee12306@gmail.com', 'Finance', 'AVAILABLE', 0),
('Đỗ Thúy Vy', 'tranglee12306@gmail.com', 'General', 'AVAILABLE', 0)
ON CONFLICT (name) DO UPDATE SET email = EXCLUDED.email;

-- 3. Bảng Tickets & SLA (Luồng 3: Ticket Generation & SLA Dispatching)
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

-- Indexes tối ưu hiệu năng
CREATE INDEX IF NOT EXISTS idx_triage_status ON email_triage_logs(status);
CREATE INDEX IF NOT EXISTS idx_triage_category ON email_triage_logs(category);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

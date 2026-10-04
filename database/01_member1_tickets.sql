-- ====================================================================
-- DATABASE SCRIPT 01: MEMBER 1 - TRIAGE & TICKETS
-- (OWNER: MEMBER 1 - feature/m1-triage-tickets)
-- ====================================================================

-- 1. Bảng phục vụ Luồng 1 (Triage Logs)
CREATE TABLE IF NOT EXISTS email_triage_logs (
    id SERIAL PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(100),
    subject TEXT NOT NULL,
    body_snippet TEXT,
    category VARCHAR(50) NOT NULL, -- 'Technical', 'Sales', 'Finance', 'General'
    priority VARCHAR(20) NOT NULL, -- 'P1', 'P2', 'P3', 'P4'
    sentiment VARCHAR(20) NOT NULL, -- 'Positive', 'Neutral', 'Negative', 'Urgent'
    urgency_reason TEXT,
    sla_deadline TIMESTAMP,
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng phục vụ Luồng 2 (Tickets)
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(50) UNIQUE NOT NULL, -- 'TICK-2026-XXXX'
    sender_email VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50),
    assigned_to VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'P3',
    status VARCHAR(30) DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    first_response_sla TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Seed Data for Testing
INSERT INTO tickets (ticket_code, sender_email, title, description, category, assigned_to, priority, status, first_response_sla)
VALUES 
('TICK-2026-0001', 'client-alpha@enterprise.vn', 'Lỗi API 504 Gateway Timeout trên production', 'Khách hàng phản ánh hệ thống không truy cập được từ 08:30 sáng nay.', 'Technical', 'Nguyen Van Tech', 'P1', 'OPEN', CURRENT_TIMESTAMP + INTERVAL '2 hours')
ON CONFLICT (ticket_code) DO NOTHING;

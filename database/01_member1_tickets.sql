-- ====================================================================
-- MEMBER 1 DATABASE: TRIAGE LOGS, AGENTS, TICKETS & COMMENTS
-- ====================================================================

-- 1. Bảng lưu trữ Triage Logs (Luồng 1 & 2: Ingest & AI Triage - Agent 1)
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
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'DROPPED', 'ASSIGNED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bổ sung cột nếu bảng đã có từ trước
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_triage_logs' AND column_name='inbound_email') THEN
        ALTER TABLE email_triage_logs ADD COLUMN inbound_email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_triage_logs' AND column_name='classified_department') THEN
        ALTER TABLE email_triage_logs ADD COLUMN classified_department VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_triage_logs' AND column_name='confidence_score') THEN
        ALTER TABLE email_triage_logs ADD COLUMN confidence_score NUMERIC(4,2) DEFAULT 0.95;
    END IF;
END $$;

-- 2. Bảng Chuyên viên Hỗ trợ (Support Agents - Phục vụ Luồng 3 điều phối vé)
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

-- Bổ sung cột nếu bảng đã có từ trước
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_agents' AND column_name='full_name') THEN
        ALTER TABLE support_agents ADD COLUMN full_name VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_agents' AND column_name='is_active') THEN
        ALTER TABLE support_agents ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_agents' AND column_name='department_id') THEN
        ALTER TABLE support_agents ADD COLUMN department_id INT REFERENCES departments(id);
    END IF;
END $$;

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

-- 3. Bảng Tickets & SLA (Luồng 3: Ticket Generation & SLA Dispatching)
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
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Bổ sung cột nếu bảng đã có từ trước
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='customer_email') THEN
        ALTER TABLE tickets ADD COLUMN customer_email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='subject') THEN
        ALTER TABLE tickets ADD COLUMN subject TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='sla_due_at') THEN
        ALTER TABLE tickets ADD COLUMN sla_due_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='assigned_agent_id') THEN
        ALTER TABLE tickets ADD COLUMN assigned_agent_id INT REFERENCES support_agents(id);
    END IF;
END $$;

-- 4. Bảng Ghi chú và Phân tích Sự cố (Ticket Comments - Phục vụ Node 8 Luồng 3)
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


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
-- ====================================================================
-- DATABASE SCRIPT 03: MEMBER 3 - CRM GROWTH, NURTURING & FINANCE INVOICES
-- (OWNER: MEMBER 3 - feature/m3-crm-ocr)
-- Chuẩn hóa theo Đề án Micro-Workflows: 3 Luồng x 12 Nodes
-- ====================================================================

-- 1. Bảng Khách hàng CRM (crm_customers - Phục vụ Luồng 7)
CREATE TABLE IF NOT EXISTS crm_customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    company_name VARCHAR(150),
    lead_score INT DEFAULT 0, -- 0 đến 100
    is_unsubscribed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON crm_customers (email);
CREATE INDEX IF NOT EXISTS idx_crm_customers_score ON crm_customers (lead_score);

-- 2. Bảng Cơ hội bán hàng (crm_deals - Phục vụ Luồng 7 & Luồng 8)
CREATE TABLE IF NOT EXISTS crm_deals (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES crm_customers(id) ON DELETE CASCADE,
    deal_name VARCHAR(200) NOT NULL,
    expected_budget NUMERIC(15,2) DEFAULT 0,
    stage VARCHAR(30) DEFAULT 'NEW_INQUIRY', -- NEW_INQUIRY, QUOTED, COLD_LEAD, WON, LOST
    campaign_tag VARCHAR(50) DEFAULT 'ORGANIC',
    assigned_sales_rep VARCHAR(100) DEFAULT 'Nguyễn Văn An',
    followup_count INT DEFAULT 0,
    last_contacted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals (stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_last_contacted ON crm_deals (last_contacted_at);

-- 3. Bảng Hóa đơn Kế toán & Đối soát số học (finance_invoices - Phục vụ Luồng 9)
CREATE TABLE IF NOT EXISTS finance_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    seller_tax_id VARCHAR(50),
    seller_name VARCHAR(255),
    buyer_name VARCHAR(255),
    buyer_email VARCHAR(255),
    issue_date DATE DEFAULT CURRENT_DATE,
    subtotal NUMERIC(15,2) DEFAULT 0,
    vat_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    math_status VARCHAR(30) DEFAULT 'VALIDATED', -- VALIDATED, DISCREPANCY_FLAGGED
    file_storage_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_invoices_number ON finance_invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_finance_invoices_status ON finance_invoices (math_status);

-- ====================================================================
-- SEED DATA THỬ NGHIỆM CHO THÀNH VIÊN 3
-- ====================================================================

-- Seed Khách hàng CRM
INSERT INTO crm_customers (full_name, email, phone, company_name, lead_score, is_unsubscribed) VALUES
('Trần Văn Bình', 'director@vietcorp.vn', '0912345678', 'Viet Solution Corp', 90, false),
('Mai Hương Lan', 'lan.mai@vku.udn.vn', '0988776655', 'Đại học VKU', 85, false),
('Nguyễn Văn Minh', 'contact@partner.vn', '0903334444', 'Minh Phát Logistics', 65, false)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    company_name = EXCLUDED.company_name,
    lead_score = EXCLUDED.lead_score;

-- Seed Cơ hội bán hàng CRM Deals
INSERT INTO crm_deals (customer_id, deal_name, expected_budget, stage, campaign_tag, followup_count, last_contacted_at) VALUES
(1, 'Hợp đồng phần mềm ERP Doanh nghiệp', 120000000, 'NEW_INQUIRY', 'ENTERPRISE_HIGH_VALUE', 0, NOW()),
(2, 'Hệ thống AI Email Helpdesk VKU', 60000000, 'QUOTED', 'ENTERPRISE_HIGH_VALUE', 1, NOW() - INTERVAL '3 days'),
(3, 'Tư vấn giải pháp quản lý kho', 15000000, 'QUOTED', 'SME_RETAIL', 2, NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- Seed Hóa đơn Kế toán (Valid vs Discrepancy Flagged)
INSERT INTO finance_invoices (invoice_number, seller_tax_id, seller_name, buyer_name, buyer_email, issue_date, subtotal, vat_amount, total_amount, math_status, file_storage_path) VALUES
('INV-2026-0899', '0101234567', 'Công ty TNHH Thiết Bị Điện Tử', 'Trần Văn Bình', 'director@vietcorp.vn', '2026-10-02', 10000000.00, 1000000.00, 11000000.00, 'VALIDATED', '/var/storage/invoices/inv_2026_0899.pdf'),
('INV-2026-0900', '0309876543', 'Công ty Cổ phần Logistics Global', 'Nguyễn Văn Minh', 'contact@partner.vn', '2026-10-03', 5000000.00, 500000.00, 5800000.00, 'DISCREPANCY_FLAGGED', '/var/storage/invoices/inv_2026_0900.pdf'),
('INV-843950', '0402123456', 'Công ty Cổ phần Giải pháp Số NovaCRM', 'Tập Đoàn An Phát', 'contact@anphat.vn', '2026-10-04', 50000000.00, 5000000.00, 55000000.00, 'VALIDATED', '/var/storage/invoices/inv_843950.png')
ON CONFLICT (invoice_number) DO UPDATE SET
    subtotal = EXCLUDED.subtotal,
    vat_amount = EXCLUDED.vat_amount,
    total_amount = EXCLUDED.total_amount,
    math_status = EXCLUDED.math_status;

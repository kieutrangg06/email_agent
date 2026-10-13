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

-- ====================================================================
-- DATABASE SCRIPT 03: MEMBER 3 - CRM LEADS & FINANCE INVOICES
-- (OWNER: MEMBER 3 - feature/m3-crm-ocr)
-- ====================================================================

-- 1. Bảng CRM Customers & Leads
CREATE TABLE IF NOT EXISTS crm_customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    company VARCHAR(150),
    phone VARCHAR(30),
    lead_score INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'NEW', -- 'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Hóa đơn kế toán & kết quả OCR
CREATE TABLE IF NOT EXISTS finance_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_name VARCHAR(150),
    tax_code VARCHAR(30),
    subtotal NUMERIC(15,2),
    vat_amount NUMERIC(15,2),
    total_amount NUMERIC(15,2),
    is_valid BOOLEAN DEFAULT TRUE,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Seed Data for Testing
INSERT INTO crm_customers (email, full_name, company, phone, lead_score, status)
VALUES
('director@vietcorp.vn', 'Tran Van Binh', 'Viet Solution Corp', '0912345678', 85, 'QUALIFIED')
ON CONFLICT (email) DO NOTHING;

INSERT INTO finance_invoices (invoice_number, vendor_name, tax_code, subtotal, vat_amount, total_amount, is_valid)
VALUES
('INV-2026-0899', 'Cong Ty TNHH Thiet Bi Dien Tu', '0101234567', 10000000.00, 1000000.00, 11000000.00, TRUE)
ON CONFLICT (invoice_number) DO NOTHING;

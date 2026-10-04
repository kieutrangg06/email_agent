-- ====================================================================
-- DATABASE SCRIPT 03: MEMBER 3 - CRM LEADS & FINANCE INVOICES
-- (OWNER: MEMBER 3 - feature/m3-crm-ocr)
-- ====================================================================

-- 1. Bảng CRM Customers & Leads (Luồng 5: Lead Extraction & Scoring)
CREATE TABLE IF NOT EXISTS crm_customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    company VARCHAR(150),
    phone VARCHAR(30),
    lead_score INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'NEW', -- 'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'PRIORITY_SALES', 'FOLLOWED_UP'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Đảm bảo tương thích các trường bổ sung cho crm_customers
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS company VARCHAR(150);
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'NEW';
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Bảng Hóa đơn kế toán & kết quả OCR (Luồng 6: Invoice OCR & Math Audit)
CREATE TABLE IF NOT EXISTS finance_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    vendor_name VARCHAR(255),
    seller_name VARCHAR(255),
    tax_code VARCHAR(50),
    buyer_name VARCHAR(255),
    buyer_email VARCHAR(255),
    subtotal NUMERIC(15,2),
    vat_amount NUMERIC(15,2),
    total_amount NUMERIC(15,2),
    is_valid BOOLEAN DEFAULT TRUE,
    file_path TEXT,
    storage_path TEXT,
    status VARCHAR(50) DEFAULT 'VALID', -- 'VALID', 'FLAGGED_SUSPICIOUS', 'REJECTED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Đảm bảo tương thích hai chiều (vendor_name/seller_name, file_path/storage_path, is_valid/status)
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255);
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT TRUE;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255);
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'VALID';

-- Đồng bộ dữ liệu hiện có
UPDATE finance_invoices SET vendor_name = COALESCE(vendor_name, seller_name, 'Doanh nghiệp phát hành');
UPDATE finance_invoices SET seller_name = COALESCE(seller_name, vendor_name, 'Doanh nghiệp phát hành');
UPDATE finance_invoices SET file_path = COALESCE(file_path, storage_path, '');
UPDATE finance_invoices SET storage_path = COALESCE(storage_path, file_path, '');
UPDATE finance_invoices SET is_valid = (status = 'VALID' OR ABS((COALESCE(subtotal,0) + COALESCE(vat_amount,0)) - COALESCE(total_amount,0)) < 0.01);

-- 3. Bảng Nhật ký đối soát và kiểm toán tài chính (Finance Audit Logs)
CREATE TABLE IF NOT EXISTS finance_audit_logs (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100),
    audit_status VARCHAR(50), -- 'AUDIT_PASSED', 'AUDIT_FLAGGED_MATH_MISMATCH', 'AUDIT_REJECTED'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Seed Data & Testing Records
-- ====================================================================

-- CRM Customer Seeds
INSERT INTO crm_customers (email, full_name, company, phone, lead_score, status)
VALUES
('khoa.tran@example.com', 'Trần Anh Khoa', 'Tập đoàn Công nghệ Alpha', '0912345678', 90, 'PRIORITY_SALES'),
('director@vietcorp.vn', 'Trần Văn Bình', 'Viet Solution Corp', '0912345678', 85, 'QUALIFIED'),
('lan.mai@vku.udn.vn', 'Mai Hương Lan', 'Đại học VKU', '0988776655', 65, 'FOLLOWED_UP'),
('contact@partner.vn', 'Nguyễn Văn Minh', 'Minh Phát Logistics', '0903334444', 85, 'QUALIFIED'),
('nguyencookie7@gmail.com', 'Nguyễn Hoài Vy', 'Công ty TNHH Giải Pháp Sáng Tạo Cookie', '0905123987', 95, 'PRIORITY_SALES')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    company = EXCLUDED.company,
    phone = EXCLUDED.phone,
    lead_score = EXCLUDED.lead_score,
    status = EXCLUDED.status;

-- Finance Invoices Seeds (Math Valid vs Flagged Suspicious)
INSERT INTO finance_invoices (invoice_number, issue_date, vendor_name, seller_name, tax_code, buyer_name, buyer_email, subtotal, vat_amount, total_amount, is_valid, storage_path, file_path, status)
VALUES
(
    'INV-2026-0899',
    '2026-10-02',
    'Công ty TNHH Thiết Bị Điện Tử',
    'Công ty TNHH Thiết Bị Điện Tử',
    '0101234567',
    'Trần Văn Bình',
    'director@vietcorp.vn',
    10000000.00,
    1000000.00,
    11000000.00,
    TRUE,
    '/var/storage/invoices/inv_2026_0899.pdf',
    '/var/storage/invoices/inv_2026_0899.pdf',
    'VALID'
),
(
    'INV-843950',
    '2026-10-02',
    'Công ty Cổ phần Giải pháp Số NovaCRM',
    'Công ty Cổ phần Giải pháp Số NovaCRM',
    '0402123456',
    'Tập Đoàn Thương Mại An Phát',
    'mhuonglan89@gmail.com',
    50000000.00,
    5000000.00,
    55000000.00,
    TRUE,
    '/var/storage/invoices/1790904930536_scan_hoadon_vat.png',
    '/var/storage/invoices/1790904930536_scan_hoadon_vat.png',
    'VALID'
),
(
    'INV-2026-0900',
    '2026-10-03',
    'Công ty Cổ phần Logistics Global',
    'Công ty Cổ phần Logistics Global',
    '0309876543',
    'Nguyễn Văn Minh',
    'contact@partner.vn',
    5000000.00,
    500000.00,
    5800000.00,
    FALSE,
    '/var/storage/invoices/inv_2026_0900.pdf',
    '/var/storage/invoices/inv_2026_0900.pdf',
    'FLAGGED_SUSPICIOUS'
)
ON CONFLICT (invoice_number) DO UPDATE SET
    vendor_name = EXCLUDED.vendor_name,
    seller_name = EXCLUDED.seller_name,
    tax_code = EXCLUDED.tax_code,
    subtotal = EXCLUDED.subtotal,
    vat_amount = EXCLUDED.vat_amount,
    total_amount = EXCLUDED.total_amount,
    is_valid = EXCLUDED.is_valid,
    status = EXCLUDED.status;

-- Finance Audit Logs Seeds
INSERT INTO finance_audit_logs (invoice_number, audit_status, notes)
VALUES
('INV-2026-0899', 'AUDIT_PASSED', 'Chứng từ hợp lệ: 10,000,000 + 1,000,000 = 11,000,000 VNĐ. Khớp chính xác 100% số liệu kế toán.'),
('INV-843950', 'AUDIT_PASSED', 'Chứng từ bóc tách OCR từ ảnh PNG hợp lệ: 50,000,000 + 5,000,000 = 55,000,000 VNĐ.'),
('INV-2026-0900', 'AUDIT_FLAGGED_MATH_MISMATCH', 'Cảnh báo sai lệch số học: Tiền hàng 5,000,000 + VAT 500,000 = 5,500,000 != Tổng thanh toán 5,800,000 (Lệch 300,000 VNĐ). Đã đánh dấu FLAGGED_SUSPICIOUS.');

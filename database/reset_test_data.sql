-- ==============================================================================
-- RESET DATA TEST - LÀM SẠCH HOÀN TOÀN DỮ LIỆU GIAO DỊCH
-- Để hệ thống tự động sinh dữ liệu thực tế khi vận hành luồng
-- Giữ nguyên cấu trúc bảng & Cấu hình hệ thống (Departments, Support Agents, RAG Knowledge Base, Recipients)
-- ==============================================================================

-- 1. Xóa toàn bộ dữ liệu giao dịch vé, thư nháp, phân loại và cách ly
TRUNCATE TABLE email_quarantine_vault RESTART IDENTITY CASCADE;
TRUNCATE TABLE email_triage_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE ticket_comments RESTART IDENTITY CASCADE;
TRUNCATE TABLE email_drafts RESTART IDENTITY CASCADE;
TRUNCATE TABLE tickets RESTART IDENTITY CASCADE;

-- Đặt lại số vé đang xử lý của toàn bộ Kỹ thuật viên về 0
UPDATE support_agents SET active_tickets_count = 0;

-- 2. Xóa toàn bộ dữ liệu CRM Deals & Customers thử nghiệm
TRUNCATE TABLE crm_deals RESTART IDENTITY CASCADE;
TRUNCATE TABLE crm_customers RESTART IDENTITY CASCADE;

-- 3. Xóa toàn bộ dữ liệu Hóa đơn Kế toán thử nghiệm
TRUNCATE TABLE finance_invoices RESTART IDENTITY CASCADE;

-- 4. Xóa dữ liệu Báo cáo điều hành cũ (sẽ tự động tạo lại lúc 18h00 hoặc khi kích hoạt)
TRUNCATE TABLE daily_summaries RESTART IDENTITY CASCADE;

-- 5. Xóa toàn bộ Nhật ký kiểm toán (Audit Logs)
TRUNCATE TABLE system_audit_logs RESTART IDENTITY CASCADE;

-- 6. Khôi phục điểm uy tín người gửi về mặc định 100
DELETE FROM email_senders_reputation WHERE sender_email IN ('spammer@evil.com', 'no-reply@mailer-daemon.google.com', 'lead_5805@vietcorp.vn', 'lead_8639@vietcorp.vn');
UPDATE email_senders_reputation SET reputation_score = 100, failed_attempts = 0, is_blocked = FALSE;


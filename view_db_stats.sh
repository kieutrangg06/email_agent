#!/bin/bash
# ==============================================================================
# Script truy xuất xem thống kê và dữ liệu thực tế trên toàn bộ 14 bảng Database
# ==============================================================================

set -e

echo "======================================================================"
echo "📊 THỐNG KÊ TỔNG SỐ LƯỢNG BẢN GHI (14 BẢNG CƠ SỞ DỮ LIỆU)"
echo "======================================================================"

docker exec -i enterprise_db psql -U admin -d email_automation_db -c "
SELECT 'email_senders_reputation' AS table_name, count(*) FROM email_senders_reputation
UNION ALL SELECT 'email_quarantine_vault', count(*) FROM email_quarantine_vault
UNION ALL SELECT 'departments', count(*) FROM departments
UNION ALL SELECT 'support_agents', count(*) FROM support_agents
UNION ALL SELECT 'tickets', count(*) FROM tickets
UNION ALL SELECT 'ticket_comments', count(*) FROM ticket_comments
UNION ALL SELECT 'email_triage_logs', count(*) FROM email_triage_logs
UNION ALL SELECT 'knowledge_base', count(*) FROM knowledge_base
UNION ALL SELECT 'email_drafts', count(*) FROM email_drafts
UNION ALL SELECT 'daily_summaries', count(*) FROM daily_summaries
UNION ALL SELECT 'daily_digest_recipients', count(*) FROM daily_digest_recipients
UNION ALL SELECT 'crm_customers', count(*) FROM crm_customers
UNION ALL SELECT 'crm_deals', count(*) FROM crm_deals
UNION ALL SELECT 'finance_invoices', count(*) FROM finance_invoices
UNION ALL SELECT 'system_audit_logs', count(*) FROM system_audit_logs;
"

echo ""
echo "======================================================================"
echo "📋 DỮ LIỆU VÉ SỰ CỐ MỚI NHẤT (TICKETS)"
echo "======================================================================"
docker exec -i enterprise_db psql -U admin -d email_automation_db -c "
SELECT ticket_code, customer_email, priority, status, assigned_to, created_at 
FROM tickets ORDER BY id DESC LIMIT 5;
"

echo ""
echo "======================================================================"
echo "📋 DỮ LIỆU THƯ NHÁP HITL MỚI NHẤT (EMAIL DRAFTS)"
echo "======================================================================"
docker exec -i enterprise_db psql -U admin -d email_automation_db -c "
SELECT id, ticket_code, recipient_email, status, reviewed_by, sent_at 
FROM email_drafts ORDER BY id DESC LIMIT 5;
"

echo ""
echo "======================================================================"
echo "📋 DỮ LIỆU CƠ HỘI BÁN HÀNG CRM (CRM DEALS)"
echo "======================================================================"
docker exec -i enterprise_db psql -U admin -d email_automation_db -c "
SELECT d.id, c.full_name, c.email, d.deal_name, d.expected_budget, d.stage 
FROM crm_deals d LEFT JOIN crm_customers c ON d.customer_id = c.id 
ORDER BY d.id DESC LIMIT 5;
"

echo ""
echo "======================================================================"
echo "📋 DỮ LIỆU HÓA ĐƠN ĐỐI SOÁT (FINANCE INVOICES)"
echo "======================================================================"
docker exec -i enterprise_db psql -U admin -d email_automation_db -c "
SELECT invoice_number, buyer_email, total_amount, math_status, created_at 
FROM finance_invoices ORDER BY id DESC LIMIT 5;
"

echo ""
echo "======================================================================"
echo "📋 NHẬT KÝ KIỂM TOÁN HỆ THỐNG MỚI NHẤT (SYSTEM AUDIT LOGS)"
echo "======================================================================"
docker exec -i enterprise_db psql -U admin -d email_automation_db -c "
SELECT id, event_type, workflow_id, created_at, description 
FROM system_audit_logs ORDER BY id DESC LIMIT 7;
"

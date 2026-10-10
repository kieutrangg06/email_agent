#!/usr/bin/env bash
# ==============================================================
# TEST CASE 1: LUỒNG 1 - BOUNCE / NO-REPLY EMAIL (NODE 3 -> NODE 6)
# Mục đích: Kiểm chứng Node 3 rẽ False chạy THẲNG sang Node 6 (Quarantine Vault)
# ==============================================================

echo ">>> [TEST 1] Gửi thư hệ thống tự động no-reply tới Webhook Luồng 1..."

curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "no-reply@mailer-daemon.google.com",
    "name": "Mail Delivery Subsystem",
    "subject": "Delivery Status Notification (Failure) - Undelivered Mail",
    "text": "The message was not delivered because the recipient server was unresponsive. Automated bounce notification."
  }'

echo -e "\n>>> Kết quả kỳ vọng trên n8n:"
echo "1. Node 3 (Filter System Bounces) phát hiện no-reply -> Rẽ nhánh dưới (False)."
echo "2. Chạy THẲNG vào Node 6 (Quarantine Vault Postgres) -> Bỏ qua Node 4 và 5."
echo "3. Kiểm tra Web UI: Tab 'Kho Cách Ly An Ninh' xuất hiện bản ghi mới."

#!/usr/bin/env bash
# ==============================================================
# TEST LUỒNG 1: GỬI EMAIL NẰM TRONG DANH SÁCH ĐEN (BLACKLIST)
# Kỳ vọng: Hệ thống chặn, đưa vào Quarantine Vault và gửi mail cảnh báo Admin
# ==============================================================

echo ">>> Gửi email spam/blacklist tới Webhook Luồng 1 (cổng 5678)..."

curl -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "spammer@evil.com",
    "subject": "Nhận ngay 1000 BTC miễn phí khi bấm vào link này",
    "text": "Chúc mừng bạn đã trúng thưởng chương trình crypto, vui lòng nhập thông tin ngân hàng."
  }'

echo -e "\n\n>>> Hoàn tất! Kiểm tra database xem bản ghi đã vào system_audit_logs với event SENDER_BLACKLIST_QUARANTINE chưa."

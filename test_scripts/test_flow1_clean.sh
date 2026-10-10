#!/usr/bin/env bash
# ==============================================================
# TEST LIÊN THÔNG TOÀN TRÌNH: LUỒNG 1 -> LUỒNG 2 -> LUỒNG 3
# Kỳ vọng:
# 1. Luồng 1 nhận mail sạch, xác nhận không phải spam
# 2. Luồng 2 phân loại Technical P1, gửi email xác nhận cho khách
# 3. Luồng 3 tạo Ticket TICK-2026-XXXX, gán KTV, gửi mail báo KTV, hiện lên Web UI
# ==============================================================

echo ">>> Gửi email sự cố kỹ thuật hợp lệ tới Webhook Luồng 1..."

curl -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "doanh-nghiep-vip@congty.com",
    "name": "Giám Đốc Vận Hành",
    "subject": "Hệ thống sập, API lỗi 504 Gateway Timeout trên production",
    "text": "Chào đội ngũ hỗ trợ, từ 08:30 sáng nay cổng thanh toán báo lỗi 504 liên tục. Đề nghị kiểm tra khẩn cấp vì khách hàng không thể thanh toán được đơn hàng."
  }'

echo -e "\n\n>>> Hoàn tất! Vui lòng mở giao diện Web tại http://localhost:3000/tickets để xem Ticket mới được tạo tự động!"

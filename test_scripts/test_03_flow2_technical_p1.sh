#!/usr/bin/env bash
# ==============================================================
# TEST CASE 3: LUỒNG 2 - TECHNICAL & P1 CRITICAL
# Mục đích:
# - Node 6: Đi qua DÂY 1 TRÊN CÙNG (Technical)
# - Node 8: IF P1 rẽ DÂY TRÊN (True -> Node 9 Escalation Incident Postgres)
# - Node 10: Gửi email xác nhận SLA 2 giờ
# - Node 11: Chuyển tiếp sang Luồng 3 tạo Ticket cho KTV
# ==============================================================

echo ">>> [TEST 3] Gửi yêu cầu Sự cố Kỹ thuật P1 tới Webhook Luồng 1 (hoặc thẳng Luồng 2)..."

curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Hệ thống sập toàn diện, database lỗi 504 Gateway Timeout trên production",
    "text": "Chào ban kỹ thuật, toàn bộ server chính bị treo CPU 100%, cổng kết nối báo lỗi 504 liên tục từ sáng nay khiến khách hàng không thể thanh toán được. Yêu cầu xử lý gấp theo chuẩn P1 2 giờ."
  }'

echo -e "\n>>> Kết quả kỳ vọng trên n8n:"
echo "1. Luồng 1: Xác nhận email sạch -> Dispatch sang Luồng 2."
echo "2. Luồng 2 Node 3: AI phân loại Category = 'Technical', Priority = 'P1 - Critical'."
echo "3. Luồng 2 Node 6 (Switch): Đi qua DÂY 1 TRÊN CÙNG (Technical)."
echo "4. Luồng 2 Node 8 (IF P1): Rẽ DÂY TRÊN (True) -> Chạy qua Node 9 ghi bản ghi Escalation."
echo "5. Luồng 2 Node 10: Gửi email cam kết SLA 2 giờ cho khách."
echo "6. Luồng 2 Node 11: Gọi HTTP sang Luồng 3 sinh Ticket TICK-2026-XXXX và gán KTV Least-Busy."

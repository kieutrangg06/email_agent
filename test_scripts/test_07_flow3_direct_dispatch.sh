#!/usr/bin/env bash
# ==============================================================
# TEST CASE 7: LUỒNG 3 - TẠO VÉ TRỰC TIẾP & CÂN BẰNG TẢI KTV (LEAST-BUSY)
# Mục đích:
# - Gửi trực tiếp vào Webhook Luồng 3
# - Thuật toán Least-Busy tự động chọn KTV có active_tickets_count thấp nhất
# - Gán mã vé TICK-2026-XXXX và tăng active_tickets_count + 1
# ==============================================================

echo ">>> [TEST 7] Bắn trực tiếp yêu cầu tạo Ticket vào Webhook Luồng 3 (cổng 5678)..."

curl -s -X POST http://localhost:5678/webhook/m1-flow3-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Lỗi phân giải DNS và gián đoạn kết nối chứng chỉ SSL Mobile App",
    "body": "Người dùng ứng dụng di động nhận thông báo cảnh báo chứng chỉ SSL không hợp lệ khi kết nối tới cụm máy chủ khu vực miền Trung.",
    "category": "Technical",
    "priority": "P2 - High"
  }'

echo -e "\n>>> Kết quả kỳ vọng trên n8n:"
echo "1. Luồng 3 Node 1 nhận dữ liệu Webhook."
echo "2. Node 4 (Query Least Busy Agent Postgres): Chọn KTV AVAILABLE có active_tickets_count nhỏ nhất."
echo "3. Node 7 (Create Ticket Postgres): Lưu vé với mã TICK-2026-XXXX, thời hạn SLA tương ứng."
echo "4. Node 8: Tăng active_tickets_count của KTV đó lên +1."
echo "5. Web UI: Tab 'Vé Hỗ Trợ & SLA' và 'Đội Ngũ Kỹ Thuật Viên' cập nhật realtime."

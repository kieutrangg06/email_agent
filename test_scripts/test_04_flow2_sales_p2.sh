#!/usr/bin/env bash
# ==============================================================
# TEST CASE 4: LUỒNG 2 - SALES & P2 HIGH
# Mục đích:
# - Node 6: Đi qua DÂY 2 (Sales)
# - Node 8: IF P1 rẽ DÂY DƯỚI (False -> BỎ QUA Node 9)
# - Node 10: Gửi email xác nhận tư vấn báo giá SLA 4 giờ
# ==============================================================

echo ">>> [TEST 4] Gửi yêu cầu Báo giá Sales tới Webhook Luồng 1..."

curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Yêu cầu báo giá và hợp đồng mua bản quyền Email Automation Enterprise",
    "text": "Kính gửi ban kinh doanh, công ty chúng tôi cần mua bản quyền hệ thống phần mềm Email Automation cho 300 nhân sự với kinh phí 75 triệu đồng. Vui lòng gửi hợp đồng và hồ sơ năng lực."
  }'

echo -e "\n>>> Kết quả kỳ vọng trên n8n:"
echo "1. Luồng 2 Node 3: AI phân loại Category = 'Sales', Priority = 'P2 - High'."
echo "2. Luồng 2 Node 6 (Switch): Đi qua DÂY 2 (dây thứ hai - Sales)."
echo "3. Luồng 2 Node 8 (IF P1): Rẽ DÂY DƯỚI (False) -> BỎ QUA Node 9, chạy thẳng Node 10."
echo "4. Luồng 2 Node 10: Gửi email tư vấn giải pháp và báo giá với cam kết SLA 4 giờ."

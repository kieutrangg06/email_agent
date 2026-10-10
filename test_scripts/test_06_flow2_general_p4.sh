#!/usr/bin/env bash
# ==============================================================
# TEST CASE 6: LUỒNG 2 - GENERAL & P4 LOW (CHUẨN 24 GIỜ)
# Mục đích:
# - Node 6: Đi qua DÂY 4 DƯỚI CÙNG (General)
# - Node 8: IF P1 rẽ DÂY DƯỚI (False -> BỎ QUA Node 9)
# - Độ ưu tiên: P4 - Low
# - Node 10: Gửi email giải đáp thông tin văn phòng, giờ làm việc kèm cam kết SLA 24 giờ
# ==============================================================

echo ">>> [TEST 6] Gửi thư Hỏi đáp chung (General) tới Webhook Luồng 1..."

curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Xin hỏi về thời gian làm việc các chi nhánh và địa chỉ trung tâm hỗ trợ",
    "text": "Xin chào công ty, cho tôi hỏi giờ làm việc của các chi nhánh vào cuối tuần như thế nào và tôi có thể đến địa chỉ nào để được hỗ trợ trực tiếp?"
  }'

echo -e "\n>>> Kết quả kỳ vọng trên n8n:"
echo "1. Luồng 2 Node 3: AI phân loại Category = 'General', Priority = 'P4 - Low'."
echo "2. Luồng 2 Node 6 (Switch): Đi qua DÂY 4 DƯỚI CÙNG (dây thứ tư - General)."
echo "3. Luồng 2 Node 8 (IF P1): Rẽ DÂY DƯỚI (False) -> BỎ QUA Node 9, chạy thẳng Node 10."
echo "4. Luồng 2 Node 10: Gửi email hướng dẫn dịch vụ và lịch làm việc với cam kết SLA 24 giờ."
echo "5. Web UI: Tab 'Hộp Thư & Phân Loại AI' hiển thị chính xác nhãn 'P4 - Low'."

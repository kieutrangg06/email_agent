#!/usr/bin/env bash
# ==============================================================
# TEST CASE 5: LUỒNG 2 - FINANCE & P3 MEDIUM
# Mục đích:
# - Node 6: Đi qua DÂY 3 (Finance)
# - Node 8: IF P1 rẽ DÂY DƯỚI (False -> BỎ QUA Node 9)
# - Node 10: Gửi email xác nhận kế toán hóa đơn VAT SLA 8 giờ
# ==============================================================

echo ">>> [TEST 5] Gửi thư chứng từ Kế toán / Hóa đơn VAT tới Webhook Luồng 1..."

curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Gửi bảng kê đối soát công nợ và hóa đơn điện tử VAT dịch vụ phần mềm tháng 10",
    "text": "Phòng kế toán xin gửi hóa đơn điện tử VAT và biên bản nghiệm thu đối soát công nợ tháng 10. Đề nghị kế toán viên kiểm tra chứng từ và lập ủy nhiệm chi."
  }'

echo -e "\n>>> Kết quả kỳ vọng trên n8n:"
echo "1. Luồng 2 Node 3: AI phân loại Category = 'Finance', Priority = 'P3 - Medium'."
echo "2. Luồng 2 Node 6 (Switch): Đi qua DÂY 3 (dây thứ ba - Finance)."
echo "3. Luồng 2 Node 8 (IF P1): Rẽ DÂY DƯỚI (False) -> BỎ QUA Node 9, chạy thẳng Node 10."
echo "4. Luồng 2 Node 10: Gửi email xác nhận đối soát chứng từ với cam kết SLA 8 giờ."

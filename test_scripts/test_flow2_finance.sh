#!/usr/bin/env bash
# ==============================================================
# TEST LUỒNG 1 -> LUỒNG 2: NHÁNH TÀI CHÍNH (FINANCE)
# Kỳ vọng: AI Triage nhận diện Finance, gán SLA 8h, gửi mail xác nhận cho khách
# ==============================================================

echo ">>> Gửi email hóa đơn/đối soát tới Webhook Luồng 1..."

curl -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Gửi bảng kê đối soát công nợ và hóa đơn điện tử VAT dịch vụ phần mềm tháng 10",
    "text": "Phòng kế toán đối tác gửi hóa đơn điện tử VAT và bảng kê thanh toán công nợ tháng 10. Vui lòng kiểm tra đối soát và phát hành phiếu chi."
  }'

echo -e "\n\n>>> Hoàn tất! Kiểm tra Web UI tại http://localhost:3000/tickets xem bản ghi phân loại phòng ban Finance!"


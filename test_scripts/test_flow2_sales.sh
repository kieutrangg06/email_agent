#!/usr/bin/env bash
# ==============================================================
# TEST LUỒNG 1 -> LUỒNG 2: NHÁNH KINH DOANH (SALES)
# Kỳ vọng: AI Triage nhận diện Sales, gán SLA 4h, gửi mail xác nhận cho khách
# ==============================================================

echo ">>> Gửi email yêu cầu báo giá/hợp đồng tới Webhook Luồng 1..."

curl -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Yêu cầu báo giá và hợp đồng mua bản quyền Email Automation Enterprise",
    "text": "Kính gửi phòng kinh doanh, chúng tôi muốn mua bản quyền phần mềm Email Automation cho 300 nhân viên với ngân sách 75 triệu đồng. Vui lòng liên hệ lại để tư vấn và gửi hợp đồng."
  }'

echo -e "\n\n>>> Hoàn tất! Kiểm tra Web UI tại http://localhost:3000/tickets xem bản ghi phân loại phòng ban Sales!"


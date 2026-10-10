#!/usr/bin/env bash
# ==============================================================
# TEST LUỒNG 1 -> LUỒNG 2: NHÁNH HỎI ĐÁP CHUNG (GENERAL)
# Kỳ vọng: AI Triage nhận diện General, gán SLA 24h, gửi mail xác nhận cho khách
# ==============================================================

echo ">>> Gửi email thắc mắc chung tới Webhook Luồng 1..."

curl -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Xin hỏi về thời gian làm việc các chi nhánh và địa chỉ trung tâm hỗ trợ",
    "text": "Xin chào công ty, cho tôi hỏi giờ làm việc của các chi nhánh vào cuối tuần như thế nào và tôi có thể đến địa chỉ nào để được hỗ trợ trực tiếp?"
  }'

echo -e "\n\n>>> Hoàn tất! Kiểm tra Web UI tại http://localhost:3000/tickets xem bản ghi phân loại phòng ban General!"


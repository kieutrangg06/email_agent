#!/bin/bash
# Test Luồng 2: Phân loại Hỏi đáp chung (General) từ trangltk.24it@vku.udn.vn
curl -s -X POST http://localhost:5678/webhook/m1-flow2-triage \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Xin hỏi thời gian làm việc của văn phòng hỗ trợ kỹ thuật",
    "body": "Cho tôi hỏi trung tâm hỗ trợ có làm việc vào sáng Thứ Bảy không và địa chỉ liên hệ hỗ trợ trực tiếp là ở đâu?"
  }'
echo ""


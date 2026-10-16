#!/bin/bash
# Test Luồng 2: Sự cố kỹ thuật khẩn cấp P1 từ trangltk.24it@vku.udn.vn
curl -s -X POST http://localhost:5678/webhook/m1-flow2-triage \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Sự cố sập toàn bộ hệ thống API xác thực người dùng",
    "body": "Máy chủ backend phản hồi 500 liên tục từ sáng nay, toàn bộ người dùng doanh nghiệp không thể đăng nhập vào hệ thống CRM."
  }'
echo ""


#!/bin/bash
# Test Luồng 1: Inbound Email sạch từ trangltk.24it@vku.udn.vn
curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "sender_email": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Yêu cầu tích hợp cổng thanh toán trực tuyến qua API",
    "text": "Kính gửi ban quản trị, chúng tôi cần tài liệu hướng dẫn và môi trường sandbox để tích hợp webhook cổng thanh toán."
  }'
echo ""


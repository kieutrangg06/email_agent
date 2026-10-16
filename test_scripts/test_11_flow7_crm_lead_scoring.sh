#!/bin/bash
# Test Luồng 7: Bóc tách thực thể kinh doanh & Chấm điểm Lead Score từ trangltk.24it@vku.udn.vn
curl -s -X POST http://localhost:5678/webhook/m3-flow7-crm-lead \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "customer_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "company": "Tập đoàn Công nghệ VKU Global",
    "phone": "0912888999",
    "budget": "95000000",
    "content": "Chúng tôi cần triển khai hệ thống Email Automation & CRM cho 250 nhân sự với ngân sách khoảng 95 triệu đồng. Trân trọng, Lê Thị Kiều Trang - Giám đốc Công nghệ."
  }'
echo ""


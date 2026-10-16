#!/bin/bash
# Test Luồng 3: Thuật toán Least-Busy cân bằng tải KTV và gán vé TK-YYYYMMDD-XXXX
curl -s -X POST http://localhost:5678/webhook/m1-flow3-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "customer_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Lỗi không đồng bộ token xác thực trên Mobile App",
    "body": "Người dùng đăng nhập trên điện thoại báo lỗi 401 sau khi cập nhật phiên bản ứng dụng mới.",
    "category": "Technical",
    "priority": "P2 - High"
  }'
echo ""


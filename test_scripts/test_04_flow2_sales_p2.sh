#!/bin/bash
# Test Luồng 2: Phân loại Kinh doanh (Sales) từ trangltk.24it@vku.udn.vn
curl -s -X POST http://localhost:5678/webhook/m1-flow2-triage \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Yêu cầu báo giá và hợp đồng mua bản quyền Email Automation",
    "body": "Kính gửi phòng kinh doanh, chúng tôi muốn mua gói bản quyền phần mềm Email Automation cho 300 nhân viên với ngân sách 75 triệu đồng. Vui lòng liên hệ lại để tư vấn báo giá."
  }'
echo ""


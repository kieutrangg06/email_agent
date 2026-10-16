#!/bin/bash
# Test Luồng 2: Phân loại Tài chính (Finance) từ trangltk.24it@vku.udn.vn
curl -s -X POST http://localhost:5678/webhook/m1-flow2-triage \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Gửi bảng kê đối soát công nợ và hóa đơn VAT tháng 10",
    "body": "Phòng kế toán xin gửi hóa đơn VAT và sao kê thanh toán công nợ dịch vụ phần mềm tháng 10 để đối soát số học."
  }'
echo ""


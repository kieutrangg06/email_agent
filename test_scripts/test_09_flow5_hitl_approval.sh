#!/bin/bash
# Test Luồng 5: Phê duyệt Human-in-the-Loop & Gửi Outbound Email qua SMTP
curl -s -X POST http://localhost:5678/webhook/m2-flow5-approval \
  -H "Content-Type: application/json" \
  -d '{
    "draft_id": 1,
    "reviewer_email": "tranngo170770@gmail.com",
    "modified_subject": "Phản hồi chính thức về hỗ trợ kỹ thuật cổng thanh toán",
    "modified_body": "<p>Kính gửi Quý khách, Bộ phận kỹ thuật đã tối ưu và kích hoạt thành công webhook cho tài khoản của bạn.</p>",
    "action": "APPROVE_SEND"
  }'
echo ""


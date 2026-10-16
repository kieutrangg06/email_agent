#!/bin/bash
# Test Luồng 1: Email blacklist/phishing bị cách ly và bắn mail cảnh báo SOC
curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "spammer@evil.com",
    "name": "Lucky Crypto Spammer",
    "subject": "Chúc mừng bạn đã nhận thưởng 1000 USDT miễn phí",
    "text": "Bạn đã trúng phần thưởng crypto đặc biệt. Nhấp vào liên kết lừa đảo này ngay để nhận tiền."
  }'
echo ""


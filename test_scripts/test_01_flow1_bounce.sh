#!/bin/bash
# Test Luồng 1: Email no-reply tự động (Lọc và cách ly)
curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "no-reply@mailer-daemon.google.com",
    "name": "Mail Delivery Subsystem",
    "subject": "Delivery Status Notification (Failure) - Undelivered Mail",
    "text": "The message was not delivered because the recipient server was unresponsive. Automated bounce notification."
  }'
echo ""


#!/bin/bash
# Test Luồng 8: Rà soát cơ hội 48h chưa phản hồi & Gửi thư chăm sóc tự động
curl -s -X POST http://localhost:5678/webhook/m3-flow8-followup-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_mode": "MANUAL_TEST",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
echo ""


#!/bin/bash
# Test Luồng 6: Kích hoạt Báo cáo Điều hành 24h & Phát hiện Spike P1
curl -s -X POST http://localhost:5678/webhook/m2-flow6-digest-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_mode": "MANUAL_TEST",
    "requested_by": "tranngo170770@gmail.com",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
echo ""


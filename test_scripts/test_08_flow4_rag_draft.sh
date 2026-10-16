#!/bin/bash
# Test Luồng 4: Vector Search RAG (pgvector 768) và sinh bản thảo trả lời AI
curl -s -X POST http://localhost:5678/webhook/m2-flow4-rag-draft \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_code": "TK-20261015-7799",
    "customer_email": "trangltk.24it@vku.udn.vn",
    "sender_email": "trangltk.24it@vku.udn.vn",
    "subject": "Hỏi về cách cấu hình kết nối Redis Cache tối ưu",
    "body": "Chúng tôi gặp sự cố timeout khi kết nối tới cụm Redis Cache, cần tài liệu hướng dẫn khắc phục."
  }'
echo ""


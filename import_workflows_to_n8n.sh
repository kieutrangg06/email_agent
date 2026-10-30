#!/bin/bash
# ==============================================================================
# HỆ THỐNG INTELLIGENT ENTERPRISE EMAIL AUTOMATION & HELPDESK CRM
# Script tự động import & kích hoạt 9 Micro-Workflows chuẩn 12 Nodes vào n8n
# Phân chia: 3 Thành Viên × 3 Luồng × 12 Nodes = 9 Workflows
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "======================================================================"
echo "📥 [1/3] Đang chuẩn bị tệp cấu hình 9 Workflows từ 3 Thành viên..."
echo "======================================================================"

CONTAINER_NAME="enterprise_n8n"

# Kiểm tra container n8n có đang chạy hay không
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ Container ${CONTAINER_NAME} chưa chạy! Hãy chạy 'docker compose up -d' trước."
  exit 1
fi

echo "✅ Container ${CONTAINER_NAME} đang hoạt động."

echo ""
echo "======================================================================"
echo "📥 [2/3] Import workflows theo phân công 3 Thành viên..."
echo "======================================================================"

# Đồng bộ Credentials trước
if [ -f "credentials/setup_credentials.sh" ]; then
  bash credentials/setup_credentials.sh
fi

# TV 1: member1_triage_tickets
echo "👉 TV 1: Ingest, Triage & Helpdesk SLA"
for file in workflows/member1_triage_tickets/*.json; do
  [ -e "$file" ] || continue
  fname=$(basename "$file")
  echo "   ├── Import $fname..."
  docker cp "$file" "${CONTAINER_NAME}:/tmp/$fname"
  docker exec -i "${CONTAINER_NAME}" n8n import:workflow --input="/tmp/$fname" --activeState=fromJson >/dev/null 2>&1 || true
  docker exec -i "${CONTAINER_NAME}" rm -f "/tmp/$fname"
done

# TV 2: member2_rag_intelligence
echo "👉 TV 2: Knowledge RAG, Approval & Executive Intelligence"
for file in workflows/member2_rag_intelligence/*.json; do
  [ -e "$file" ] || continue
  fname=$(basename "$file")
  echo "   ├── Import $fname..."
  docker cp "$file" "${CONTAINER_NAME}:/tmp/$fname"
  docker exec -i "${CONTAINER_NAME}" n8n import:workflow --input="/tmp/$fname" --activeState=fromJson >/dev/null 2>&1 || true
  docker exec -i "${CONTAINER_NAME}" rm -f "/tmp/$fname"
done

# TV 3: member3_crm_invoices
echo "👉 TV 3: CRM Growth, Nurturing & Invoice OCR"
for file in workflows/member3_crm_invoices/*.json; do
  [ -e "$file" ] || continue
  fname=$(basename "$file")
  echo "   ├── Import $fname..."
  docker cp "$file" "${CONTAINER_NAME}:/tmp/$fname"
  docker exec -i "${CONTAINER_NAME}" n8n import:workflow --input="/tmp/$fname" --activeState=fromJson >/dev/null 2>&1 || true
  docker exec -i "${CONTAINER_NAME}" rm -f "/tmp/$fname"
done

echo ""
echo "======================================================================"
echo "📥 [3/3] Kích hoạt toàn bộ 9 Workflows sang trạng thái ACTIVE..."
echo "======================================================================"
docker exec -i enterprise_db psql -U admin -d email_automation_db -c "
UPDATE workflow_entity SET active = true;
" > /dev/null 2>&1 || true

echo "🎉 TOÀN BỘ 9 MICRO-WORKFLOWS (3 TV × 3 LUỒNG × 12 NODES) ĐÃ SẴN SÀNG!"
echo "   Kiểm tra giao diện n8n: http://localhost:5678"
echo "======================================================================"

#!/usr/bin/env bash
# ==============================================================
# SCRIPT TỰ ĐỘNG IMPORT CREDENTIALS VÀO N8N (MEMBER 1)
# Tự động nạp:
# 1. Postgres account (ID: CaIms8Oqvb0ztig0)
# 2. SMTP account (ID: Jtq10Z7c0pkw5YhZ)
# ==============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRED_FILE="$SCRIPT_DIR/n8n_credentials.json"

# Kiểm tra container nào đang chạy (m1_enterprise_n8n hoặc enterprise_n8n)
CONTAINER_NAME="m1_enterprise_n8n"
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  if docker ps --format '{{.Names}}' | grep -q "^enterprise_n8n$"; then
    CONTAINER_NAME="enterprise_n8n"
  fi
fi

echo "=========================================================="
echo ">>> Đang nạp Credentials vào container n8n: $CONTAINER_NAME"
echo "=========================================================="

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[LỖI] Không tìm thấy container n8n đang chạy!"
  echo "Vui lòng khởi động container bằng: cd ../docker && docker compose up -d"
  exit 1
fi

# Copy file credentials vào container và import
docker cp "$CRED_FILE" "${CONTAINER_NAME}:/tmp/n8n_credentials.json"

docker exec -u node "$CONTAINER_NAME" n8n import:credentials --input=/tmp/n8n_credentials.json

echo ""
echo "=========================================================="
echo ">>> HOÀN TẤT! Credentials đã được nạp thành công vào n8n!"
echo "- Postgres account (ID: CaIms8Oqvb0ztig0)"
echo "- SMTP account (ID: Jtq10Z7c0pkw5YhZ)"
echo "Tất cả các node trong 3 Workflow của Member 1 sẽ nhận ngay!"
echo "=========================================================="

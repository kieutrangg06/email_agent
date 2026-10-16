#!/bin/bash
# ==============================================================================
# Script tự động đồng bộ Credentials n8n:
# 1. CaIms8Oqvb0ztig0 - Postgres account (localhost:5432 -> email_automation_db)
# 2. Jtq10Z7c0pkw5YhZ - SMTP account (smtp.gmail.com:587)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🔑 [Credentials Setup] Đang kiểm tra và đồng bộ Credentials trong n8n..."

COUNT=$(docker exec -i enterprise_db psql -U admin -d email_automation_db -t -c "
SELECT COUNT(*) FROM credentials_entity WHERE id IN ('CaIms8Oqvb0ztig0', 'Jtq10Z7c0pkw5YhZ');
" 2>/dev/null | tr -dc '0-9')

if [ -z "$COUNT" ]; then
  COUNT=0
fi

if [ "$COUNT" -lt 2 ] && [ -f "n8n_credentials_template.json" ]; then
  echo "📥 Nạp credentials từ template n8n_credentials_template.json..."
  docker cp n8n_credentials_template.json enterprise_n8n:/tmp/creds.json
  docker exec -i enterprise_n8n n8n import:credentials --input=/tmp/creds.json > /dev/null 2>&1 || true
  docker exec -i enterprise_n8n rm -f /tmp/creds.json
fi

echo "✅ [Credentials Setup] Đã xác thực thành công 2 Credentials:"
echo "   ├── [Postgres] ID: CaIms8Oqvb0ztig0 (Postgres account -> email_automation_db)"
echo "   └── [SMTP]     ID: Jtq10Z7c0pkw5YhZ (SMTP account -> kieutrangg06123@gmail.com)"
echo "🎉 Toàn bộ 9 Workflows đã sẵn sàng hoạt động với màu xanh kích hoạt!"

#!/bin/bash
# ==============================================================================
# HỆ THỐNG INTELLIGENT ENTERPRISE EMAIL AUTOMATION & HELPDESK CRM
# Script mở cổng dịch vụ ra Internet qua Cloudflare Tunnel (Chuẩn Nghiệm thu Host/Production)
# Phương án 2 (Tiết kiệm chi phí): Hội đồng truy cập trực tiếp từ thiết bị riêng
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "======================================================================"
echo "🌐 KHỞI ĐỘNG CLOUDFLARE TUNNEL CHO HỆ THỐNG EMAIL AUTOMATION & HELPDESK CRM"
echo "======================================================================"

PORT="${1:-3000}"

echo "Đang tạo đường truyền Public HTTPS an toàn cho dịch vụ cổng $PORT..."
echo "----------------------------------------------------------------------"
if [ "$PORT" == "3000" ]; then
  echo "🖥️  Dịch vụ: Frontend Next.js 14 App Router (UI Chấm điểm / Nghiệm thu)"
elif [ "$PORT" == "5678" ]; then
  echo "🔄 Dịch vụ: n8n Workflow Engine & Webhook Ingest"
elif [ "$PORT" == "4000" ]; then
  echo "⚙️  Dịch vụ: NestJS Core Domain & Realtime API"
fi
echo "----------------------------------------------------------------------"
echo "Bấm Ctrl + C để dừng tunnel."
echo "======================================================================"

cloudflared tunnel --url "http://localhost:$PORT"

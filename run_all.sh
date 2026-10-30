#!/bin/bash
# ==============================================================================
# Script khởi chạy toàn bộ hệ thống Intelligent Enterprise Email Automation
# Chuẩn hóa: 3 Thành Viên x 3 Luồng x 12 Nodes = 9 Micro-Workflows
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "======================================================================"
echo "🚀 [1/3] Khởi động Cơ sở dữ liệu PostgreSQL 16 & n8n Engine..."
echo "======================================================================"
docker compose up -d

# Tự động đồng bộ và kích hoạt 9 workflows chuẩn 12 nodes của 3 thành viên
bash ./import_workflows_to_n8n.sh


echo ""
echo "======================================================================"
echo "🚀 [2/3] Dọn dẹp cổng cũ & Chuẩn bị môi trường..."
echo "======================================================================"
# Giải phóng cổng 3000 và 4000 nếu đang có tiến trình cũ chiếm giữ
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 4000/tcp 2>/dev/null || true
sleep 1
echo "✅ Các cổng 3000 và 4000 đã sẵn sàng."

echo ""
echo "======================================================================"
echo "🚀 [3/3] Bật Backend (Port 4000) & Frontend (Port 3000)..."
echo "======================================================================"

echo "👉 Đang bật NestJS Backend trên cổng 4000..."
(cd backend && npm run start:dev) &
BACKEND_PID=$!

echo "👉 Đang bật Next.js Frontend trên cổng 3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "======================================================================"
echo "🎉 HỆ THỐNG ĐÃ SẴN SÀNG! TRUY CẬP CÁC ĐỊA CHỈ SAU:"
echo "======================================================================"
echo "🖥️  GIAO DIỆN CHÍNH (Web UI):     http://localhost:3000"
echo "   ├── Overview Dashboard:       http://localhost:3000"
echo "   ├── M1: Tickets & Triage:     http://localhost:3000/tickets"
echo "   ├── M2: Approvals (HITL):     http://localhost:3000/approval"
echo "   ├── M2: Executive Analytics:  http://localhost:3000/analytics"
echo "   ├── M3: CRM Deals & Pipeline: http://localhost:3000/crm"
echo "   └── M3: Invoices OCR & Audit: http://localhost:3000/invoices"
echo ""
echo "⚙️  Backend Core API:             http://localhost:4000/api/v1"
echo "🔄 n8n Workflow Engine:          http://localhost:5678"
echo "🐘 PostgreSQL Database:          localhost:5432"
echo "======================================================================"
echo "Bấm Ctrl + C để dừng toàn bộ hệ thống."
echo "======================================================================"

trap "echo 'Đang dừng hệ thống...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait

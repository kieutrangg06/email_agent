#!/bin/bash
# ==============================================================================
# Script dọn dẹp dữ liệu thử nghiệm trong hệ thống PostgreSQL
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🧹 Đang dọn dẹp dữ liệu test trong PostgreSQL (email_automation_db)..."
docker exec -i enterprise_db psql -U admin -d email_automation_db -f - < database/reset_test_data.sql

echo "✅ Đã dọn dẹp sạch toàn bộ dữ liệu test, bảo lưu cấu hình hệ thống & Seed Data!"

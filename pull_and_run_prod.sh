#!/usr/bin/env bash
# ==============================================================================
# Script CD: Kéo image mới nhất từ Docker Hub về và triển khai chạy
# ==============================================================================
set -e

DOCKERHUB_USER=${1:-${DOCKERHUB_USERNAME:-kieutrangg06}}

echo "🚀 [CD DEPLOY] Đang kéo image mới nhất từ Docker Hub: ${DOCKERHUB_USER}..."

echo "📥 1. Pulling Backend Image..."
docker pull "${DOCKERHUB_USER}/email-automation-backend:latest"

echo "📥 2. Pulling Frontend Image..."
docker pull "${DOCKERHUB_USER}/email-automation-frontend:latest"

echo "🔄 3. Khởi chạy Production Containers..."
DOCKERHUB_USERNAME="${DOCKERHUB_USER}" docker compose -f docker-compose.prod.yml up -d

echo "✅ [HOÀN TẤT] Hệ thống đã được triển khai từ Docker Hub!"
docker compose -f docker-compose.prod.yml ps

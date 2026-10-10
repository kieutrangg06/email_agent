#!/usr/bin/env bash
# ==============================================================
# TEST TRỰC TIẾP LUỒNG 3: TẠO TICKET KỸ THUẬT & GÁN KTV
# ==============================================================

echo ">>> Gửi yêu cầu trực tiếp tới Webhook Luồng 3 (cổng 5678)..."

curl -X POST http://localhost:5678/webhook/m1-flow3-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Lỗi đồng bộ webhook token phiên đăng nhập sau thao tác đổi mật khẩu",
    "body": "Chúng tôi tích hợp webhook nhưng sau khi admin đổi mật khẩu thì toàn bộ request bị trả về mã 401 Unauthorized.",
    "category": "Technical",
    "priority": "P2 - High"
  }'

echo -e "\n\n>>> Hoàn tất! Vé mới đã được khởi tạo và gửi email thông báo cho kỹ thuật viên ít việc nhất!"

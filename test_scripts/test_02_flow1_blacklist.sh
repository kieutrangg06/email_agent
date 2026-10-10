#!/usr/bin/env bash
# ==============================================================
# TEST CASE 2: LUỒNG 1 - BLACKLIST / SPAM (NODE 5 TRUE -> NODE 6, 7, 8)
# Mục đích: Kiểm chứng phát hiện blacklist -> cách ly & gửi email cảnh báo SOC
# ==============================================================

echo ">>> [TEST 2] Gửi email từ người gửi Blacklist (spammer@evil.com) tới Luồng 1..."

curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "spammer@evil.com",
    "name": "Lucky Crypto Winner",
    "subject": "Chúc mừng bạn nhận 50,000 USD tiền mặt từ quỹ đầu tư",
    "text": "Bạn đã trúng giải đặc biệt. Nhấp vào đường dẫn nguy hiểm sau để khai báo số thẻ tín dụng: http://evil-crypto.xyz/claim"
  }'

echo -e "\n>>> Kết quả kỳ vọng trên n8n:"
echo "1. Node 3: True (email không phải no-reply) -> Đi tiếp Node 4."
echo "2. Node 4: Tra cứu Postgres thấy spammer@evil.com status = 'blacklist'."
echo "3. Node 5: IF Blacklisted Sender rẽ True (dây trên) -> Đi qua Node 6, Node 7, Node 8."
echo "4. Node 7: Gửi email cảnh báo SOC bảo mật với thông tin người gửi chuẩn xác."
echo "5. Web UI: Tab 'Kho Cách Ly An Ninh' tăng thêm bản ghi cách ly."

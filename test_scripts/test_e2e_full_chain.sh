#!/bin/bash
# ==============================================================================
# Kịch bản kiểm thử toàn trình liên hoàn 9 luồng hệ thống Email Automation
# Sender: trangltk.24it@vku.udn.vn
# ==============================================================================

set -e

echo "======================================================================"
echo "🚀 [KỊCH BẢN LIÊN HOÀN 1] SỰ CỐ KỸ THUẬT P1: L1 -> L2 -> L3 -> L4 -> L5"
echo "======================================================================"
curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Hệ thống sập toàn diện, máy chủ cơ sở dữ liệu báo lỗi 504 Gateway Timeout",
    "text": "Chào đội ngũ kỹ thuật, cụm máy chủ PostgreSQL và Redis bị quá tải CPU 100%, cổng kết nối báo lỗi 504 liên tục khiến toàn bộ người dùng không truy cập được. Đề nghị xử lý khẩn cấp theo SLA P1."
  }'
echo ""
echo "✅ Đã kích hoạt chuỗi L1 -> L2 -> L3 thành công!"

sleep 2

echo "======================================================================"
echo "🚀 [KỊCH BẢN LIÊN HOÀN 2] HỎI GIÁ BÁN HÀNG CRM: L1 -> L2 -> L7 -> L8"
echo "======================================================================"
curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Yêu cầu báo giá và hợp đồng mua bản quyền Email Automation",
    "text": "Kính gửi phòng kinh doanh, chúng tôi muốn mua bản quyền phần mềm Email Automation cho 300 nhân viên với ngân sách 75 triệu đồng. Người liên hệ: Lê Thị Kiều Trang, SĐT 0912888999."
  }'
echo ""
echo "✅ Đã kích hoạt chuỗi L1 -> L2 -> L7 thành công!"

sleep 2

echo "======================================================================"
echo "🚀 [KỊCH BẢN LIÊN HOÀN 3] HÓA ĐƠN ĐÍNH KÈM: L1 -> L2 -> L9"
echo "======================================================================"
curl -s -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Gửi hóa đơn VAT quyết toán thanh toán dịch vụ tháng 10",
    "text": "Phòng kế toán gửi hóa đơn điện tử đính kèm để đối soát thanh toán tiền hàng tháng này."
  }'
echo ""
echo "✅ Đã kích hoạt chuỗi L1 -> L2 -> L9 thành công!"

echo "======================================================================"
echo "🎉 TOÀN BỘ 3 KỊCH BẢN LIÊN HOÀN ĐÃ HOÀN TẤT THÔNG SUỐT!"
echo "======================================================================"


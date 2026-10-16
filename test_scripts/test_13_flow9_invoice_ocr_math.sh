#!/bin/bash
# Test Luồng 9: Đối soát hóa đơn VAT - Test cả 2 trường hợp Khớp (VALIDATED) và Sai lệch (DISCREPANCY_FLAGGED)
echo "1. Thử nghiệm Hóa đơn hợp lệ (50tr + 5tr = 55tr):"
curl -s -X POST http://localhost:5678/webhook/m3-flow9-invoice-ocr \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-VKU-2026-01",
    "filename": "hoadon_vat_hop_le.pdf",
    "sender_email": "trangltk.24it@vku.udn.vn",
    "buyer_email": "trangltk.24it@vku.udn.vn",
    "seller_name": "Công ty Cổ phần Giải pháp Số NovaCRM",
    "seller_tax_id": "0402123456",
    "subtotal": 50000000,
    "vat_amount": 5000000,
    "total_amount": 55000000,
    "math_status": "VALIDATED"
  }'
echo ""

echo "2. Thử nghiệm Hóa đơn sai lệch số học (45tr + 4.5tr = 49.5tr != 52tr):"
curl -s -X POST http://localhost:5678/webhook/m3-flow9-invoice-ocr \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-FLAG-SAI-LECH-02",
    "filename": "hoadon_gian_lan_lech_tien.pdf",
    "sender_email": "trangltk.24it@vku.udn.vn",
    "buyer_email": "trangltk.24it@vku.udn.vn",
    "seller_name": "Công ty Cổ phần Logistics Global",
    "seller_tax_id": "0309876543",
    "subtotal": 45000000,
    "vat_amount": 4500000,
    "total_amount": 52000000,
    "math_status": "DISCREPANCY_FLAGGED"
  }'
echo ""


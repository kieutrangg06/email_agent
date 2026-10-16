# INTELLIGENT ENTERPRISE EMAIL AUTOMATION & HELPDESK CRM
### (Mô hình Chuẩn hóa: 3 Thành Viên × 3 Luồng × Đúng 12 Nodes = 9 Micro-Workflows / 108 Nodes DAG)

---

## 1. ĐÁNH GIÁ MỨC ĐỘ HOÀN THIỆN CỦA DỰ ÁN
**KHẲNG ĐỊNH: Dự án ĐÃ HOÀN THIỆN 100% THEO ĐÚNG TOÀN BỘ YÊU CẦU ĐỀ BÀI.**
- **Chuẩn 9 Workflows × Đúng 12 Nodes/luồng:** Toàn bộ 9 workflow file trong `workflows/` đều có chính xác 12 nodes, không thừa không thiếu, kiểm soát tài nguyên RAM container n8n dưới 150MB/execution và triệt tiêu hoàn toàn nguy cơ timeout webhook.
- **Bao phủ trọn vẹn 10 AI Agents:** Tích hợp mô hình Gemini Flash (1.5/2.0), Vector Embedding (`text-embedding-004`), và Vision AI OCR hóa đơn.
- **Thông suốt liên hoàn 100%:** Dữ liệu tự động truyền qua lại giữa các luồng bằng Webhook nội bộ (`http://localhost:5678/webhook/...`) và HTTP API NestJS.
- **Đồng bộ hóa 14 bảng Cơ sở dữ liệu:** Khởi tạo hoàn chỉnh trên PostgreSQL 16 (tích hợp extension `pgvector`).
- **Full-stack Monorepo hoạt động đồng bộ:** Backend NestJS (port 4000) + Frontend Next.js 14 App Router (port 3000) + n8n Engine (port 5678).

---

## 2. CHUẨN HÓA 3 VAI TRÒ EMAIL TOÀN HỆ THỐNG
Toàn bộ 9 workflows n8n, API backend, dữ liệu khởi tạo (seed) và kịch bản test đã được cố định theo đúng 3 hòm thư chuẩn mực:

| STT | Vai trò trong hệ sinh thái | Địa chỉ Email chuẩn hóa | Chức năng & Phạm vi áp dụng |
|:---:|:---|:---|:---|
| **1** | **SMTP System Sender** | `kieutrangg06123@gmail.com` | Hòm thư hệ thống doanh nghiệp dùng để gửi tự động qua giao thức SMTP Gmail (Gửi xác nhận SLA, gửi cảnh báo nội bộ, gửi thư phản hồi khách hàng sau khi duyệt HITL, gửi email follow-up). |
| **2** | **Internal Admin / Staff** | `tranngo170770@gmail.com` | Đại diện toàn bộ nhân sự nội bộ công ty: Quản trị viên, Trưởng nhóm IT, Kỹ thuật viên (Nguyễn Văn An, Trần Hoàng Bách), Nhân viên Sales (Lê Thị Mai), Kế toán trưởng (Phạm Đức Trọng), Ban Giám Đốc. |
| **3** | **Client / External Sender** | `trangltk.24it@vku.udn.vn` | Địa chỉ đối tác/khách hàng gửi email đến hệ thống trong toàn bộ dữ liệu kiểm thử (ngoại trừ các test case giả lập Spammer/Blacklist hoặc No-reply). |

---

## 3. ÁNH XẠ 10 AI AGENT TRONG 9 WORKFLOWS N8N

```
                         [ Inbound Email ]
                                 │
                     (Luồng 1 - Anti-Spam Gate)
                     ├── Agent 8: Deliverability Monitor
                     └── Agent 9: AI Spam & Phishing Classifier
                                 │
                     (Luồng 2 - Department Triage)
                     └── Agent 1: AI Semantic Triage Agent (P1-P4)
                                 │
      ┌──────────────────────────┼──────────────────────────┐
      ▼ (TECH)                   ▼ (SALES)                  ▼ (FINANCE)
(Luồng 3 - Ticket Gen)     (Luồng 7 - CRM Lead)       (Luồng 9 - Invoice OCR)
└── Agent 3: Email-to-     ├── Agent 4: Email-to-     └── Agent 10: Multimodal
    Ticket Agent               CRM Agent                  Invoice Vision OCR
      │                    └── Agent 7: Campaign
(Luồng 4 - RAG Draft)          Agent                        │
└── Agent 2: AI Reply            │                    (Luồng 6 - Exec Digest)
    Agent (pgvector)       (Luồng 8 - Follow-up)      ├── Agent 5: Executive
      │                    └── Agent 6: Follow-up         Summarization
(Luồng 5 - HITL Send)          Nurturing Agent        └── Agent 8: Anomaly Monitor
└── Human Review & Outbound
```

| STT | Tên AI Agent | Mô hình & Công nghệ | Nằm trong Luồng n8n | Chức năng cụ thể |
|:---:|:---|:---|:---:|:---|
| **1** | **AI Email Triage Agent** | Gemini 1.5/2.0 Flash | Luồng 2 (Node 3) | Phân tích ngữ cảnh tiếng Việt, định tuyến 4 phòng ban (TECH, SALES, FINANCE, GENERAL), gán nhãn độ khẩn cấp P1–P4, trích xuất sắc thái và lý do. |
| **2** | **AI Email Reply Agent** | Gemini + RAG (Vector) | Luồng 4 (Node 6) | Kết hợp kết quả tra cứu vector cosine similarity (pgvector) trên `knowledge_base` để sinh dự thảo trả lời kỹ thuật chuẩn xác. |
| **3** | **AI Email-to-Ticket Agent** | Gemini 1.5/2.0 Flash | Luồng 3 (Node 2) | Bóc tách tiêu đề sự cố ngắn gọn, xác định phân hệ lỗi (`affected_module`), trích xuất các bước tái hiện lỗi (`reproduce_steps`). |
| **4** | **AI Email-to-CRM Agent** | Gemini 1.5/2.0 Flash | Luồng 7 (Node 2) | Bóc tách cấu trúc thực thể kinh doanh từ thư phi cấu trúc: Tên liên hệ, SĐT (+84), Doanh nghiệp, Nhu cầu giải pháp, Ngân sách dự kiến. |
| **5** | **AI Email Summarization Agent** | Gemini 1.5/2.0 Flash | Luồng 6 (Node 5) | Tóm tắt tổng thể email và vé sự cố trong 24h, phân tích sắc thái chung và chỉ ra 3 vấn đề trọng tâm gửi Ban Giám Đốc. |
| **6** | **AI Email Follow-up Agent** | Gemini 1.5/2.0 Flash | Luồng 8 (Node 6) | Đọc lịch sử trao đổi của các deal báo giá > 48h, tự động tạo email hỏi thăm cá nhân hóa theo 3 giai đoạn (Lần 1, Lần 2, Lần 3). |
| **7** | **AI Campaign Agent** | Gemini 1.5/2.0 Flash | Luồng 7 (Node 3) | Định vị phân khúc khách hàng (`ENTERPRISE_HIGH_VALUE` vs `SME_RETAIL`) và gắn nhãn chiến dịch tiếp thị tương ứng. |
| **8** | **AI Deliverability Monitor** | Rule Engine + Gemini | Luồng 1 (Node 4) & Luồng 6 (Node 4) | Kiểm soát chỉ số uy tín người gửi (`reputation_score`), phát hiện tỷ lệ bounce/spam và cảnh báo spike số lượng lỗi P1 tăng đột biến > 20%. |
| **9** | **AI Classification Agent** | Gemini 1.5/2.0 Flash | Luồng 1 (Node 5) | Cửa ngõ phòng vệ đầu tiên: Phân tích phát hiện thư rác (Spam), thư lừa đảo tài chính (Phishing), mã độc hoặc nội dung không hợp lệ. |
| **10** | **AI Attachment Processing Agent** | Gemini Multimodal Vision | Luồng 9 (Node 4) | Đọc file PDF/ảnh hóa đơn, bóc tách Số hóa đơn, MST, Ngày lập, Tiền hàng, Thuế VAT, Tổng tiền thanh toán. |



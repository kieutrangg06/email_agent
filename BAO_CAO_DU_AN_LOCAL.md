# BÁO CÁO TOÀN THƯ HỆ THỐNG EMAIL AUTOMATION & HELPDESK CRM
## PHÂN HỆ VẬN HÀNH MÔI TRƯỜNG LOCAL (PHÒNG LAB & BẢO VỆ ĐỒ ÁN)
**Mô hình Kiến trúc:** 3 Thành Viên × 3 Luồng Xử Lý × 12 Bước (9 Micro-Workflows / 108 Nodes DAG)  
**Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)**

---

## MỤC LỤC TỔNG QUAN
1. [Bản Chất Dự Án & Mục Tiêu Nghiệp Vụ](#1-bản-chất-dự-án--mục-tiêu-nghiệp-vụ)
2. [Kiến Trúc Hạ Tầng Local & Ngăn Xếp Công Nghệ (Tech Stack)](#2-kiến-trúc-hạ-tầng-local--ngăn-xếp-công-nghệ-tech-stack)
3. [Cấu Trúc Tự Động Hóa Email & 3 Hòm Thư Thực Nghiệm Chuẩn](#3-cấu-trúc-tự-động-hóa-email--3-hòm-thư-thực-nghiệm-chuẩn)
4. [Hệ Sinh Thái 10 Tác Tử Trí Tuệ Nhân Tạo (Multi-Agent System)](#4-hệ-sinh-thái-10-tác-tử-trí-tuệ-nhân-tạo-multi-agent-system)
5. [Thiết Kế Cơ Sở Dữ Liệu 14 Bảng (PostgreSQL 16 + pgvector)](#5-thiết-kế-cơ-sở-dữ-liệu-14-bảng-postgresql-16--pgvector)
6. [Chi Tiết 9 Micro-Workflows n8n (Đúng 12 Nodes / Workflow = 108 Nodes)](#6-chi-tiết-9-micro-workflows-n8n-đúng-12-nodes--workflow--108-nodes)
7. [Bộ Kịch Bản Kiểm Thử Cục Bộ Bằng cURL & Bash Scripts](#7-bộ-kịch-bản-kiểm-thử-cục-bộ-bằng-curl--bash-scripts)
8. [Kịch Bản Kiểm Thử Liên Hoàn 9 Luồng Thông Nhau (Full E2E Chain)](#8-kịch-bản-kiểm-thử-liên-hoàn-9-luồng-thông-nhau-full-e2e-chain)
9. [Cẩm Nang Thao Tác Giao Diện Web Next.js Localhost:3000](#9-cẩm-nang-thao-tác-giao-diện-web-nextjs-localhost3000)
10. [Toàn Bộ Lệnh Khởi Chạy, Dừng, Reset Data & Giám Sát Cục Bộ](#10-toàn-bộ-lệnh-khởi-chạy-dừng-reset-data--giám-sát-cục-bộ)
11. [Bộ Câu Hỏi Vấn Đáp Hội Đồng Đồ Án & Đáp Án Phản Biện Chuyên Sâu](#11-bộ-câu-hỏi-vấn-đáp-hội-đồng-đồ-án--đáp-án-phản-biện-chuyên-sâu)

---

## 1. BẢN CHẤT DỰ ÁN & MỤC TIÊU NGHIỆP VỤ

### 1.1. Dự án là gì?
Hệ thống là một **Nền tảng Tự động hóa Xử lý Email Doanh nghiệp Thông minh (Intelligent Enterprise Email Automation)** kết hợp đa tác tử AI (Multi-Agent System), quy trình tự động hóa workflow (n8n Workflow Engine), cơ sở tri thức tăng cường truy xuất RAG (Retrieval-Augmented Generation với pgvector) và trung tâm điều hành dịch vụ khách hàng / CRM Helpdesk đa kênh.

### 1.2. Bài toán doanh nghiệp được giải quyết
Trong môi trường doanh nghiệp vừa và lớn, hòm thư tiếp nhận chung (`support@`, `sales@`, `billing@`, `contact@`) đối mặt với 5 thách thức sống còn:
1. **Quá tải và phản hồi chậm trễ:** Hàng trăm email rác, thư quảng cáo lẫn lộn với thư khách hàng, khiến nhân sự mất trung bình 4–8 giờ chỉ để lọc và chuyển tiếp thủ công.
2. **Vi phạm cam kết chất lượng dịch vụ (SLA Breach):** Các sự cố tê liệt hệ thống mức độ P1 (Sập cơ sở dữ liệu, lỗi cổng thanh toán) bị bỏ sót trong hộp thư đến, dẫn đến vi phạm hợp đồng phạt hàng trăm triệu đồng.
3. **Phản hồi không nhất quán:** Nhân viên CSKH tự tra cứu chính sách rời rạc hoặc tự trả lời theo cảm tính, gây sai lệch thông tin kỹ thuật và cam kết dịch vụ.
4. **Thất thoát cơ hội kinh doanh (Lead Leakage):** Email hỏi mua hàng giá trị cao từ các tập đoàn lớn không được bóc tách số điện thoại và ngân sách kịp thời; không có quy trình chăm sóc tự động (Cadence Follow-up) sau 48 giờ.
5. **Rủi ro gian lận chứng từ kế toán:** Kế toán phải rà soát thủ công từng hóa đơn VAT gửi kèm file ảnh/PDF xem Tiền hàng + Tiền thuế có khớp với Tổng tiền thanh toán hay không.

### 1.3. Lời giải của hệ thống
Hệ thống giải quyết triệt để 5 vấn đề trên bằng chuỗi tự động hóa khép kín:
- **Tiếp nhận & Cách ly:** Tự động bắt email qua Webhook/SMTP, kiểm tra mã độc/lừa đảo bằng AI Gatekeeper, cô lập thư độc hại vào Kho cách ly (`quarantine_vault`).
- **Phân luồng ngữ nghĩa (Semantic Triage):** Phân tích nội dung tiếng Việt tự nhiên, chia về đúng 4 phòng ban chuyên trách (*Technical, Sales, Finance, General*).
- **Cân bằng tải & Cấp vé:** Áp dụng thuật toán Least-Busy tự động gán vé cho kỹ thuật viên rảnh nhất, tính toán hạn SLA chuẩn xác (P1 = 1h, P2 = 4h, P3 = 8h, P4 = 24h).
- **Trợ lý soạn thảo RAG:** Tìm kiếm vector tri thức nội bộ với độ tương đồng cosine trong bảng `knowledge_embeddings`, tự động soạn thư trả lời đầy đủ căn cứ.
- **Phê duyệt Human-in-the-Loop (HITL):** Trưởng bộ phận chỉ cần 1 click để duyệt và gửi email ra ngoài, đảm bảo an toàn tuyệt đối trước khi gửi tới khách hàng.
- **Thị giác máy tính đối soát hóa đơn:** Tự động OCR bóc tách mã số thuế, kiểm tra tính đúng đắn toán học: `Tiền Hàng + Thuế VAT == Tổng Thanh Toán`.
- **Trí tuệ điều hành:** Tổng hợp báo cáo Executive Digest 24h gửi tự động cho Ban Giám Đốc.

---

## 2. KIẾN TRÚC HẠ TẦNG LOCAL & NGĂN XẾP CÔNG NGHỆ (TECH STACK)

### 2.1. Sơ đồ kiến trúc tổng thể môi trường Local
```
                    [Khách Hàng / Nhân Viên Gửi Email]
                                   │
                                   ▼
                   [n8n Webhook Engine - Port 5678]
                                   │
        ┌──────────────────────────┴──────────────────────────┐
        ▼                                                     ▼
[Gemini AI Multi-Agent]                             [PostgreSQL 16 + pgvector]
- Text 1.5/2.0 Flash                                 - 14 Bảng dữ liệu chuẩn
- Embedding 768 chiều                                - Port 5432 (Container)
- Multimodal Vision OCR                                       ▲
        │                                                     │
        └──────────────────────────┬──────────────────────────┘
                                   │
                                   ▼
                        [NestJS Core API Engine]
                           (Port 4000 Backend)
                                   ▲
                                   │ REST API / JSON
                                   ▼
                      [Next.js 14 App Router UI]
                          (Port 3000 Frontend)
                                   │
                      [Người Dùng Vận Hành / HITL]
```

### 2.2. Chi tiết các thành phần công nghệ
| Thành phần | Công nghệ / Nền tảng | Cổng mạng (Port) | Vai trò trong hệ thống Local |
| :--- | :--- | :--- | :--- |
| **Workflow Engine** | n8n Official Docker | `5678` | Bộ não điều phối 9 micro-workflows (108 nodes). |
| **Cơ sở dữ liệu** | PostgreSQL 16 + pgvector | `5432` | Lưu trữ toàn bộ 14 bảng dữ liệu, vector embeddings 768 chiều. |
| **Backend API** | NestJS Core (Node.js 20) | `4000` | Cung cấp RESTful API, xác thực, điều phối nghiệp vụ nội bộ. |
| **Frontend Web** | Next.js 14 (App Router) | `3000` | Giao diện điều hành, duyệt thư HITL, CRM, SLA, OCR Invoices. |
| **AI LLM Gateway** | Google Gemini API | HTTPS Outbound | Xử lý NLP tiếng Việt, Embeddings, OCR hình ảnh hóa đơn. |
| **Email Gateway** | Nodemailer / Gmail SMTP | TCP 465 / 587 | Gửi và nhận thư thực nghiệm qua tài khoản quản trị. |

---

## 3. CẤU TRÚC TỰ ĐỘNG HÓA EMAIL & 3 HÒM THƯ THỰC NGHIỆM CHUẨN

Hệ thống được thiết kế theo mô hình luân chuyển thông tin khép kín qua đúng **3 hòm thư chuẩn**:

```
 ┌──────────────────────────────────────────────────────────────┐
 │ 1. KHÁCH HÀNG NGOÀI (Customer)                              │
 │    trangltk.24it@vku.udn.vn                                  │
 └──────────────┬───────────────────────────────────────────────┘
                │ Gửi email sự cố / mua hàng / hóa đơn
                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ 2. CỔNG PHÁT HỆ THỐNG (System SMTP Gateway)                  │
 │    kieutrangg06123@gmail.com                                 │
 └──────────────┬───────────────────────────────────────────────┘
                │ Chuyển tiếp dữ liệu vào n8n Webhook / API
                │ Gửi thông báo & thư phản hồi chính thức
                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ 3. NỘI BỘ DOANH NGHIỆP (Enterprise Internal / Staff)         │
 │    tranngo170770@gmail.com                                   │
 │    - Nhân viên kinh doanh nhận Lead VIP (Deal 250M, Điểm 95) │
 │    - Kỹ thuật viên nhận cảnh báo vé P1 khẩn cấp              │
 │    - Ban Giám Đốc nhận Báo cáo Điều hành 24H Executive Digest│
 └──────────────────────────────────────────────────────────────┘
```

1. **`trangltk.24it@vku.udn.vn` (Khách hàng bên ngoài):** Đại diện cho khách hàng doanh nghiệp hoặc cá nhân. Đóng vai trò phát sinh yêu cầu (Gửi thư báo lỗi máy chủ P1, hỏi giá CRM, gửi hóa đơn thanh toán).
2. **`kieutrangg06123@gmail.com` (SMTP Gateway trung tâm):** Hòm thư hệ thống được cấu hình App Password để gửi email xác nhận vé tự động cho khách hàng, gửi thư phúc đáp sau khi được cấp quản lý duyệt.
3. **`tranngo170770@gmail.com` (Hòm thư nội bộ doanh nghiệp / Nhân viên & Giám đốc):** Đóng vai trò tiếp nhận thông báo nội bộ:
   - Nhận email đồ họa màu hổ phách khi có Lead bán hàng VIP điểm cao.
   - Nhận email cảnh báo đỏ khi phát hiện hóa đơn sai lệch toán học.
   - Nhận bản tin tổng hợp Báo cáo 24H (Executive Digest) của Ban Giám Đốc.

---

## 4. HỆ SINH THÁI 10 TÁC TỬ TRÍ TUỆ NHÂN TẠO (MULTI-AGENT SYSTEM)

Hệ thống triển khai 10 chuyên gia AI độc lập, phối hợp nhịp nhàng theo mô hình kiến trúc tác tử chuyên biệt:

```
                    ┌───────────────────────────┐
                    │  INCOMING EMAIL INGESTION │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ Agent 1: Anti-Spam Gate   │
                    └──────┬─────────────┬──────┘
             [Nguy hại]    │             │ [An toàn]
     ┌─────────────────────┘             └────────────────────┐
     ▼                                                        ▼
┌───────────────────────────┐                      ┌───────────────────────────┐
│ Quarantine Vault          │                      │ Agent 2: Semantic Triage  │
└───────────────────────────┘                      └─────────────┬─────────────┘
                                                                 │
                                                                 ▼
                                                   ┌───────────────────────────┐
                                                   │ Agent 3: Sentiment & P1-4 │
                                                   └─────────────┬─────────────┘
                                                                 │
                                                                 ▼
                                                   ┌───────────────────────────┐
                                                   │ Agent 4: SLA & Least-Busy │
                                                   └─────────────┬─────────────┘
                                                                 │
         ┌───────────────────────────────────────────────────────┴────────────────────────┐
         ▼                                                       ▼                        ▼
┌───────────────────────────┐                          ┌───────────────────┐    ┌───────────────────┐
│ Agent 5: RAG Retriever    │                          │ Agent 8: CRM Lead │    │ Agent 10: Invoice │
└─────────────┬─────────────┘                          └─────────┬─────────┘    │ Multi-modal OCR   │
              │                                                  │              └─────────┬─────────┘
              ▼                                                  ▼                        │
┌───────────────────────────┐                          ┌───────────────────┐              │
│ Agent 6: HITL Composer    │                          │ Agent 9: Cadence  │              ▼
└─────────────┬─────────────┘                          │ Follow-up 48H     │    ┌───────────────────┐
              │                                        └───────────────────┘    │ Đối Soát Số Học   │
              ▼                                                                 └───────────────────┘
┌───────────────────────────┐
│ Agent 7: Executive Digest │
└───────────────────────────┘
```

1. **Agent 1 - Anti-Spam & Security Gatekeeper:** Kiểm tra SPF, DKIM, blacklists và mã độc file đính kèm. Phát hiện kỹ thuật lừa đảo (Phishing), cô lập tức thì vào bảng `quarantine_vault`.
2. **Agent 2 - Semantic Intent Classifier:** Phân tích ngữ cảnh tiếng Việt không phụ thuộc từ khóa cứng, phân loại email chính xác vào 4 phòng ban: *Technical, Sales, Finance, General*.
3. **Agent 3 - Sentiment & Urgency Assessor:** Đo lường mức độ bức xúc của khách hàng (Tiêu cực, Khẩn cấp, Tích cực), gán ma trận ưu tiên chuẩn ITIL từ **P1 (Critical)** đến **P4 (Low)**.
4. **Agent 4 - Least-Busy SLA Dispatcher:** Kiểm tra số lượng vé đang mở của từng kỹ thuật viên trong bảng `users`, tự động gán vé cho nhân sự ít việc nhất để cân bằng tải.
5. **Agent 5 - RAG Vector Knowledge Retriever:** Trích xuất vector embedding 768 chiều từ Gemini, thực hiện truy vấn cosine similarity (`<=>`) trên bảng `knowledge_embeddings` để lấy tài liệu nội bộ liên quan nhất.
6. **Agent 6 - Human-in-the-Loop Smart Composer:** Kết hợp ngữ cảnh câu hỏi của khách và tri thức RAG để sinh bản nháp câu trả lời chuyên nghiệp, đầy đủ dẫn chứng, đưa lên giao diện `/approval` cho quản lý duyệt.
7. **Agent 7 - Executive Intelligence Synthesizer:** Quét toàn bộ vé hỗ trợ, doanh số CRM, và sự cố trong 24 giờ qua, tóm tắt và sinh email báo cáo điều hành đồ họa cao cấp gửi Ban Giám Đốc.
8. **Agent 8 - B2B CRM Lead Extractor & Scorer:** Phân tích thư hỏi mua hàng, bóc tách tên công ty, số điện thoại, quy mô ngân sách, chấm điểm cơ hội (Lead Score 0–100) và tạo Deal trong pipeline CRM.
9. **Agent 9 - Cadence Follow-up Nurturer:** Tự động hẹn giờ và gửi email chăm sóc khách hàng sau 48 giờ nếu báo giá chưa được phản hồi, tối ưu tỷ lệ chốt hợp đồng.
10. **Agent 10 - Multimodal Invoice OCR Auditor:** Sử dụng thị giác máy tính đọc nội dung hóa đơn PDF/hình ảnh, bóc tách Số Hóa Đơn, Tiền Hàng, Tiền Thuế VAT, Tổng Tiền, và chạy thuật toán đối soát số học chống gian lận.

---

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU 14 BẢNG (POSTGRESQL 16 + PGVECTOR)

Cơ sở dữ liệu được cấu trúc chặt chẽ gồm 14 bảng, lưu trữ tại container `enterprise_db`:

```
                                  ┌────────────────────────┐
                                  │       departments      │
                                  └───────────┬────────────┘
                                              │ 1:N
                                              ▼
┌────────────────────────┐  1:N   ┌────────────────────────┐  1:N   ┌────────────────────────┐
│         emails         ├───────►│        tickets         ├───────►│      email_drafts      │
└───────────┬────────────┘        └───────────┬────────────┘        └────────────────────────┘
            │                                 │
            │ 1:1                             │ N:1
            ▼                                 ▼
┌────────────────────────┐        ┌────────────────────────┐        ┌────────────────────────┐
│    quarantine_vault    │        │         users          │        │      sla_policies      │
└────────────────────────┘        └────────────────────────┘        └────────────────────────┘

┌────────────────────────┐  1:N   ┌────────────────────────┐        ┌────────────────────────┐
│  knowledge_documents   ├───────►│  knowledge_embeddings  │        │   system_audit_logs    │
└────────────────────────┘        └────────────────────────┘        └────────────────────────┘

┌────────────────────────┐  1:N   ┌────────────────────────┐  1:N   ┌────────────────────────┐
│       crm_leads        ├───────►│       invoices         ├───────►│     invoice_items      │
└───────────┬────────────┘        └────────────────────────┘        └────────────────────────┘
            │ 1:N
            ▼
┌────────────────────────┐
│  follow_up_schedules   │
└────────────────────────┘
```

### Danh mục chi tiết 14 bảng dữ liệu:
1. `departments`: Định nghĩa 4 phòng ban (*Technical, Sales, Finance, General*) kèm email tiếp nhận và trưởng bộ phận.
2. `users`: Danh sách kỹ thuật viên và nhân viên kinh doanh kèm số lượng vé đang xử lý (`active_tickets_count`).
3. `emails`: Lưu trữ toàn văn email nhận vào (Tiêu đề, Người gửi, Nội dung gốc, Trạng thái phân loại).
4. `quarantine_vault`: Hòm thư cách ly chứa các email nghi vấn spam, lừa đảo hoặc tệp đính kèm chứa mã độc (`.exe`, `.sh`).
5. `sla_policies`: Quy định thời hạn cam kết phản hồi cho từng mức độ ưu tiên (P1: 1h, P2: 4h, P3: 8h, P4: 24h).
6. `tickets`: Quản lý vé hỗ trợ dịch vụ khách hàng (Mã vé `TK-XXXX`, Phòng ban, Trạng thái, Kỹ thuật viên phụ trách, Hạn SLA).
7. `knowledge_documents`: Kho bài viết tri thức nội bộ, chính sách kỹ thuật, cẩm nang xử lý sự cố.
8. `knowledge_embeddings`: Lưu trữ vector 768 chiều tạo từ Gemini Embeddings, hỗ trợ tìm kiếm ngữ nghĩa nhanh bằng HNSW index.
9. `email_drafts`: Lưu bản nháp thư trả lời do AI sinh ra, trạng thái phê duyệt (*PENDING, APPROVED, REJECTED*).
10. `system_audit_logs`: Nhật ký kiểm toán toàn bộ hoạt động hệ thống (Phê duyệt thư, bóc tách OCR, cảnh báo gian lận).
11. `crm_leads`: Hồ sơ cơ hội kinh doanh B2B (Tên khách hàng, Doanh nghiệp, Số điện thoại, Giá trị Deal dự kiến, Điểm Lead Score).
12. `invoices`: Bảng dữ liệu hóa đơn đối soát (Số hóa đơn, Đơn vị bán, Tiền hàng, Thuế VAT, Tổng thanh toán, Trạng thái kiểm tra).
13. `invoice_items`: Chi tiết từng dòng sản phẩm / dịch vụ trong hóa đơn OCR.
14. `follow_up_schedules`: Lịch trình tự động gửi email chăm sóc báo giá sau 48h.

---

## 6. CHI TIẾT 9 MICRO-WORKFLOWS N8N (ĐÚNG 12 NODES / WORKFLOW = 108 NODES)

Mỗi thành viên chịu trách nhiệm đúng 3 Micro-Workflows, mỗi Micro-Workflow được chuẩn hóa **chính xác 12 Nodes** theo chuẩn Directed Acyclic Graph (DAG) của n8n:

### 6.1. Phân Hệ Thành Viên 1: Tiếp Nhận Email, Phân Luồng & Điều Phối SLA

#### Luồng 1: flow01_ingest_antispam.json (Đúng 12 Nodes)
*Mục đích: Tiếp nhận email thô qua Webhook, kiểm tra danh sách đen, phát hiện mã độc và cách ly an toàn.*
1. `Webhook Receiver`: Tiếp nhận HTTP POST payload từ email server hoặc giao diện Inbound.
2. `Normalize Payload`: Chuẩn hóa tiêu đề, địa chỉ người gửi, loại bỏ ký tự lạ.
3. `Check Sender Domain`: Bóc tách tên miền người gửi, kiểm tra tính hợp lệ.
4. `Check Blacklist DB`: Truy vấn bảng danh sách đen / từ chối tiếp nhận.
5. `Inspect File Extension`: Kiểm tra đuôi file đính kèm (`.exe`, `.scr`, `.bat`, `.vbs`).
6. `AI Spam Analyzer`: Gọi Gemini LLM phân tích dấu hiệu lừa đảo mạo danh ngân hàng (Phishing).
7. `Threat Decision IF`: Nhánh rẽ logic: Nếu phát hiện nguy hại -> Sang nhánh Cách ly; Nếu sạch -> Sang nhánh Tiếp nhận.
8. `Quarantine Insert DB`: Lưu toàn văn thư độc hại vào bảng `quarantine_vault`.
9. `Audit Log Threat`: Ghi nhật ký cảnh báo an ninh vào `system_audit_logs`.
10. `Store Clean Email DB`: Ghi nhận thư an toàn vào bảng `emails` với trạng thái `PENDING_TRIAGE`.
11. `Emit Clean Event`: Kích hoạt tín hiệu chuyển tiếp sang Luồng 2.
12. `HTTP Respond 200`: Phản hồi trạng thái xử lý thành công cho máy chủ gửi.

#### Luồng 2: flow02_department_triage.json (Đúng 12 Nodes)
*Mục đích: Phân loại ngữ nghĩa về 4 phòng ban và đánh giá mức độ khẩn cấp P1–P4.*
1. `Sub-Workflow Trigger`: Nhận sự kiện email đã làm sạch từ Luồng 1.
2. `Fetch Email Content`: Đọc toàn văn nội dung và tiêu đề từ bảng `emails`.
3. `Gemini Semantic Prompt`: Tạo prompt ngữ cảnh chuyên sâu về cấu trúc tổ chức doanh nghiệp.
4. `Gemini LLM Classifier`: Gọi Gemini 1.5/2.0 Flash nhận diện phòng ban (*Technical, Sales, Finance, General*).
5. `Sentiment & Urgency Analyzer`: Đo lường cảm xúc khách hàng và gán mức độ ưu tiên P1–P4.
6. `Parse JSON Output`: Bóc tách kết quả có cấu trúc từ AI.
7. `Validate Department Enum`: Kiểm tra phòng ban có thuộc 4 nhóm hợp lệ hay không.
8. `Update Email Triage DB`: Cập nhật `assigned_department` và `priority` vào bảng `emails`.
9. `Create Audit Trace`: Lưu vết phân loại vào `system_audit_logs`.
10. `Route Switch Node`: Rẽ nhánh nghiệp vụ theo phòng ban được chỉ định.
11. `Trigger Flow 3 Event`: Kích hoạt Luồng 3 để cấp vé và tính toán thời hạn SLA.
12. `Trigger Specialized Flow`: Kích hoạt luồng chuyên biệt (Luồng 7 nếu là Sales, Luồng 9 nếu là Finance).

#### Luồng 3: flow03_ticket_sla_dispatch.json (Đúng 12 Nodes)
*Mục đích: Cấp mã vé, tính toán SLA và áp dụng thuật toán Least-Busy gán cho kỹ thuật viên.*
1. `Receive Triage Event`: Nhận tín hiệu email đã phân loại từ Luồng 2.
2. `Fetch SLA Policy`: Tra cứu bảng `sla_policies` lấy thời hạn xử lý theo mức độ ưu tiên (P1: 1h, P2: 4h,...).
3. `Compute SLA Due Date`: Tính toán mốc thời gian hạn chót cam kết dựa trên giờ hiện tại.
4. `Query Staff Load`: Truy vấn số lượng vé `active_tickets_count` của các kỹ thuật viên trong phòng ban.
5. `Least-Busy Algorithm`: Chọn kỹ thuật viên có số lượng vé đang xử lý thấp nhất.
6. `Generate Ticket ID`: Sinh mã vé duy nhất theo cú pháp chuẩn doanh nghiệp `TK-YYYYMMDD-XXXX`.
7. `Insert Ticket DB`: Lưu vé mới vào bảng `tickets` với đầy đủ thông tin SLA và kỹ thuật viên gán việc.
8. `Increment User Workload`: Cập nhật tăng số vé đang mở của kỹ thuật viên trong bảng `users`.
9. `Format Inbound ACK`: Soạn thảo nội dung email phản hồi tự động thông báo mã vé cho khách hàng.
10. `Send Customer ACK Email`: Gửi email xác nhận tiếp nhận vé tới hòm thư khách hàng qua SMTP Gateway.
11. `Check Priority P1 IF`: Kiểm tra nếu là sự cố P1 (Critical) -> Kích hoạt cảnh báo khẩn.
12. `Trigger Flow 4 (RAG)`: Kích hoạt Luồng 4 để tự động tìm tài liệu và soạn bản nháp phản hồi.

---

### 6.2. Phân Hệ Thành Viên 2: Cơ Sở Tri Thức RAG, Phê Duyệt HITL & Báo Cáo Điều Hành

#### Luồng 4: flow04_rag_knowledge_draft.json (Đúng 12 Nodes)
*Mục đích: Truy vấn vector tri thức nội bộ và tự động soạn thảo bản nháp trả lời.*
1. `Ticket Created Trigger`: Tiếp nhận mã vé mới cần soạn thảo trả lời từ Luồng 3.
2. `Extract Query Context`: Bóc tách câu hỏi cốt lõi từ nội dung email khách hàng.
3. `Generate Embedding Vector`: Gọi Gemini API tạo vector nhúng 768 chiều từ câu hỏi của khách.
4. `Execute Vector Search SQL`: Chạy truy vấn cosine similarity (`<=>`) trên bảng `knowledge_embeddings`.
5. `Filter Threshold (>0.75)`: Lọc bỏ các tài liệu có độ tương đồng thấp, chỉ giữ lại tri thức phù hợp nhất.
6. `Format Knowledge Context`: Gom các đoạn trích tài liệu nội bộ thành ngữ cảnh bổ trợ cho AI.
7. `Construct HITL Prompt`: Xây dựng prompt hướng dẫn AI đóng vai trò chuyên viên hỗ trợ của công ty.
8. `Gemini Draft Synthesis`: Gọi Gemini LLM tổng hợp câu trả lời lịch sự, chính xác, viện dẫn quy định.
9. `Insert Draft DB`: Lưu bản nháp vào bảng `email_drafts` với trạng thái `PENDING_APPROVAL`.
10. `Update Ticket Draft Status`: Đánh dấu vé đã có bản nháp sẵn sàng duyệt.
11. `Audit Log RAG Draft`: Ghi nhận nguồn tài liệu đã tham chiếu vào `system_audit_logs`.
12. `Notify HITL Reviewer`: Gửi thông báo đến trang duyệt thư `/approval` của cấp quản lý.

#### Luồng 5: flow05_hitl_approval_send.json (Đúng 12 Nodes)
*Mục đích: Tiếp nhận thao tác phê duyệt của con người, gửi email thật ra ngoài và đóng vé.*
1. `Approval Webhook Receive`: Tiếp nhận yêu cầu phê duyệt từ trang Web `/approval`.
2. `Fetch Draft & Ticket Data`: Đọc chi tiết bản nháp, nội dung sửa đổi và email người nhận.
3. `Evaluate Decision IF`: Kiểm tra hành động của quản lý: `APPROVED` hay `REJECTED`.
4. `Handle Rejected Branch`: Nếu từ chối -> Cập nhật trạng thái nháp và yêu cầu soạn lại.
5. `Format Outbound Email`: Gắn template HTML nhận diện thương hiệu công ty vào nội dung được duyệt.
6. `SMTP Dispatch Outbound`: Thực hiện gửi email thật đến khách hàng qua SMTP Gateway.
7. `Verify SMTP Delivery`: Kiểm tra mã phản hồi HTTP/SMTP từ máy chủ gửi thư.
8. `Update Draft APPROVED`: Đổi trạng thái bản nháp thành `APPROVED` và lưu thời điểm gửi.
9. `Update Ticket RESOLVED`: Đổi trạng thái vé trong bảng `tickets` thành `RESOLVED`.
10. `Decrement Staff Load`: Giảm số lượng vé đang mở của kỹ thuật viên phụ trách.
11. `Log HITL Audit`: Ghi nhận người duyệt, thời gian duyệt và độ trễ SLA vào `system_audit_logs`.
12. `HTTP Response to UI`: Phản hồi kết quả gửi thư thành công cho giao diện Web.

#### Luồng 6: flow06_executive_digest.json (Đúng 12 Nodes)
*Mục đích: Tự động tổng hợp chỉ số điều hành toàn công ty trong 24h và gửi Ban Giám Đốc.*
1. `Cron Schedule (08:00 AM)`: Kích hoạt định kỳ 24 giờ một lần hoặc bấm nút thủ công trên Web.
2. `Query 24H Tickets Stats`: Thống kê tổng số vé nhận, số vé giải quyết, số vé vi phạm SLA.
3. `Query 24H Leads Stats`: Thống kê tổng số cơ hội bán hàng mới, giá trị Deal tiềm năng.
4. `Query 24H Invoices Stats`: Thống kê tổng tiền hóa đơn hợp lệ và cảnh báo sai lệch tài chính.
5. `Query Quarantine Stats`: Thống kê số lượng cuộc tấn công lừa đảo/mã độc đã ngăn chặn.
6. `Assemble Raw Analytics`: Tập hợp toàn bộ số liệu thành cấu trúc dữ liệu JSON tổng thể.
7. `Gemini Executive Prompt`: Xây dựng prompt yêu cầu AI đóng vai trò Giám đốc Vận hành (COO).
8. `Gemini Generate Summary`: Gọi Gemini LLM viết nhận xét sắc bén, nêu bật rủi ro và giải pháp khắc phục.
9. `Render HTML Dashboard`: Tạo email đồ họa chuẩn doanh nghiệp (bảng biểu, biểu đồ, điểm tin chính).
10. `Send Digest to Management`: Gửi email báo cáo đến hòm thư Ban Giám Đốc `tranngo170770@gmail.com`.
11. `Store Digest Report DB`: Lưu nội dung báo cáo điều hành vào cơ sở dữ liệu.
12. `Log Executive Audit`: Ghi nhật ký phát hành báo cáo vào `system_audit_logs`.

---

### 6.3. Phân Hệ Thành Viên 3: CRM Bán Hàng, Nuôi Dưỡng Lead & Đối Soát Hóa Đơn

#### Luồng 7: flow07_crm_lead_scoring.json (Đúng 12 Nodes)
*Mục đích: Bóc tách thông tin B2B từ email Sales, chấm điểm tiềm năng và tạo Deal trong CRM.*
1. `Sales Triage Trigger`: Tiếp nhận sự kiện email được phân loại vào phòng Sales từ Luồng 2.
2. `Extract Lead Details`: Sử dụng Gemini AI bóc tách: Tên công ty, Người liên hệ, SĐT, Ngân sách dự kiến.
3. `Scoring Formula Node`: Tính điểm Lead Score (0–100) dựa trên quy mô công ty, ngân sách và mức độ cấp bách.
4. `Evaluate VIP Lead IF`: Kiểm tra nếu Lead Score >= 80 điểm -> Đánh dấu là Cơ hội VIP.
5. `Insert CRM Lead DB`: Tạo bản ghi cơ hội bán hàng trong bảng `crm_leads` với giai đoạn `NEW_INQUIRY`.
6. `Format Internal Alert`: Soạn email thông báo đồ họa màu hổ phách dành riêng cho phòng Kinh doanh.
7. `Send Sales Alert Email`: Gửi email cảnh báo cơ hội mới tới hòm thư phụ trách `tranngo170770@gmail.com`.
8. `Schedule Follow-up Timer`: Tạo mốc hẹn giờ chăm sóc tự động sau 48 giờ.
9. `Insert Follow-up Schedule`: Lưu lịch hẹn chăm sóc vào bảng `follow_up_schedules`.
10. `Create Lead Audit Trace`: Ghi nhật ký khởi tạo Lead vào `system_audit_logs`.
11. `Trigger Flow 8 Registration`: Đăng ký luồng chăm sóc tự động sang Luồng 8.
12. `Flow Complete Return`: Kết thúc luồng xử lý và lưu trạng thái thành công.

#### Luồng 8: flow08_automated_followup.json (Đúng 12 Nodes)
*Mục đích: Định kỳ kiểm tra các cơ hội bán hàng chưa chốt và gửi thư chăm sóc tự động sau 48h.*
1. `Cron Cadence Trigger`: Bộ định thời kiểm tra mỗi 1 giờ hoặc kích hoạt theo lịch hẹn.
2. `Query Pending Follow-ups`: Truy vấn các lịch trình đến hạn trong bảng `follow_up_schedules`.
3. `Check Lead Status DB`: Đọc trạng thái hiện tại của Lead trong bảng `crm_leads`.
4. `Check Converted IF`: Kiểm tra: Nếu Lead đã chốt đơn (`WON`) hoặc từ chối (`LOST`) -> Hủy chăm sóc.
5. `Cancel Follow-up Node`: Cập nhật trạng thái lịch hẹn thành `CANCELLED` nếu deal đã hoàn tất.
6. `Fetch Sales Context`: Lấy lịch sử trao đổi và báo giá đã gửi trước đó.
7. `Gemini Nurture Composer`: Gọi Gemini AI soạn thư nhắc nhở lịch sự, đề xuất hỗ trợ thêm kỹ thuật.
8. `Format Outbound Email`: Đóng gói nội dung thư chăm sóc vào template chuyên nghiệp.
9. `Send Follow-up Email`: Gửi email trực tiếp đến hòm thư khách hàng qua SMTP Gateway.
10. `Update Schedule COMPLETED`: Đổi trạng thái lịch hẹn trong cơ sở dữ liệu thành `COMPLETED`.
11. `Update Lead Stage QUOTED`: Nâng giai đoạn của Lead trong CRM sang `QUOTED / IN_NURTURE`.
12. `Audit Log Follow-up`: Ghi vết hành động chăm sóc tự động vào `system_audit_logs`.

#### Luồng 9: flow09_invoice_multimodal_ocr.json (Đúng 12 Nodes)
*Mục đích: Đọc hóa đơn bằng thị giác máy tính, bóc tách thuế VAT và đối soát số học chống gian lận.*
1. `Invoice File Received`: Tiếp nhận file đính kèm hóa đơn (PDF hoặc ảnh PNG/JPG).
2. `Validate File Extension`: Kiểm tra định dạng tài liệu hợp lệ (`.pdf`, `.png`, `.jpg`, `.txt`).
3. `Convert File to Base64`: Mã hóa file thành chuỗi base64 chuẩn bị cho AI Vision.
4. `Gemini Vision OCR Call`: Gọi Gemini Multimodal đọc nội dung hình ảnh tài liệu hóa đơn.
5. `Extract Structured Fields`: Bóc tách: Số Hóa Đơn, Tên Đơn Vị Bán, Mã Số Thuế, Tiền Hàng, Thuế VAT, Tổng Tiền.
6. `Normalize Numeric Values`: Chuẩn hóa số học, loại bỏ dấu chấm/phẩy phân cách hàng nghìn.
7. `Math Verification Node`: Thực hiện phép kiểm tra: `abs((Tiền Hàng + Thuế VAT) - Tổng Tiền) < 1.0`.
8. `Math Match Decision IF`: Rẽ nhánh logic: Khớp 100% -> Hợp lệ; Lệch số học -> Cảnh báo sai lệch.
9. `Store Discrepancy Alert`: Gắn cờ `DISCREPANCY_FLAGGED`, gửi email cảnh báo đỏ tới Kế toán trưởng.
10. `Store Validated Invoice`: Lưu hóa đơn vào bảng `invoices` với trạng thái `VALIDATED` (Hợp lệ).
11. `Insert Invoice Items DB`: Lưu chi tiết các danh mục hàng hóa vào bảng `invoice_items`.
12. `Write Audit Verification`: Ghi toàn bộ kết quả đối soát số học vào `system_audit_logs`.

---

## 7. BỘ KỊCH BẢN KIỂM THỬ CỤC BỘ BẰNG CURL & BASH SCRIPTS

Toàn bộ các file kiểm thử nằm trong thư mục [test_scripts/](file:///home/kieu-trang/email-automation/test_scripts/):

| Tên tập tin kịch bản | Luồng kiểm thử | Mục đích kiểm thử | Lệnh thực thi trực tiếp |
| :--- | :--- | :--- | :--- |
| `test_01_flow1_clean.sh` | Luồng 1 | Gửi email hợp lệ, kiểm tra đi qua bộ lọc an toàn vào bảng `emails`. | `bash test_scripts/test_01_flow1_clean.sh` |
| `test_01_flow1_bounce.sh` | Luồng 1 | Gửi email từ hộp thư bị lỗi phân giải tên miền. | `bash test_scripts/test_01_flow1_bounce.sh` |
| `test_02_flow1_blacklist.sh`| Luồng 1 | Gửi email từ địa chỉ spam nằm trong danh sách đen, kiểm tra cách ly. | `bash test_scripts/test_02_flow1_blacklist.sh` |
| `test_03_flow2_triage_p1.sh` | Luồng 2 | Gửi sự cố sập máy chủ, kiểm tra AI phân vào Technical, gán P1. | `bash test_scripts/test_03_flow2_triage_p1.sh` |
| `test_04_flow2_sales_p2.sh` | Luồng 2 | Gửi yêu cầu mua bản quyền 50 máy, kiểm tra phân vào Sales, gán P2. | `bash test_scripts/test_04_flow2_sales_p2.sh` |
| `test_05_flow2_finance_p3.sh`| Luồng 2 | Gửi yêu cầu đối soát chứng từ, kiểm tra phân vào Finance, gán P3. | `bash test_scripts/test_05_flow2_finance_p3.sh` |
| `test_06_flow2_general_p4.sh`| Luồng 2 | Gửi thư hỏi lịch làm việc lễ, kiểm tra phân vào General, gán P4. | `bash test_scripts/test_06_flow2_general_p4.sh` |
| `test_07_flow3_ticket_least_busy.sh` | Luồng 3 | Kiểm tra thuật toán cân bằng tải gán vé cho kỹ thuật viên ít việc nhất. | `bash test_scripts/test_07_flow3_ticket_least_busy.sh` |
| `test_08_flow4_rag_draft.sh`| Luồng 4 | Kiểm tra truy vấn vector tương đồng cosine và tạo bản nháp câu trả lời. | `bash test_scripts/test_08_flow4_rag_draft.sh` |
| `test_09_flow5_hitl_approval.sh` | Luồng 5 | Giả lập thao tác quản lý bấm Duyệt và gửi email thực tế ra ngoài. | `bash test_scripts/test_09_flow5_hitl_approval.sh` |
| `test_10_flow6_executive_digest.sh` | Luồng 6 | Kích hoạt tổng hợp báo cáo điều hành 24H gửi cho Ban Giám Đốc. | `bash test_scripts/test_10_flow6_executive_digest.sh` |
| `test_11_flow7_crm_lead_scoring.sh` | Luồng 7 | Bóc tách Lead B2B, chấm điểm 95/100 và gửi email báo cho Sales. | `bash test_scripts/test_11_flow7_crm_lead_scoring.sh` |
| `test_12_flow8_followup_cadence.sh` | Luồng 8 | Kiểm tra quy trình quét và gửi thư chăm sóc tự động sau 48h. | `bash test_scripts/test_12_flow8_followup_cadence.sh` |
| `test_13_flow9_invoice_ocr_math.sh` | Luồng 9 | Kiểm tra đối soát số học hóa đơn (Hợp lệ vs Sai lệch toán học). | `bash test_scripts/test_13_flow9_invoice_ocr_math.sh` |

---

## 8. KỊCH BẢN KIỂM THỬ LIÊN HOÀN 9 LUỒNG THÔNG NHAU (FULL E2E CHAIN)

Kịch bản chạy liên hoàn tự động qua file [test_e2e_full_chain.sh](file:///home/kieu-trang/email-automation/test_scripts/test_e2e_full_chain.sh) chứng minh tính toàn vẹn khép kín của 9 Micro-Workflows:

```bash
# Thực thi chuỗi kiểm thử liên hoàn từ đầu đến cuối
bash test_scripts/test_e2e_full_chain.sh
```

### Tiến trình thực thi 5 giai đoạn liên hoàn:
1. **Giai đoạn 1 (Lọc & Phân Luồng):** Gửi 3 email đồng thời (1 Thư rác chứa mã độc, 1 Thư báo sập database, 1 Thư hỏi mua hợp đồng Enterprise).
   - Thư độc hại bị chặn tại Luồng 1 -> Chuyển vào `quarantine_vault`.
   - Thư kỹ thuật đi qua Luồng 1 -> Luồng 2 -> Phân loại `Technical`, gán `P1 - Critical`.
   - Thư bán hàng đi qua Luồng 1 -> Luồng 2 -> Phân loại `Sales`, gán `P2 - High`.
2. **Giai đoạn 2 (Cấp Vé & Điều Phối SLA):** Luồng 3 nhận diện vé P1, tính hạn SLA 1 giờ, chọn kỹ thuật viên có số lượng vé thấp nhất (*Nguyễn Văn An*), gửi email xác nhận mã vé `TK-XXXX` cho khách hàng.
3. **Giai đoạn 3 (RAG Tri Thức & Duyệt HITL):**
   - Luồng 4 tìm kiếm bài viết hướng dẫn khôi phục database trong `knowledge_embeddings`, gọi Gemini viết bản nháp khắc phục sự cố.
   - Luồng 5 thực hiện duyệt bản nháp, gửi email trả lời khách hàng và tự động đóng vé.
4. **Giai đoạn 4 (CRM Bán Hàng & Chăm Sóc):**
   - Luồng 7 bóc tách Deal bán hàng 250.000.000 đ, chấm điểm Lead 95/100, tạo cơ hội trên CRM và gửi email đồ họa màu hổ phách tới `tranngo170770@gmail.com`.
   - Luồng 8 lên lịch hẹn gửi thư chăm sóc tự động sau 48 giờ.
5. **Giai đoạn 5 (Đối Soát Kế Toán & Báo Cáo Giám Đốc):**
   - Luồng 9 đối soát hóa đơn VAT, phát hiện sai lệch số học nếu có và ghi nhật ký kiểm toán.
   - Luồng 6 thu thập toàn bộ dữ liệu của 8 luồng trước, lập bản tin Executive Digest đồ họa gửi Ban Giám Đốc.

---

## 9. CẨM NANG THAO TÁC GIAO DIỆN WEB NEXT.JS (LOCALHOST:3000)

Giao diện vận hành được xây dựng trên nền tảng Next.js 14 App Router, tối ưu hóa cho quản trị viên và nhân viên vận hành:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 LOCAL CONSOLE                        │
├─────────────┬──────────────────────────────────────────────────────────┤
│ /tickets    │ Trung tâm Tiếp nhận Email, Triage, SLA Countdown & Vé    │
│ /approval   │ Giao diện Duyệt Thư Human-in-the-Loop (1 Click Send)     │
│ /analytics  │ Báo cáo Điều hành, Tỷ lệ SLA, Kích hoạt Digest 24H       │
│ /crm        │ Quản lý Cơ hội Bán hàng B2B & Kích hoạt Chăm sóc 48H    │
│ /invoices   │ Bóc tách OCR Hóa đơn & Nhật Ký Kiểm Toán Audit Logs      │
│ /login      │ Xác thực Quản trị viên hệ thống                          │
└─────────────┴──────────────────────────────────────────────────────────┘
```

### 9.1. Trang Hộp Thư & Quản Trị Vé (`http://localhost:3000/tickets`)
- **Nút `+ Gửi Thư Khách Hàng (Inbound Portal)`:** Mở modal gửi thư thực tế. Khách hàng chỉ cần nhập Họ tên, Email, Tiêu đề, Nội dung và chọn tệp đính kèm thật từ máy tính.
- **Bảng Semantic Triage:** Hiển thị danh sách email tiếp nhận, tự động hiển thị nhãn phòng ban (*Technical, Sales, Finance, General*) và huy hiệu ưu tiên (*P1 - Đỏ, P2 - Cam, P3 - Vàng, P4 - Xanh*).
- **Huy hiệu SLA Countdown:** Hiển thị thời gian đếm ngược trực tiếp (ví dụ: `Còn 58p 24s`). Chuyển sang màu đỏ cảnh báo nếu vi phạm thời hạn.
- **Kho Cách Ly (Quarantine Vault):** Hiển thị danh sách thư độc hại bị chặn đứng kèm lý do an ninh.

### 9.2. Trang Duyệt Thư Human-in-the-Loop (`http://localhost:3000/approval`)
- Hiển thị danh sách các bản nháp câu trả lời do AI RAG tổng hợp đang chờ phê duyệt.
- Cho phép quản trị viên đọc câu hỏi của khách hàng, tài liệu tham chiếu RAG, chỉnh sửa trực tiếp nội dung thư nháp nếu cần.
- Bấm **`Phê Duyệt & Gửi Thư`**: Kích hoạt Luồng 5 gửi email thật ra ngoài và đóng vé ngay trên giao diện.

### 9.3. Trang Báo Cáo Điều Hành & SLA (`http://localhost:3000/analytics`)
- Biểu đồ phân bổ tỷ lệ khối lượng công việc giữa 4 phòng ban.
- Thống kê tỷ lệ tuân thủ cam kết SLA (% hoàn thành đúng hạn).
- Nút **`🚀 Kích Hoạt Gửi Báo Cáo 24H (Ban Giám Đốc)`**: Kích hoạt Luồng 6 tổng hợp dữ liệu và gửi ngay bản tin điều hành về hòm thư `tranngo170770@gmail.com`.

### 9.4. Trang Quản Lý Cơ Hội Bán Hàng CRM (`http://localhost:3000/crm`)
- Hiển thị phễu bán hàng qua 5 giai đoạn: *Tất Cả, Mới Tiếp Nhận, Báo Giá / Đề Xuất, Cần Chăm Sóc Lại, Chốt Thành Công*.
- Xem điểm số tiềm năng Lead Score (ví dụ: `95/100`) và quy mô giá trị hợp đồng dự kiến (ví dụ: `250.000.000 đ`).
- Nút **`⏰ Kích Hoạt Chăm Sóc 48H`**: Cho phép kích hoạt thủ công tiến trình nuôi dưỡng khách hàng của Luồng 8.

### 9.5. Trang Hóa Đơn & Kiểm Toán Kế Toán (`http://localhost:3000/invoices`)
- Bảng danh mục hóa đơn đã đối soát qua Luồng 9: Số hóa đơn, Ngày lập, Đơn vị bán, Tiền hàng, Thuế VAT, Tổng thanh toán.
- Huy hiệu trạng thái: `HỢP LỆ (VALIDATED)` màu xanh hoặc `SAI LỆCH (DISCREPANCY_FLAGGED)` màu đỏ nhấp nháy.
- Tab **`Nhật Ký Kiểm Toán Audit Logs`**: Hiển thị chi tiết từng bước xác minh số học chống gian lận thuế.

---

## 10. TOÀN BỘ LỆNH KHỞI CHẠY, DỪNG, RESET DATA & GIÁM SÁT CỤC BỘ

### 10.1. Khởi chạy toàn bộ hệ sinh thái Local
```bash
# Di chuyển vào thư mục gốc dự án
cd /home/kieu-trang/email-automation

# Khởi chạy toàn bộ dịch vụ (Docker, Backend NestJS, Frontend Next.js)
bash run_all.sh
```
*Script `run_all.sh` sẽ tự động khởi động container `enterprise_db` (PostgreSQL 16 + pgvector), container `enterprise_n8n`, khởi động NestJS API trên cổng 4000 và Next.js trên cổng 3000.*

### 10.2. Dừng toàn bộ hệ thống
```bash
bash stop_all.sh
```
*Tắt an toàn các tiến trình Node.js nền và đưa các container Docker về trạng thái dừng.*

### 10.3. Xóa trắng và khôi phục dữ liệu mẫu (Reset Data)
```bash
bash reset_test_data.sh
```
*Tự động chạy tập lệnh SQL `database/reset_test_data.sql`, làm sạch bảng `emails`, `tickets`, `email_drafts`, `crm_leads`, `invoices`, đưa hệ thống về trạng thái ban đầu để chuẩn bị trình diễn trước hội đồng.*

### 10.4. Kiểm tra thống kê cơ sở dữ liệu nhanh
```bash
bash view_db_stats.sh
```
*Hiển thị bảng tóm tắt số lượng bản ghi của toàn bộ 14 bảng trong cơ sở dữ liệu cục bộ.*

---

## 11. BỘ CÂU HỎI VẤN ĐÁP HỘI ĐỒNG ĐỒ ÁN & ĐÁP ÁN PHẢN BIỆN CHUYÊN SÂU

### Câu 1: Tại sao hệ thống lại chia thành 9 Micro-Workflows thay vì làm 1 Workflow lớn?
**Đáp án ăn điểm:**  
> "Việc phân tách thành 9 Micro-Workflows tuân thủ nguyên lý thiết kế Microservices và Single Responsibility Principle (SRP) trong công nghệ phần mềm:
> 1. **Dễ cô lập lỗi (Fault Isolation):** Nếu bước OCR hóa đơn gặp sự cố mạng, toàn bộ chuỗi tiếp nhận email và điều phối vé P1 của phòng Kỹ thuật vẫn hoạt động bình thường 100%.
> 2. **Tối ưu hóa tài nguyên & Khả năng mở rộng (Scalability):** Từng luồng có thể scale độc lập (ví dụ Luồng 1 tiếp nhận có thể chạy nhiều workers hứng lượng thư lớn).
> 3. **Phân chia công việc nhóm rõ ràng:** Mỗi thành viên phụ trách trọn vẹn 3 luồng chức năng độc lập (Thành viên 1: Tiền kỳ & SLA; Thành viên 2: RAG & Điều hành; Thành viên 3: CRM & Kế toán), đảm bảo đúng khối lượng đồ án tốt nghiệp."

### Câu 2: Thuật toán Least-Busy trong Luồng 3 hoạt động như thế nào?
**Đáp án ăn điểm:**  
> "Hệ thống truy vấn bảng `users` kết hợp với bảng `tickets` có điều kiện `status IN ('OPEN', 'IN_PROGRESS')`. Hệ thống sắp xếp kỹ thuật viên thuộc phòng ban tương ứng theo thứ tự tăng dần của `active_tickets_count`. Người có số lượng vé thấp nhất sẽ được gán vé mới. Ngay sau khi gán, hệ thống thực hiện transaction cập nhật tăng `active_tickets_count` lên 1, đảm bảo tính nhất quán (ACID) ngay cả khi có nhiều email gửi đến đồng thời."

### Câu 3: Làm thế nào hệ thống đảm bảo AI RAG không trả lời bịa đặt (Hallucination)?
**Đáp án ăn điểm:**  
> "Hệ thống áp dụng 3 lớp kiểm soát nghiêm ngặt:
> 1. **Ngưỡng tương đồng cosine (Similarity Threshold):** Chỉ những tài liệu có khoảng cách cosine vượt qua ngưỡng 0.75 trong bảng `knowledge_embeddings` mới được đưa vào context.
> 2. **Prompt Grounding:** Prompt chỉ thị rõ ràng cho Gemini: *'Chỉ sử dụng thông tin trong ngữ cảnh được cung cấp. Nếu tài liệu không đề cập, bắt buộc phải trả lời: Bộ phận kỹ thuật đang tiếp tục ghi nhận và kiểm tra trực tiếp'*.
> 3. **Cơ chế Human-in-the-Loop (HITL):** Thư AI soạn thảo KHÔNG bao giờ được gửi tự động ngay, mà phải lưu vào bảng `email_drafts` để quản lý chuyên môn bấm duyệt trên giao diện `/approval`."

### Câu 4: Vì sao cần pgvector thay vì dùng các Vector Database rời như Pinecone hay Milvus?
**Đáp án ăn điểm:**  
> "Sử dụng extension `pgvector` tích hợp trực tiếp trên PostgreSQL 16 đem lại 3 lợi thế vượt trội:
> 1. **Tính toàn vẹn giao dịch (ACID):** Cho phép thực hiện JOIN trực tiếp giữa dữ liệu vector của tài liệu tri thức với dữ liệu quan hệ của vé hỗ trợ và người dùng trong cùng một transaction.
> 2. **Đơn giản hóa hạ tầng:** Doanh nghiệp không cần vận hành thêm một cụm server vector database riêng biệt, giảm chi phí bảo trì và độ phức tạp mạng.
> 3. **Hiệu năng cao với Index HNSW:** pgvector hỗ trợ chỉ mục Hierarchical Navigable Small World, cho tốc độ tìm kiếm vector hàng triệu chiều trong thời gian dưới 10 mili-giây."

### Câu 5: Hệ thống phát hiện gian lận hóa đơn trong Luồng 9 bằng cơ chế gì?
**Đáp án ăn điểm:**  
> "Sau khi trích xuất các số liệu tài chính qua Gemini Multimodal Vision OCR, hệ thống không tin tưởng tuyệt đối vào kết quả văn bản mà chạy một hàm kiểm tra số học độc lập:  
> `Math.abs((Subtotal + VAT_Amount) - Total_Amount) < 1.0`  
> Nếu phát hiện chênh lệch dù chỉ 1 đồng, hệ thống tự động gán cờ `DISCREPANCY_FLAGGED`, ghi nhận nhật ký kiểm toán và gửi cảnh báo đỏ tức thì cho Kế toán trưởng, ngăn ngừa triệt để nguy cơ trốn thuế hoặc thanh toán sai chứng từ."

---
*Tài liệu được biên soạn phục vụ công tác nghiệm thu, vận hành phòng Lab và bảo vệ đồ án tốt nghiệp tại Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU).*

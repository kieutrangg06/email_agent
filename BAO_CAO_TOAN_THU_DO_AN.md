# BÁO CÁO TOÀN THƯ KIẾN TRÚC, KỊCH BẢN VẬN HÀNH & CẨM NANG BẢO VỆ ĐỒ ÁN
## INTELLIGENT ENTERPRISE EMAIL AUTOMATION & HELPDESK CRM
**Mô hình Phân công:** 3 Thành Viên × 3 Luồng Xử Lý × Đúng 12 Bước Xử Lý = 9 Micro-Workflows / 108 Nodes DAG  
**Môi trường Thực thi:** Cục bộ trên máy trạm (Localhost: PostgreSQL 16 5432, n8n 5678, NestJS 4000, Next.js 3000) & Hỗ trợ Public Host qua Cloudflare Tunnel (`start_tunnel.sh`)  
**Đơn vị đào tạo:** Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)  

---

## MỤC LỤC TỔNG QUAN
1. [Bản Chất Dự Án: Làm Gì, Mục Đích Gì, Công Cụ Gì?](#1-bản-chất-dự-án-làm-gì-mục-đích-gì-công-cụ-gì)
   - 1.1. Dự án là gì?
   - 1.2. Mục đích giải quyết bài toán nghiệp vụ gì?
   - 1.3. Công cụ & Ngăn xếp Công nghệ (Tech Stack)
2. [Kiến Trúc Tổng Thể & Mô Hình Vận Hành Localhost](#2-kiến-trúc-tổng-thể--mô-hình-vận-hành-localhost)
   - 2.1. Sơ đồ Kiến trúc Vận hành Cục bộ (Localhost) & Host Tunnel
   - 2.2. Quy tắc chuẩn hóa "12 Nodes DAG" trong n8n
3. [Email Automation Nằm Ở Đâu? Cấu Trúc Gửi Nhận & 3 Hòm Thư Chuẩn](#3-email-automation-nằm-ở-đâu-cấu-trúc-gửi-nhận--3-hòm-thư-chuẩn)
   - 3.1. Email Automation xuất hiện tại các điểm chạm nào?
   - 3.2. Cấu trúc 3 Hòm Thư Chuẩn Hóa Toàn Hệ Thống
4. [Hệ Sinh Thái 10 AI Agents Chuyên Biệt](#4-hệ-sinh-thái-10-ai-agents-chuyên-biệt)
5. [Cấu Trúc Mã Nguồn Dự Án & Hệ Cơ Sở Dữ Liệu 14 Bảng (pgvector)](#5-cấu-trúc-mã-nguồn-dự-án--hệ-cơ-sở-dữ-liệu-14-bảng-pgvector)
   - 5.1. Cấu trúc Thư mục Monorepo Tinh Gọn
   - 5.2. Danh mục 14 Bảng CSDL PostgreSQL 16 & pgvector
6. [Giải Mã Chi Tiết 9 Micro-Workflows (Chuẩn Đúng 12 Nodes DAG)](#6-giải-mã-chi-tiết-9-micro-workflows-chuẩn-đúng-12-nodes-dag)
7. [Kịch Bản Kiểm Thử Giao Diện Web: Điều Gì Xảy Ra, Luân Chuyển Hòm Thư & 7 Tình Huống Thực Tế](#7-kịch-bản-kiểm-thử-giao-diện-web-điều-gì-xảy-ra-luân-chuyển-hòm-thư--7-tình-huống-thực-tế)
8. [Cẩm Nang Thao Tác Trên Giao Diện Web Next.js (Port 3000)](#8-cẩm-nang-thao-tác-trên-giao-diện-web-nextjs-port-3000)
9. [Toàn Bộ Câu Lệnh Khởi Chạy, Tắt, Reset Data Và Giám Sát CSDL](#9-toàn-bộ-câu-lệnh-khởi-chạy-tắt-reset-data-và-giám-sát-csdl)
10. [Bộ Câu Hỏi Vấn Đáp Hội Đồng Thường Gặp & Cách Trả Lời "Ăn Điểm Tối Đa"](#10-bộ-câu-hỏi-vấn-đáp-hội-đồng-thường-gặp--cách-trả-lời-ăn-điểm-tối-đa)

---

## 1. BẢN CHẤT DỰ ÁN: LÀM GÌ, MỤC ĐÍCH GÌ, CÔNG CỤ GÌ?

### 1.1. Dự án là gì?
Dự án là **Hệ thống Tự động hóa Xử lý Email Doanh nghiệp Thông minh (Intelligent Enterprise Email Automation & Helpdesk CRM)**, tích hợp **Trí tuệ Nhân tạo Đa tác tử (Multi-Agent System)**, **Cơ sở tri thức RAG trên pgvector**, và **Nền tảng Quản trị Vận hành / Helpdesk CRM tập trung**.  
Hệ thống biến hòm thư doanh nghiệp từ trạng thái *"thụ động, rời rạc, quá tải"* thành một trung tâm điều hành luân chuyển dữ liệu tự động, khép kín và có sự giám sát của con người (**Human-in-the-Loop - HITL**).

### 1.2. Mục đích giải quyết bài toán nghiệp vụ gì?
Trong các doanh nghiệp vừa và lớn, hòm thư tiếp nhận chung (`support@`, `sales@`, `billing@`, `contact@`) đối mặt với 5 điểm nghẽn nghiêm trọng:
1. **Quá tải & Chậm trễ:** Hàng trăm email rác, thư quảng cáo lẫn lộn với thư khách hàng, khiến nhân viên mất trung bình 4–8 giờ chỉ để lọc và chuyển tiếp thủ công.
2. **Vi phạm cam kết chất lượng dịch vụ (SLA Breach):** Các sự cố tê liệt hệ thống cấp bách (P1 – sập database, cổng thanh toán báo lỗi 504) bị lẫn vào thư rác, phản hồi muộn gây thiệt hại tài chính và uy tín thương hiệu.
3. **Phản hồi sai lệch, thiếu nhất quán:** Nhân viên tự tìm kiếm tài liệu rời rạc, dễ cung cấp sai thông tin kỹ thuật hoặc cam kết sai chính sách bảo hành.
4. **Bỏ sót cơ hội kinh doanh (Lead Leakage):** Email hỏi mua hàng giá trị cao không được bóc tách số điện thoại, ngân sách kịp thời; thiếu cơ chế tự động nuôi dưỡng (Cadence Follow-up) sau 48 giờ.
5. **Rủi ro gian lận chứng từ kế toán:** Kế toán phải rà soát số học thủ công hàng trăm hóa đơn VAT gửi qua file ảnh/PDF xem: $\text{Tiền hàng} + \text{Thuế VAT} = \text{Tổng thanh toán}$ có khớp hay không.

👉 **Lời giải của hệ thống:** Tự động hóa 100% quy trình tiếp nhận qua Webhook/SMTP $\rightarrow$ AI cách ly thư rác & phishing $\rightarrow$ phân tích ngữ nghĩa về đúng 4 phòng ban $\rightarrow$ cấp mã vé theo thuật toán cân bằng tải Least-Busy $\rightarrow$ dùng RAG pgvector tra cứu tri thức nội bộ soạn thư nháp $\rightarrow$ phê duyệt Human-in-the-Loop trên Web $\rightarrow$ đối soát hóa đơn VAT bằng thị giác máy tính $\rightarrow$ tổng hợp báo cáo điều hành Executive Digest cho Ban Giám Đốc.

### 1.3. Công cụ & Ngăn xếp Công nghệ (Tech Stack)
- **Workflow Automation Engine:** **n8n Community (Containerized Docker, Port 5678)** đóng vai trò bộ não điều phối dữ liệu (Orchestration) và **là đơn vị DUY NHẤT kích hoạt gửi email SMTP ra bên ngoài** (loại bỏ hoàn toàn lỗi gửi trùng lặp thư). Toàn bộ 9 luồng được chuẩn hóa theo quy tắc khắt khe: **Đúng 12 bước xử lý DAG / Workflow (Tổng 108 nodes)**.
- **Trí tuệ nhân tạo (AI & LLM Gateway):**
  - **Google Gemini (Flash 1.5 / 2.0 / 3.1):** Phân tích ngữ cảnh tiếng Việt, phân loại phòng ban, trích xuất thực thể B2B, tóm tắt điều hành và bóc tách cấu trúc vé.
  - **Text-Embedding-004 / Gemini Embeddings:** Mã hóa câu hỏi kỹ thuật thành vector nhúng phục vụ RAG.
  - **Gemini Multimodal Vision AI:** Đọc và bóc tách dữ liệu tài chính từ ảnh/PDF hóa đơn VAT điện tử.
- **Cơ sở dữ liệu (Database):** **PostgreSQL 16 tích hợp extension `pgvector` (Port 5432)**, vừa quản lý dữ liệu quan hệ ACID 14 bảng, vừa lưu trữ và tìm kiếm vector tương đồng cosine similarity cho cẩm nang tri thức RAG.
- **Backend API Core:** **NestJS 10 (Node.js 20 / TypeScript, Port 4000):** Kiến trúc Clean Architecture / DDD, đảm nhiệm Business Logic, Authentication JWT, Validation DTO, cân bằng tải Least-Busy KTV, RESTful API và Audit Logging.
- **Frontend Web Application:** **Next.js 14 App Router (Tailwind CSS, Lucide Icons, Port 3000):** Thiết kế chuẩn SaaS thương mại với Helpdesk Ticket Board, Inbound Quick Test Modal, HITL Draft Approvals, CRM Kanban Pipeline, Invoices Audit và Executive Analytics SVG.
- **Cơ chế Reverse Proxy Chống Lỗi Mobile:** Tích hợp cấu hình Rewrites trong `next.config.js` chuyển tiếp `/api/v1` về NestJS (4000) và `/webhook` về n8n (5678), đảm bảo thiết bị di động truy cập qua Cloudflare Tunnel (`start_tunnel.sh`) tải 100% dữ liệu không bị lỗi loopback localhost hay CORS.
- **Giao thức Email & Thông báo:** Gửi nhận trực tiếp qua **Gmail SMTP (Port 465/587)** cấu hình tập trung trong n8n và In-App Notification.

---

## 2. KIẾN TRÚC TỔNG THỂ & MÔ HÌNH VẬN HÀNH LOCALHOST

### 2.1. Sơ đồ Kiến trúc Vận hành Cục bộ (Localhost) & Host Tunnel
```
     [ Khách Hàng Gửi Thư / Form Inbound Webhook / Mobile Device ]
                                   │
                                   ▼
        ┌────────────────────────────────────────────────────────┐
        │        CLOUDFLARE TUNNEL (start_tunnel.sh 3000)        │
        │        (Cầu nối HTTPS Public an toàn cho Hội Đồng)     │
        └──────────────────────────┬─────────────────────────────┘
                                   │
                                   ▼ (Port 3000)
        ┌────────────────────────────────────────────────────────┐
        │           NEXT.JS 14 APP ROUTER FRONTEND               │
        │  Reverse Proxy Rewrites (Khắc phục lỗi Mobile 0 data): │
        │  • /api/v1/:path*  ──► http://127.0.0.1:4000           │
        │  • /webhook/:path* ──► http://127.0.0.1:5678           │
        └──────────────┬──────────────────────────┬──────────────┘
                       │                          │
        (Gọi API CRUD) │                          │ (Bắn Webhook Luồng n8n)
                       ▼                          ▼
        ┌──────────────────────────┐    ┌─────────────────────────┐
        │   NESTJS CORE API        │    │       n8n ENGINE        │
        │     (Port 4000)          │◄───┤  (Port 5678 - 9 Flows)  │
        │ • Business Domain Logic  │    │ • 10 AI Agents          │
        │ • Validation DTO         │    │ • Đúng 12 Nodes DAG     │
        │ • Cân bằng tải KTV       │    │ • ĐƠN VỊ DUY NHẤT GỬI   │
        └──────────────┬───────────┘    │   EMAIL SMTP RA NGOÀI   │
                       │                └────────────┬────────────┘
                       │ SQL / pgvector              │ SQL Query
                       ▼ (Port 5432)                 ▼ (Port 5432)
        ┌─────────────────────────────────────────────────────────┐
        │            HẠ TẦNG DOCKER COMPOSE                       │
        │       PostgreSQL 16 Database + pgvector                 │
        │   (14 Bảng dữ liệu quan hệ & Kho tri thức RAG)          │
        └─────────────────────────────────────────────────────────┘
```

- **Container `enterprise_db` (PostgreSQL 16 + pgvector, Port 5432):** Lưu trữ tập trung 14 bảng dữ liệu, chạy extension vector cho tìm kiếm tri thức RAG.
- **Container `enterprise_n8n` (n8n Engine, Port 5678):** Quản lý và điều phối 9 micro-workflows kết nối qua Webhook nội bộ.
- **Backend NestJS (Node.js 20, Port 4000):** Cung cấp các endpoint REST API xử lý nghiệp vụ, kiểm tra quyền hạn, cân bằng tải và ghi nhận nhật ký kiểm toán.
- **Frontend Next.js 14 (App Router, Port 3000):** Giao diện quản trị toàn diện: Dashboard, Quản trị vé `/tickets`, Phê duyệt nháp `/approval`, Phễu bán hàng `/crm` (hoặc `/leads`), Đối soát hóa đơn `/invoices`, Báo cáo điều hành `/analytics`.

### 2.2. Quy tắc chuẩn hóa "12 Nodes DAG" trong n8n
- **Tối ưu tài nguyên:** Giới hạn mỗi luồng đúng 12 bước xử lý giúp n8n chạy theo đồ thị trực tiếp không chu trình (DAG) gọn gàng, RAM tiêu thụ dưới 150MB, triệt tiêu hoàn toàn nguy cơ Out-of-Memory (OOM).
- **Triệt tiêu Webhook Timeout:** Phản hồi webhook ngay lập tức theo cơ chế Async Event-Driven, không để client phải chờ quá 30 giây.
- **Module hóa vi dịch vụ (Micro-Workflows):** Chia bài toán thành 9 micro-workflows liên hoàn. Mỗi thành viên phụ trách đúng 3 luồng, kết nối thông suốt qua webhook nội bộ.

---

## 3. EMAIL AUTOMATION NẰM Ở ĐÂU? CẤU TRÚC GỬI NHẬN & 3 HÒM THƯ CHUẨN

### 3.1. Email Automation xuất hiện tại các điểm chạm nào?
> [!IMPORTANT]
> **Quy tắc Single Source of Truth chống trùng lặp email:**  
> Toàn bộ thao tác gửi email ra bên ngoài được **tập trung duy nhất tại các Node SMTP của n8n**. Backend NestJS và Frontend Next.js **KHÔNG** gửi email trực tiếp, triệt tiêu 100% tình trạng khách hàng nhận 2 email giống nhau.

- **Tiếp nhận tự động (Inbound Trigger):** Lắng nghe email gửi đến qua Webhook (Luồng 1).
- **Gửi thư tự động xác nhận cam kết SLA (Luồng 2 - Node 9):** Khách gửi thư là nhận ngay email biên nhận kèm mã tra cứu và hạn xử lý (1h, 4h, 24h, 48h).
- **Gửi cảnh báo đỏ khẩn cấp P1 (Luồng 2 - Node 8):** Bắn email khẩn cấp cho Kỹ thuật viên trực ban khi xảy ra sự cố nghiêm trọng.
- **Gửi thông báo phân công vé cho KTV (Luồng 3 - Node 9):** KTV nhận email chi tiết sự cố kèm các bước tái hiện lỗi do AI bóc tách.
- **Gửi thư trả lời khách hàng sau khi duyệt HITL (Luồng 5 - Node 5):** Thư trả lời kỹ thuật chính thức do AI soạn từ pgvector, chuyên viên kiểm duyệt bấm nút "Duyệt & Gửi" trên Web.
- **Gửi báo cáo điều hành 24h cho Ban Giám Đốc (Luồng 6 - Node 9 & 11):** Tóm tắt hiệu suất vận hành, tỷ lệ SLA và cảnh báo đột biến sự cố (> 20%).
- **Gửi thông báo có Lead Bán hàng mới cho Sales (Luồng 7 - Node 10):** Thông báo cơ hội kinh doanh kèm điểm tiềm năng Lead Score (0–100).
- **Gửi chuỗi email nuôi dưỡng khách hàng định kỳ 48h (Luồng 8 - Node 7):** Tự động gửi thư chăm sóc khách hàng sau khi gửi báo giá.
- **Gửi thông báo đối soát hóa đơn cho Kế toán trưởng (Luồng 9 - Node 9):** Báo cáo kết quả kiểm toán số học hóa đơn VAT (Khớp 100% hay Sai lệch).

### 3.2. Cấu trúc 3 Hòm Thư Chuẩn Hóa Toàn Hệ Thống

| Vai trò | Địa chỉ Email Chuẩn | Nhiệm vụ cụ thể trong kịch bản vận hành |
| :--- | :--- | :--- |
| **1. SMTP System Sender** | `kieutrangg06123@gmail.com` | Hòm thư hệ thống công ty đóng vai trò máy chủ SMTP gửi toàn bộ email tự động ra bên ngoài (Gửi xác nhận SLA, gửi thư hỗ trợ đã duyệt, gửi thư nuôi dưỡng báo giá). |
| **2. Internal Staff / Management** | `tranngo170770@gmail.com` | Đại diện cho toàn thể nhân sự nội bộ (Quản trị viên, KTV trực ban, Nhân viên Sales, Kế toán trưởng, Ban Giám Đốc nhận báo cáo). |
| **3. Client / External Sender** | `trangltk.24it@vku.udn.vn` | Hòm thư khách hàng / đối tác bên ngoài gửi yêu cầu, phản ánh sự cố hoặc gửi hóa đơn thanh toán tới hệ thống. |

---

## 4. HỆ SINH THÁI 10 AI AGENTS CHUYÊN BIỆT

| STT | Tên AI Agent | Mô hình & Công nghệ | Nằm trong Luồng n8n | Chức năng chi tiết & Cơ chế hoạt động |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **AI Email Triage Agent** | Gemini 3.1 Flash | Luồng 2 (Node 3) | Đọc ngữ cảnh tiếng Việt, phân loại chính xác 4 phòng ban (TECH, SALES, FINANCE, GENERAL), gán nhãn ưu tiên P1–P4, sắc thái cảm xúc. |
| **2** | **AI Email Reply Agent** | Gemini + pgvector RAG | Luồng 4 (Node 6) | Kết hợp ngữ cảnh từ tài liệu liên quan nhất tra cứu từ `knowledge_base` (cosine similarity > 0.75) để soạn dự thảo trả lời kỹ thuật chuẩn mực. |
| **3** | **AI Email-to-Ticket Agent** | Gemini 3.1 Flash | Luồng 3 (Node 2) | Bóc tách tiêu đề sự cố ngắn gọn, phân hệ lỗi (`affected_module`), và các bước tái hiện sự cố (`reproduce_steps`). |
| **4** | **AI Email-to-CRM Lead Agent** | Gemini 3.1 Flash | Luồng 7 (Node 2) | Bóc tách thực thể kinh doanh B2B: Họ tên, Số điện thoại (+84), Doanh nghiệp, Nhu cầu giải pháp và Ngân sách dự kiến. |
| **5** | **AI Executive Summarizer Agent** | Gemini 3.1 Flash | Luồng 6 (Node 5) | Tổng hợp số liệu vận hành 24h, phát hiện 3 điểm nghẽn nghiêm trọng nhất và đề xuất hành động chiến lược cho Ban Giám Đốc. |
| **6** | **AI Follow-up Nurturing Agent** | Gemini 3.1 Flash | Luồng 8 (Node 6) | Đọc lịch sử deal báo giá > 48h, tạo email chăm sóc cá nhân hóa theo 3 chặng (Thân mật $\rightarrow$ Mời dùng thử $\rightarrow$ Ưu đãi có hạn). |
| **7** | **AI Campaign & Lead Scoring Agent** | Gemini 3.1 Flash | Luồng 7 (Node 3 & 6) | Định vị phân khúc khách hàng (ENTERPRISE_HIGH_VALUE vs SME_RETAIL) và tính toán điểm số Lead Score (0–100). |
| **8** | **AI Deliverability & Anomaly Monitor** | Rule Engine + Gemini | Luồng 1 (Node 4) & Luồng 6 (Node 4) | Theo dõi điểm uy tín người gửi (`reputation_score`), phát hiện tỷ lệ bounce/spam và phát hiện đột biến sự cố P1 (> 20% so với baseline 7 ngày). |
| **9** | **AI Spam & Phishing Classifier Agent** | Gemini 3.1 Flash | Luồng 1 (Node 5) | Cửa ngõ phòng vệ đầu tiên: Phân tích phát hiện thư rác (Spam), lừa đảo tài chính (Phishing), mã độc và thư hệ thống bị dội ngược (Bounce). |
| **10**| **Multimodal Invoice Vision OCR Agent** | Gemini Multimodal Vision | Luồng 9 (Node 4) | Nhận diện thị giác file PDF/ảnh hóa đơn: Bóc tách Số HĐ, Mã số thuế, Ngày lập, Tiền hàng, Thuế VAT và Tổng thanh toán. |

---

## 5. CẤU TRÚC MÃ NGUỒN DỰ ÁN & HỆ CƠ SỞ DỮ LIỆU 14 BẢNG (PGVECTOR)

### 5.1. Cấu trúc Thư mục Monorepo Tinh Gọn
```
email-automation-plan/
├── docker-compose.yml              # Quản lý 2 container: PostgreSQL 16 (pgvector) & n8n
├── .env / .env.example             # Biến môi trường (DB config, Port, Gemini API Key, SMTP)
├── run_all.sh                      # Script 1 chạm khởi động: DB + n8n + NestJS + Next.js
├── stop_all.sh                     # Script 1 chạm tắt an toàn toàn bộ hệ thống
├── start_tunnel.sh                 # Mở Cloudflare Tunnel bảo mật cho điện thoại & bên ngoài
├── import_workflows_to_n8n.sh      # Tự động nạp & kích hoạt 9 workflows vào container n8n
├── seed_multi_day_demo_data.js     # Khởi tạo bộ dữ liệu 7 ngày phục vụ demo & hội đồng
├── test_all_9_flows_e2e.js         # Bộ 20 test suite kiểm thử tích hợp E2E
├── run_all_flows_test_scenarios.js # Bộ kịch bản kiểm thử toàn diện mọi nhánh luồng
├── view_db_stats.sh                # Script xem nhanh số lượng bản ghi 14 bảng CSDL
├── reset_test_data.sh              # Script làm sạch dữ liệu giao dịch về 0, giữ Seed Data
│
├── database/                       # Các file SQL Schema & Reset DDL
│   ├── 00_core_schema.sql          # Extension vector, departments, reputation, audit logs
│   ├── 01_member1_tickets.sql      # Triage logs, support agents, tickets, ticket comments
│   ├── 02_member2_knowledge_drafts.sql # Knowledge base (vector pgvector), email drafts, daily digest
│   ├── 03_member3_crm_invoices.sql # CRM customers, deals, finance invoices
│   └── reset_test_data.sql         # Script SQL truncate data giao dịch và reset active tickets
│
├── workflows/                      # 9 Workflows JSON chuẩn hóa theo 3 thành viên
│   ├── member1_triage_tickets/     # Phân hệ Thành viên 1: Tiếp nhận & Vé kỹ thuật
│   │   ├── flow01_email_ingest_triage_quarantine.json (12 nodes)
│   │   ├── flow02_ticket_generation_sla_dispatch.json (12 nodes)
│   │   └── flow03_sla_monitoring_escalation.json (12 nodes)
│   ├── member2_rag_intelligence/   # Phân hệ Thành viên 2: RAG, Duyệt HITL & Báo cáo
│   │   ├── flow04_rag_knowledge_draft_generation.json (12 nodes)
│   │   ├── flow05_human_in_the_loop_approval.json (12 nodes)
│   │   └── flow06_customer_csat_survey.json (12 nodes)
│   └── member3_crm_invoices/       # Phân hệ Thành viên 3: CRM Bán hàng & OCR Kế toán
│       ├── flow07_crm_lead_extraction_enrichment.json (12 nodes)
│       ├── flow08_invoice_ocr_reconciliation.json (12 nodes)
│       └── flow09_executive_kpi_reporting.json (12 nodes)
│
├── credentials/                    # Quản lý chứng thực n8n (Postgres + SMTP Gmail)
├── backend/                        # NestJS Backend API Core (Port 4000)
└── frontend/                       # Next.js 14 App Router Frontend (Port 3000)
```

### 5.2. Danh mục 14 Bảng CSDL PostgreSQL 16 & pgvector

| STT | Tên Bảng CSDL | Thuộc Phân Hệ | Mục đích & Ý nghĩa nghiệp vụ |
| :---: | :--- | :---: | :--- |
| **1** | `departments` | Core | Danh mục 4 phòng ban chính: TECH, SALES, FINANCE, GENERAL. |
| **2** | `email_senders_reputation` | TV1 | Theo dõi điểm uy tín người gửi (`reputation_score`), số lần vi phạm (`failed_attempts`). |
| **3** | `email_quarantine_vault` | TV1 | Kho cách ly an ninh lưu trữ các email Spam, Phishing hoặc đính kèm mã độc. |
| **4** | `email_triage_logs` | TV1 | Lưu nhật ký phân loại email đầu vào (Phòng ban, Mức ưu tiên P1–P4, Sắc thái, Hạn SLA). |
| **5** | `support_agents` | TV1 | Danh sách 5 KTV kỹ thuật kèm bộ đếm số vé đang phụ trách (`active_tickets_count`). |
| **6** | `tickets` | TV1 | Bảng vé sự cố trung tâm (Mã vé TK-YYYYMMDD-XXXX, Mức ưu tiên, Trạng thái, KTV phụ trách). |
| **7** | `ticket_comments` | TV1 | Lịch sử trao đổi, ghi chú chẩn đoán ban đầu của AI và phản hồi của kỹ thuật viên trên vé. |
| **8** | `knowledge_base` | TV2 | Kho 16 cẩm nang tri thức kỹ thuật lưu vector nhúng (`embedding vector(768)`). |
| **9** | `email_drafts` | TV2 | Lưu các thư nháp do AI RAG tạo ra ở trạng thái `PENDING_APPROVAL` chờ duyệt HITL. |
| **10**| `daily_summaries` | TV2 | Lưu các bản báo cáo tóm tắt vận hành ngày gửi cho Ban Giám Đốc. |
| **11**| `daily_digest_recipients` | TV2 | Danh sách email Ban Lãnh Đạo nhận báo cáo định kỳ (`tranngo170770@gmail.com`). |
| **12**| `crm_customers` | TV3 | Danh bạ khách hàng tiềm năng, lưu số điện thoại, công ty và điểm tiềm năng (`lead_score`). |
| **13**| `crm_deals` | TV3 | Các cơ hội kinh doanh trên phễu bán hàng (`NEW_INQUIRY`, `QUOTED`, `COLD_LEAD`, `WON`, `LOST`). |
| **14**| `finance_invoices` | TV3 | Lưu trữ chứng từ hóa đơn, kết quả đối soát số học (`VALIDATED` vs `DISCREPANCY_FLAGGED`). |
| **Phụ**| `system_audit_logs` | Global | Bảng nhật ký kiểm toán toàn hệ thống ghi lại mọi sự kiện trọng yếu từ Luồng 1 đến 9. |

---

## 6. GIẢI MÃ CHI TIẾT 9 MICRO-WORKFLOWS (CHUẨN ĐÚNG 12 NODES DAG)

### [Luồng 1] Email Ingest, Anti-Spam & Blacklist Quarantine (12 Nodes)
- **Node 1 (Webhook Ingest Trigger):** Tiếp nhận POST request tại `/webhook/m1-flow1-ingest`.
- **Node 2 (Payload Normalization):** Regex bóc tách email, làm sạch mã HTML, chuẩn hóa nội dung thư.
- **Node 3 (System/No-Reply Filter):** Kiểm tra địa chỉ hệ thống tự động dội ngược (no-reply, mailer-daemon, bounce).
- **Node 4 (Check Sender Reputation):** Gọi Backend API kiểm tra điểm uy tín trong `email_senders_reputation`.
- **Node 5 (AI Spam & Phishing Classifier Agent):** AI Agent 9 phân tích dấu hiệu lừa đảo, phát tán mã độc.
- **Node 6 (IF Clean & High Reputation):**
  - *Điều kiện:* `is_spam === false` VÀ `reputation_score >= 20`.
  - *Nhánh True (Sạch):* Đi sang Node 10.
  - *Nhánh False (Độc hại):* Đi sang Node 7, 8, 9.
- **Node 7 (Quarantine Vault - Nhánh False):** Lưu email độc hại vào kho cách ly `email_quarantine_vault`.
- **Node 8 (Security Alert Mailer - Nhánh False):** Gửi email cảnh báo SOC tới `tranngo170770@gmail.com`.
- **Node 9 (Update Sender Strike Score - Nhánh False):** Tăng `failed_attempts + 1`, trừ 50 điểm uy tín.
- **Node 10 (Format Clean Payload - Nhánh True):** Đóng gói payload sạch, gắn cờ `IS_CLEAN_VERIFIED = true`.
- **Node 11 (Audit Ingest Pass - Nhánh True):** Ghi log `INBOUND_CLEAN_EMAIL_ACCEPTED` vào `system_audit_logs`.
- **Node 12 (Trigger Workflow 2 - Nhánh True):** Bắn HTTP POST chuyển tiếp sang Luồng 2 (`/webhook/m1-flow2-triage`).

### [Luồng 2] AI Multi-Department Triage & Acknowledgment (12 Nodes)
- **Node 1 (Sub-Workflow Trigger):** Đón nhận payload sạch từ Luồng 1 tại `/webhook/m1-flow2-triage`.
- **Node 2 (Fetch Departments):** Gọi NestJS API lấy danh sách 4 phòng ban.
- **Node 3 (AI Semantic Triage Agent):** AI Agent 1 phân tích ngữ nghĩa: phân loại phòng ban (TECH/SALES/FINANCE/GENERAL), mức ưu tiên (P1–P4), sắc thái.
- **Node 4 (Output Schema Guard):** Ép kiểu JSON nghiêm ngặt, tự động gán giá trị dự phòng nếu AI thiếu trường.
- **Node 5 (Save Triage Log):** Lưu bản ghi phân loại vào `email_triage_logs`.
- **Node 6 (Compute SLA Window):** Tính hạn cam kết SLA (P1: 1h, P2: 4h, P3: 24h, P4: 48h).
- **Node 7 (IF Critical P1):**
  - *Điều kiện:* `priority === 'P1'`.
  - *Nhánh True (Khẩn cấp P1):* Đi lên Node 8 (Escalate), sau đó sang Node 9.
  - *Nhánh False (P2-P4 Bình thường):* Bỏ qua Node 8, đi thẳng sang Node 9.
- **Node 8 (Escalate P1 Alert - Nhánh True):** Gửi email cảnh báo khẩn cấp P1 tới `tranngo170770@gmail.com`.
- **Node 9 (Send Customer ACK):** Gửi email tự động xác nhận cam kết SLA cho khách hàng (`trangltk.24it@vku.udn.vn`).
- **Node 10 (Audit Triage Success):** Ghi log `EMAIL_TRIAGED_SUCCESSFULLY` vào `system_audit_logs`.
- **Node 11 (Format Routing Packet):** Đóng gói dữ liệu theo mã `department_code`.
- **Node 12 (Route to Downstream):** Định tuyến tự động:
  - TECH $\rightarrow$ Gọi Webhook Luồng 3 (`/webhook/m1-flow3-ticket`).
  - SALES $\rightarrow$ Gọi Webhook Luồng 7 (`/webhook/m3-flow7-crm-lead`).
  - FINANCE $\rightarrow$ Gọi Webhook Luồng 9 (`/webhook/m3-flow9-invoice-ocr`).

### [Luồng 3] AI-Driven Ticket Generation & SLA Dispatcher (12 Nodes)
- **Node 1 (Receive Tech Intent Trigger):** Tiếp nhận sự cố kỹ thuật tại `/webhook/m1-flow3-ticket`.
- **Node 2 (AI Email-to-Ticket Agent):** AI Agent 3 bóc tách tiêu đề sự cố, phân hệ lỗi (`affected_module`), các bước tái hiện (`reproduce_steps`).
- **Node 3 (Generate Ticket Code ID Code):** Sinh mã vé chuẩn doanh nghiệp `TK-YYYYMMDD-XXXX`.
- **Node 4 (Query Available Agents Postgres):** Truy vấn danh sách KTV khả dụng (`status = 'AVAILABLE'`).
- **Node 5 (Least-Busy Load Balancer Code):** Thuật toán chọn KTV có `active_tickets_count` thấp nhất.
- **Node 6 (Create Ticket Master HTTP):** Gọi NestJS tạo vé trạng thái PENDING.
- **Node 7 (Update Agent Workload Postgres):** Tăng `active_tickets_count + 1` của KTV được giao việc.
- **Node 8 (Initial System Comment HTTP):** Lưu phân tích chẩn đoán ban đầu của AI vào `ticket_comments`.
- **Node 9 (Notify Support Agent Email):** Gửi email phân công vé cho KTV (`tranngo170770@gmail.com`).
- **Node 10 (Audit SLA Dispatch Postgres):** Ghi log `TICKET_DISPATCHED_TO_AGENT` vào `system_audit_logs`.
- **Node 11 (Format Ticket Packet Code):** Đóng gói payload thông tin vé kỹ thuật.
- **Node 12 (Trigger Luong 4 Sub-Workflow Code):** Bắn HTTP POST kích hoạt ngay Luồng 4 (`/webhook/m2-flow4-rag-draft`).

### [Luồng 4] Vector Search RAG & Draft Reply Generator (12 Nodes)
- **Node 1 (Ticket Created Trigger):** Tiếp nhận thông tin vé từ Luồng 3 tại `/webhook/m2-flow4-rag-draft`.
- **Node 2 (Extract Search Query Keywords Code):** Trích xuất từ khóa cốt lõi từ tiêu đề và nội dung lỗi.
- **Node 3 (AI Knowledge Query Optimizer Agent):** AI tối ưu hóa câu hỏi tìm kiếm tri thức.
- **Node 4 (Query Knowledge Base pgvector Postgres):** Cosine similarity search trên bảng `knowledge_base` (`ORDER BY embedding <=> $1 LIMIT 3`).
- **Node 5 (Check Knowledge Relevance Code):** Lọc bài viết có độ tương đồng cosine đạt chuẩn (> 0.75).
- **Node 6 (AI RAG Response Drafter Agent):** AI Agent 2 kết hợp ngữ cảnh tài liệu nội bộ soạn thư nháp kỹ thuật chuẩn xác.
- **Node 7 (Draft Quality & HTML Polish Code):** Định dạng HTML chuyên nghiệp kèm header và chữ ký hỗ trợ.
- **Node 8 (Insert Draft to Database HTTP):** Gọi NestJS lưu bản nháp trạng thái `PENDING_APPROVAL` vào `email_drafts`.
- **Node 9 (Link Draft to Ticket Postgres):** Cập nhật liên kết `draft_id` vào vé trong bảng `tickets`.
- **Node 10 (Push Real-time Notification HTTP):** Bắn tín hiệu WebSocket/SSE lên giao diện Next.js (`/approval`).
- **Node 11 (Audit Draft Creation Postgres):** Ghi log `AI_REPLY_DRAFT_GENERATED` vào `system_audit_logs`.
- **Node 12 (Dispatch to Luong 5 Bridge Code):** Đóng gói dữ liệu sẵn sàng cho con người phê duyệt trên Web.

### [Luồng 5] Human-in-the-Loop Web Approval & Outbound Dispatch (12 Nodes)
- **Node 1 (Human Action Webhook Trigger):** Lắng nghe khi chuyên viên bấm "Duyệt & Gửi" trên Web (`/webhook/m2-flow5-approval`).
- **Node 2 (Validate Reviewer Permission HTTP):** Gọi NestJS xác thực quyền hạn của `reviewer_email`.
- **Node 3 (Fetch Final Draft Content Postgres):** Lấy nội dung thư nháp đã được chỉnh sửa từ `email_drafts`.
- **Node 4 (Email Address Validation Code):** Kiểm tra tính hợp lệ cú pháp địa chỉ người nhận.
- **Node 5 (Send Outbound Email SMTP):** Gửi email chính thức từ `kieutrangg06123@gmail.com` tới `trangltk.24it@vku.udn.vn`.
- **Node 6 (IF Send Success):**
  - *Điều kiện:* Gửi SMTP thành công (có `messageId`).
  - *Nhánh True (Thành công):* Đi vào Node 7 $\rightarrow$ 8 $\rightarrow$ 9 $\rightarrow$ 10 $\rightarrow$ 11 $\rightarrow$ 12.
  - *Nhánh False (Thất bại / Timeout):* Đi thẳng sang Node 12 ghi log thất bại, KHÔNG đóng vé.
- **Node 7 (Update Draft Sent Status HTTP - Nhánh True):** Cập nhật bản nháp thành `SENT` và ghi nhận `sent_at = NOW()`.
- **Node 8 (Update Ticket Status HTTP - Nhánh True):** Chuyển trạng thái vé sang `RESOLVED`.
- **Node 9 (Append Resolution Comment Postgres - Nhánh True):** Ghi nội dung thư đã gửi vào lịch sử trao đổi của vé (`ticket_comments`).
- **Node 10 (Calculate Resolution Time Code - Nhánh True):** Tính thời gian xử lý thực tế so với hạn mức SLA ban đầu.
- **Node 11 (Log SLA Compliance Metric Postgres - Nhánh True):** Ghi nhận chỉ số tuân thủ SLA (`MET_SLA` / `BREACHED_SLA`).
- **Node 12 (Audit Log Email Dispatched Postgres):** Ghi log `OUTBOUND_EMAIL_SUCCESSFULLY_SENT` vào `system_audit_logs`.

### [Luồng 6] Daily Executive Intelligence & Incident Spike Alert (12 Nodes)
- **Node 1 (Daily Executive Digest Trigger):** Kích hoạt qua Cron định kỳ lúc 18h00 hoặc gọi Webhook test (`m2-flow6-digest-trigger`).
- **Node 2 (Fetch Daily Inbound Volume Postgres):** Thống kê tổng số email đến, tỷ lệ spam bị chặn trong 24h.
- **Node 3 (Fetch Ticket & SLA Stats Postgres):** Tổng hợp số vé đã mở, tỷ lệ tuân thủ SLA, số vé P1.
- **Node 4 (Detect Incident Spike Code):** Thuật toán phát hiện dị thường: kiểm tra số vé P1 tăng > 20% so với trung bình 7 ngày.
- **Node 5 (AI Executive Summarizer Agent):** AI Agent 5 tổng hợp báo cáo điều hành, chỉ ra 3 điểm nghẽn nghiêm trọng nhất.
- **Node 6 (Format Executive HTML Report Code):** Biên tập báo cáo trực quan kèm 4 thẻ KPI động và cơ chế guard chống rò rỉ mã template.
- **Node 7 (Query Recipient Directors Postgres):** Lấy danh sách email Ban Lãnh Đạo (`tranngo170770@gmail.com`).
- **Node 8 (Save Daily Summary Record HTTP):** Gọi NestJS lưu bản ghi báo cáo vào bảng `daily_summaries`.
- **Node 9 (Send Executive Digest Email):** Gửi email báo cáo điều hành tổng thể tới Ban Giám Đốc.
- **Node 10 (IF Critical Spike Detected):**
  - *Điều kiện:* `is_spike_detected === true`.
  - *Nhánh True (Có đột biến lỗi P1):* Kích hoạt Node 11 gửi thêm email báo động đỏ cho Tổng giám đốc $\rightarrow$ Node 12.
  - *Nhánh False (Vận hành bình thường):* Bỏ qua Node 11, đi thẳng sang Node 12.
- **Node 11 (Emergency Director Alert Mailer - Nhánh True):** Gửi email cảnh báo đỏ khẩn cấp cho Tổng giám đốc.
- **Node 12 (Audit Digest Generation Postgres):** Ghi nhận sự kiện `EXECUTIVE_DIGEST_COMPILED` vào `system_audit_logs`.

### [Luồng 7] AI Entity Extraction & CRM Lead Scoring (12 Nodes)
- **Node 1 (Sales Intent Ingest Trigger):** Tiếp nhận dữ liệu hỏi mua hàng từ Luồng 2 tại `/webhook/m3-flow7-crm-lead`.
- **Node 2 (AI Email-to-CRM Lead Agent):** AI Agent 4 bóc tách Tên, SĐT (+84), Doanh nghiệp, Nhu cầu, Ngân sách dự kiến.
- **Node 3 (AI Campaign Categorizer Agent):** AI Agent 7 định vị phân khúc (`ENTERPRISE_HIGH_VALUE` vs `SME_RETAIL`).
- **Node 4 (Sanitize Extracted Entities Code):** Chuẩn hóa định dạng số điện thoại Việt Nam, viết hoa tên doanh nghiệp, làm sạch chuỗi.
- **Node 5 (Query Existing Customer Postgres):** Kiểm tra khách hàng đã có trong bảng `crm_customers` hay chưa.
- **Node 6 (AI Lead Scoring Engine Code):** Tính toán Lead Score (0–100) theo độ rõ ràng của ngân sách và chức vụ người liên hệ.
- **Node 7 (Upsert CRM Customer Record HTTP):** Lưu hoặc cập nhật thông tin khách hàng vào `crm_customers`.
- **Node 8 (Create Sales Deal Opportunity HTTP):** Tạo cơ hội bán hàng mới trong `crm_deals` với trạng thái `NEW_INQUIRY`.
- **Node 9 (Assign Sales Representative Code):** Phân bổ cơ hội cho chuyên viên phụ trách (`tranngo170770@gmail.com`).
- **Node 10 (Internal Sales Alert Email):** Gửi email thông báo kèm Lead Score và tóm tắt nhu cầu cho chuyên viên Sales.
- **Node 11 (Audit CRM Creation Postgres):** Ghi log `CRM_LEAD_QUALIFIED_AND_STORED` vào `system_audit_logs`.
- **Node 12 (Enqueue Follow-up Tracker Code):** Đăng ký mã deal vào quy trình rà soát tự động của Luồng 8.

### [Luồng 8] Automated Multi-Stage Follow-up & Nurturing (12 Nodes)
- **Node 1 (Follow-up Check Schedule Trigger):** Kích hoạt định kỳ 09h00 sáng mỗi ngày hoặc gọi Webhook `m3-flow8-followup-trigger`.
- **Node 2 (Query Stale Sales Deals Postgres):** Quét các deal có trạng thái `QUOTED` đã quá 48 giờ chưa có phản hồi.
- **Node 3 (Filter Blacklisted Leads Code):** Loại bỏ khách hàng đã chọn `is_unsubscribed = true`.
- **Node 4 (Fetch Previous Chat Context Postgres):** Đọc lại nội dung trao đổi gần nhất giữa sales và khách hàng.
- **Node 5 (Check Follow-up Stage Code):** Xác định giai đoạn nhắc nhở (Lần 1: Thân mật; Lần 2: Mời dùng thử; Lần 3: Đề xuất ưu đãi có hạn).
- **Node 6 (AI Follow-up Nurturing Agent):** AI Agent 6 sinh nội dung email hỏi thăm lịch sự, nhấn mạnh giá trị sản phẩm.
- **Node 7 (Send Follow-up Email SMTP):** Gửi email chăm sóc tự động tới `trangltk.24it@vku.udn.vn` từ `kieutrangg06123@gmail.com`.
- **Node 8 (Update Deal Activity Timestamp HTTP):** Cập nhật `last_contacted_at = NOW()` và tăng `followup_count + 1`.
- **Node 9 (IF Max Attempts Reached):**
  - *Điều kiện:* `followup_count >= 3`.
  - *Nhánh True (Đã nhắc quá 3 lần):* Đi sang Node 10 $\rightarrow$ Node 11.
  - *Nhánh False (Chưa tới 3 lần):* Bỏ qua Node 10, đi thẳng sang Node 11.
- **Node 10 (Mark Deal Stale & Task Sales HTTP - Nhánh True):** Đổi trạng thái sang `COLD_LEAD` và tạo nhiệm vụ gọi điện thoại trên CRM.
- **Node 11 (Audit Follow-up Sent Postgres):** Ghi log `SALES_FOLLOWUP_DISPATCHED` vào `system_audit_logs`.
- **Node 12 (Complete Follow-up Cycle Code):** Đóng gói báo cáo thống kê chu kỳ gửi và kết thúc tiến trình.

### [Luồng 9] Multi-Modal Invoice OCR & Accounting Audit (12 Nodes)
- **Node 1 (Finance Intent Ingest Trigger):** Tiếp nhận email hóa đơn từ Luồng 2 tại `/webhook/m3-flow9-invoice-ocr`.
- **Node 2 (Check Attachment Format Code):** Kiểm tra định dạng tệp (PDF, PNG, JPG).
- **Node 3 (Download & Convert File to Base64 Code):** Mã hóa file đính kèm sang base64 để nạp cho mô hình Vision.
- **Node 4 (Multimodal Invoice Vision OCR Agent):** AI Agent 10 bóc tách Số hóa đơn, Mã số thuế, Ngày lập, Tiền hàng, Thuế VAT, Tổng tiền thanh toán.
- **Node 5 (Mathematical Integrity Verifier Code):** Đối soát logic số học: $|\text{Tiền hàng} + \text{Thuế VAT} - \text{Tổng thanh toán}| \le 1 \text{ VNĐ}$.
- **Node 6 (IF Math Verification Passed):**
  - *Nhánh True (Khớp 100%):* Đi sang Node 7.
  - *Nhánh False (Sai lệch số học):* Đi sang Node 8.
- **Node 7 (Store Verified Invoice HTTP - Nhánh True):** Lưu hóa đơn hợp lệ vào `finance_invoices` với trạng thái `VALIDATED`.
- **Node 8 (Flag Invoice Discrepancy HTTP - Nhánh False):** Lưu hóa đơn vào `finance_invoices` với trạng thái `DISCREPANCY_FLAGGED`.
- **Node 9 (Email Chief Accountant Notice):** Gửi email tóm tắt đối soát kèm bảng chi tiết số học cho Kế toán trưởng (`tranngo170770@gmail.com`).
- **Node 10 (Archive Invoice Document Storage Code):** Đổi tên file chuẩn hóa (`INV_MST_YYYYMMDD_SOHD.pdf`) và lưu vào volume Docker.
- **Node 11 (Audit Accounting Log Postgres):** Ghi log `INVOICE_OCR_PROCESSED` hoặc `INVOICE_DISCREPANCY_FLAGGED` vào `system_audit_logs`.
- **Node 12 (Close Finance Ingest Cycle Code):** Phản hồi tín hiệu hoàn thành tác vụ cho cổng giám sát hệ thống.

---

## 7. KỊCH BẢN KIỂM THỬ GIAO DIỆN WEB: ĐIỀU GÌ XẢY RA, LUÂN CHUYỂN HÒM THƯ & 7 TÌNH HUỐNG THỰC TẾ

Trên giao diện Web Next.js tại trang Hộp Thư & Quản Trị Vé (`http://localhost:3000/tickets`), khi người dùng bấm nút **"+ Gửi Email Đến Hệ Thống"**, hệ thống mở một **Inbound Portal Modal** tích hợp sẵn **7 Nút Kịch Bản Thử Nghiệm Nhanh (Quick Test Scenario Pills)**.

Dưới đây là chi tiết toàn diện của 7 kịch bản mặc định: từ thao tác trên UI, điều gì thực sự xảy ra bên dưới hạ tầng (n8n, CSDL), và luân chuyển giữa 3 hòm thư chuẩn.

```
                          [ 3 HÒM THƯ TRỌNG TÂM ]
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. trangltk.24it@vku.udn.vn    : Khách hàng / External Client          │
  │ 2. kieutrangg06123@gmail.com   : SMTP Gateway (Gửi thư ra ngoài)        │
  │ 3. tranngo170770@gmail.com     : Quản trị / KTV / Sales / KTT / Giám đốc│
  └────────────────────────────────────────────────────────────────────────┘
```

### KỊCH BẢN 1: 🔴 KỸ THUẬT (P1 KHẨN CẤP - SẬP HỆ THỐNG)
- **Nút bấm trên UI:** Pill màu đỏ viền hồng: `🔴 1. Kỹ Thuật (P1 Khẩn Cấp)`
- **Mô tả trên nút:** *Sập cổng 504 ➔ Cấp vé & Giao KTV*
- **Dữ liệu nạp tự động vào form:**
  - Họ tên: Lê Thị Kiều Trang
  - Email gửi: `trangltk.24it@vku.udn.vn`
  - Tiêu đề: `[SỰ CỐ KHẨN CẤP] Cổng đăng ký học phần DACS4 VKU bị lỗi 504`
  - Nội dung: *"Kính gửi ban kỹ thuật, toàn bộ sinh viên không thể truy cập đăng ký môn học, máy chủ báo lỗi 504 Gateway Timeout. Đề nghị can thiệp ngay lập tức!"*
  - Tệp đính kèm: Không có.
- **⚙️ Điều gì xảy ra dưới hệ thống?**
  1. **Luồng 1 (Ingest):** Bắt email qua Webhook $\rightarrow$ Làm sạch HTML $\rightarrow$ AI Agent 9 xác nhận đây là email hợp lệ $\rightarrow$ Ghi log `INBOUND_CLEAN_EMAIL_ACCEPTED` $\rightarrow$ Chuyển sang Luồng 2.
  2. **Luồng 2 (Triage):** AI Agent 1 phân tích ngữ nghĩa: Phòng ban `TECH`, Mức độ ưu tiên `P1` (Critical), Sắc thái Khẩn cấp. Tính toán thời hạn cam kết SLA là 1 giờ. Rẽ nhánh True tại Node 7: Gửi email cảnh báo Escalate cho KTV trực ban $\rightarrow$ Gửi email xác nhận biên nhận SLA cho khách hàng $\rightarrow$ Chuyển tiếp sang Luồng 3.
  3. **Luồng 3 (Ticket Dispatch):** AI Agent 3 bóc tách sự cố. Sinh mã vé `TK-YYYYMMDD-XXXX`. Chạy thuật toán Least-Busy chọn KTV có `active_tickets_count` thấp nhất. Tạo vé trạng thái `PENDING` trong bảng `tickets`, tăng tải KTV + 1. Ghi log vào `ticket_comments` $\rightarrow$ Gửi email giao việc cho KTV $\rightarrow$ Gọi Luồng 4.
  4. **Luồng 4 (RAG Draft):** Bóc tách từ khóa "504 Gateway Timeout", tạo vector nhúng. Truy vấn cosine similarity trên bảng `knowledge_base`. AI Agent 2 kết hợp ngữ cảnh tài liệu nội bộ soạn thư nháp kỹ thuật chuẩn mực. Lưu vào bảng `email_drafts` trạng thái `PENDING_APPROVAL`, liên kết vào vé. Đẩy tín hiệu realtime lên trang duyệt thư `/approval`.
- **📬 Luân chuyển hòm thư:**
  - `kieutrangg06123@gmail.com` gửi thư biên nhận SLA 1h tới `trangltk.24it@vku.udn.vn` kèm mã vé `TK-XXXX`.
  - `kieutrangg06123@gmail.com` gửi email cảnh báo khẩn cấp P1 tới `tranngo170770@gmail.com` (KTV trực ban & Quản lý).
  - `kieutrangg06123@gmail.com` gửi email phân công nhiệm vụ vé mới tới `tranngo170770@gmail.com`.
- **🖥️ Kết quả hiển thị trên Web:**
  - Tại `/tickets`: Vé mới xuất hiện trên đầu bảng với viền đỏ nổi bật, huy hiệu P1 nhấp nháy, đồng hồ SLA đếm ngược 60 phút.
  - Tại `/approval`: Xuất hiện thẻ duyệt thư nháp màu đỏ kèm tài liệu trích xuất từ pgvector.

---

### KỊCH BẢN 2: 🟡 BÁN HÀNG (LEAD VIP 95 ĐIỂM - DOANH NGHIỆP ENTERPRISE)
- **Nút bấm trên UI:** Pill màu vàng hổ phách: `🟡 2. Bán Hàng (Lead VIP 95đ)`
- **Mô tả trên nút:** *Deal 250tr ➔ Bóc tách SĐT & Điểm 95*
- **Dữ liệu nạp tự động vào form:**
  - Họ tên: Trần Văn Giám Đốc
  - Email gửi: `trangltk.24it@vku.udn.vn`
  - Tiêu đề: `[HỎI GIÁ & DEMO] Yêu cầu tư vấn triển khai gói Email Automation Enterprise`
  - Nội dung: *"Kính gửi phòng kinh doanh, tôi là Trần Văn Giám Đốc từ Tập đoàn Công nghệ ABC (SĐT: +84 905 123 456). Chúng tôi cần báo giá gói phần mềm ngân sách 250 triệu VNĐ."*
  - Tệp đính kèm: Không có.
- **⚙️ Điều gì xảy ra dưới hệ thống?**
  1. **Luồng 1 & Luồng 2:** Email hợp lệ $\rightarrow$ AI Agent 1 phân loại vào phòng ban `SALES`, gán mức ưu tiên `P2`, gửi email xác nhận biên nhận SLA cho khách hàng $\rightarrow$ Định tuyến sang Luồng 7 (`/webhook/m3-flow7-crm-lead`).
  2. **Luồng 7 (CRM Lead Scoring):** AI Agent 4 bóc tách thực thể B2B (Tên: Trần Văn Giám Đốc, Công ty: Tập đoàn Công nghệ ABC, SĐT: `+84905123456`, Ngân sách: 250.000.000 VNĐ). AI Agent 7 phân loại phân khúc: `ENTERPRISE_HIGH_VALUE`. Node 6 tính điểm Lead Score đạt 95/100 điểm. Upsert thông tin vào bảng `crm_customers`. Tạo deal mới trong `crm_deals` ở cột `NEW_INQUIRY` giá trị 250.000.000 đ. Phân bổ chuyên viên bán hàng (`tranngo170770@gmail.com`). Gửi email cảnh báo cơ hội VIP. Đăng ký mã deal vào lịch theo dõi của Luồng 8.
- **📬 Luân chuyển hòm thư:**
  - `kieutrangg06123@gmail.com` gửi xác nhận tiếp nhận nhu cầu tới `trangltk.24it@vku.udn.vn`.
  - `kieutrangg06123@gmail.com` gửi email cảnh báo cơ hội VIP (giao diện màu hổ phách, Lead Score 95/100, ngân sách 250tr) tới `tranngo170770@gmail.com`.
- **🖥️ Kết quả hiển thị trên Web:**
  - Tại `/crm` (hoặc `/leads`): Xuất hiện thẻ deal mới trong cột MỚI TIẾP NHẬN (`NEW_INQUIRY`) mang tên "Tập đoàn Công nghệ ABC - Gói Enterprise", gắn huy hiệu VIP LEAD 95/100, giá trị hiển thị 250.000.000 đ.

---

### KỊCH BẢN 3: 🟢 HÓA ĐƠN HỢP LỆ (VALIDATED - KHỚP SỐ HỌC 100%)
- **Nút bấm trên UI:** Pill màu xanh lá cây: `🟢 3. Hóa Đơn Hợp Lệ`
- **Mô tả trên nút:** *10tr + 1tr = 11tr ➔ VALIDATED*
- **Dữ liệu nạp tự động vào form:**
  - Họ tên: Công ty CP Phần Mềm VKU
  - Email gửi: `trangltk.24it@vku.udn.vn`
  - Tiêu đề: `[GỬI HÓA ĐƠN VAT] Quyết toán chi phí phần mềm HD-2026-001`
  - Nội dung: *"Kính gửi bộ phận kế toán, Công ty CP Phần Mềm VKU gửi hóa đơn số HD-2026-001: Tiền hàng 10.000.000 đ, thuế VAT 1.000.000 đ, tổng thanh toán là 11.000.000 đ."*
  - Tệp đính kèm mô phỏng: `hoa_don_vat_001.pdf` (Tiền hàng 10.000.000 đ, Thuế VAT 10% 1.000.000 đ, Tổng thanh toán 11.000.000 đ).
- **⚙️ Điều gì xảy ra dưới hệ thống?**
  1. **Luồng 1 & Luồng 2:** Thư sạch $\rightarrow$ AI Agent 1 phân loại vào `FINANCE` $\rightarrow$ Định tuyến sang Luồng 9 (`/webhook/m3-flow9-invoice-ocr`).
  2. **Luồng 9 (Multimodal Invoice OCR & Audit):** Kiểm tra tệp đính kèm `.pdf`, mã hóa base64 đưa vào Gemini Multimodal Vision AI. AI Agent 10 bóc tách các trường: Số HĐ `HD-2026-001`, Tiền hàng 10.000.000 đ, Thuế VAT 1.000.000 đ, Tổng tiền 11.000.000 đ. Node 5 chạy công thức: $|10.000.000 + 1.000.000 - 11.000.000| = 0 \le 1 \text{ VNĐ}$. Node 6 rẽ sang nhánh True: Lưu vào `finance_invoices` trạng thái `VALIDATED`, gửi email kết quả cho Kế toán trưởng, ghi log `INVOICE_OCR_PROCESSED`.
- **📬 Luân chuyển hòm thư:**
  - `kieutrangg06123@gmail.com` gửi email thông báo đối soát hóa đơn hợp lệ (khớp 100%, sẵn sàng thanh toán) tới Kế toán trưởng `tranngo170770@gmail.com`.
- **🖥️ Kết quả hiển thị trên Web:**
  - Tại `/invoices`: Hóa đơn HD-2026-001 xuất hiện với Huy hiệu Xanh Lá cây (`VALIDATED`), hiển thị chi tiết: Tiền hàng 10.000.000 đ, VAT 1.000.000 đ, Tổng tiền 11.000.000 đ, Chênh lệch 0 đ.

---

### KỊCH BẢN 4: ⚠️ HÓA ĐƠN LỆCH TIỀN (DISCREPANCY FLAGGED - PHÁT HIỆN GIAN LẬN)
- **Nút bấm trên UI:** Pill màu tím cảnh báo: `⚠️ 4. Hóa Đơn Lệch Tiền`
- **Mô tả trên nút:** *Lệch 4tr ➔ Cảnh báo gian lận KTT*
- **Dữ liệu nạp tự động vào form:**
  - Họ tên: Nhà cung cấp lạ
  - Email gửi: `trangltk.24it@vku.udn.vn`
  - Tiêu đề: `[GỬI HÓA ĐƠN VAT] Thanh toán dịch vụ bảo trì HD-FAKE-002`
  - Nội dung: *"Kính gửi kế toán, gửi hóa đơn HD-FAKE-002: Tiền hàng 10.000.000 đ, thuế VAT 1.000.000 đ, tổng thanh toán là 15.000.000 đ (kê khống lệch 4 triệu)."*
  - Tệp đính kèm mô phỏng: `hoa_don_fake.pdf` (Tiền hàng 10.000.000 đ, Thuế 1.000.000 đ, Tổng thanh toán ghi khống 15.000.000 đ).
- **⚙️ Điều gì xảy ra dưới hệ thống?**
  1. **Luồng 1 & Luồng 2:** Phân loại vào `FINANCE` $\rightarrow$ Định tuyến sang Luồng 9.
  2. **Luồng 9 (Multimodal Invoice OCR & Audit):** AI Agent 10 trích xuất: Tiền hàng 10.000.000, Thuế 1.000.000, Tổng tiền 15.000.000. Node 5 kiểm toán công thức: $|10.000.000 + 1.000.000 - 15.000.000| = 4.000.000 > 1 \text{ VNĐ}$. Node 6 rẽ sang nhánh False: Lưu vào bảng `finance_invoices` với trạng thái `DISCREPANCY_FLAGGED`. Gửi email báo động đỏ khẩn cấp cho Kế toán trưởng yêu cầu dừng chi trả. Ghi log `INVOICE_DISCREPANCY_FLAGGED`.
- **📬 Luân chuyển hòm thư:**
  - `kieutrangg06123@gmail.com` gửi email cảnh báo nguy cơ gian lận tài chính (viền đỏ khẩn cấp, nêu rõ chênh lệch 4.000.000 đ) tới Kế toán trưởng `tranngo170770@gmail.com`.
- **🖥️ Kết quả hiển thị trên Web:**
  - Tại `/invoices`: Hóa đơn HD-FAKE-002 hiển thị Huy hiệu Đỏ Cảnh Báo (`DISCREPANCY_FLAGGED`) kèm dòng ghi chú nổi bật: *"Sai lệch số học 4.000.000 đ so với thực tế"*.

---

### KỊCH BẢN 5: 📋 HÀNH CHÍNH / CSKH (GENERAL - HỎI THỦ TỤC NỘI BỘ)
- **Nút bấm trên UI:** Pill màu xanh dương: `📋 5. Hành Chính / CSKH (General)`
- **Mô tả trên nút:** *Hỏi thủ tục ➔ Sinh vé & Dự thảo duyệt*
- **Dữ liệu nạp tự động vào form:**
  - Họ tên: Nguyễn Thị Thảo
  - Email gửi: `trangltk.24it@vku.udn.vn`
  - Tiêu đề: `[HỎI THỦ TỤC] Hướng dẫn làm lại thẻ từ và đăng ký gửi xe máy`
  - Nội dung: *"Kính gửi phòng Hành chính - Tổng hợp, tôi là nhân viên mới muốn xin hướng dẫn thủ tục làm lại thẻ từ ra vào tòa nhà và đăng ký biển số xe tại tầng hầm. Trân trọng cảm ơn!"*
  - Tệp đính kèm: Không có.
- **⚙️ Điều gì xảy ra dưới hệ thống?**
  1. **Luồng 1 & Luồng 2:** Email hợp lệ $\rightarrow$ AI Agent 1 phân loại vào phòng ban `GENERAL`, mức ưu tiên `P4 - Low`, tính toán hạn SLA tiêu chuẩn là 48 giờ $\rightarrow$ Gửi email xác nhận tiếp nhận cho khách hàng $\rightarrow$ Định tuyến sang Luồng 3.
  2. **Luồng 3 & Luồng 4:** Cấp mã vé `TK-YYYYMMDD-XXXX`, gán cho chuyên viên trực hành chính. RAG tìm kiếm quy định làm thẻ từ trong `knowledge_base` $\rightarrow$ AI Agent 2 soạn thảo bản nháp hướng dẫn các bước điền form và địa điểm nhận thẻ. Đẩy thư nháp lên trang `/approval`.
- **📬 Luân chuyển hòm thư:**
  - `kieutrangg06123@gmail.com` gửi thư biên nhận hẹn phản hồi trong 48h tới `trangltk.24it@vku.udn.vn`.
- **🖥️ Kết quả hiển thị trên Web:**
  - Tại `/tickets`: Xuất hiện vé mới với huy hiệu màu xanh dương P4 - Low, phòng ban General.
  - Tại `/approval`: Có bản nháp trả lời hướng dẫn thủ tục hành chính chờ cấp quản lý duyệt.

---

### KỊCH BẢN 6: 🛑 PHISHING LỪA ĐẢO OTP (GIẢ MẠO NGÂN HÀNG)
- **Nút bấm trên UI:** Pill màu đỏ tươi: `🛑 6. Phishing Lừa Đảo OTP`
- **Mô tả trên nút:** *Tự động cô lập Kho An Ninh*
- **Dữ liệu nạp tự động vào form:**
  - Họ tên: Hệ Thống An Ninh Ngân Hàng
  - Email gửi: `security@vietcombannk-update.com` (Tên miền giả mạo lừa đảo).
  - Tiêu đề: `[CẢNH BÁO BẢO MẬT] Tài khoản bị khóa, yêu cầu xác thực OTP ngay`
  - Nội dung: *"Kính gửi khách hàng, tài khoản ngân hàng của bạn bị tạm ngưng. Vui lòng cung cấp mã OTP để mở khóa ngay."*
  - Tệp đính kèm: Không có.
- **⚙️ Điều gì xảy ra dưới hệ thống?**
  1. **Luồng 1 (Ingest & Anti-Spam Gatekeeper):** Node 3 & 4 phát hiện tên miền mạo danh không tin cậy. Node 5 (AI Spam & Phishing Classifier Agent) phân tích nội dung: phát hiện kỹ thuật tấn công xã hội, yêu cầu OTP $\rightarrow$ Gắn cờ `is_spam = true`, `threat_type = 'PHISHING_CREDENTIAL_THEFT'`.
  2. **Rẽ sang nhánh False:** Tống toàn văn nội dung thư vào bảng kho cách ly `email_quarantine_vault`. Gửi email cảnh báo SOC khẩn cấp tới Quản trị viên an ninh. Tăng số lần vi phạm `failed_attempts + 1` và trừ ngay 50 điểm uy tín. Dừng toàn bộ chuỗi xử lý, **tuyệt đối KHÔNG kích hoạt Luồng 2 và KHÔNG sinh vé rác**.
- **📬 Luân chuyển hòm thư:**
  - `kieutrangg06123@gmail.com` gửi email cảnh báo an ninh SOC tới Quản trị viên `tranngo170770@gmail.com` kèm phân tích dấu hiệu lừa đảo. Kẻ gửi lừa đảo hoàn toàn không nhận được phản hồi.
- **🖥️ Kết quả hiển thị trên Web:**
  - Tại tab "Kho Cách Ly (Quarantine Vault)" trên trang `/tickets`: Bản ghi lừa đảo xuất hiện tức thì với nhãn đỏ PHISHING, điểm uy tín bị hạ xuống âm. Không có bất kỳ vé rác nào phát sinh trên hệ thống.

---

### KỊCH BẢN 7: ☣️ MÃ ĐỘC TỆP ĐÍNH KÈM (MALWARE ATTACHMENT .EXE)
- **Nút bấm trên UI:** Pill màu xám kim loại: `☣️ 7. Mã Độc Tệp Đính Kèm`
- **Mô tả trên nút:** *Tệp .exe ➔ Tự động cách ly*
- **Dữ liệu nạp tự động vào form:**
  - Họ tên: Kẻ Tấn Công
  - Email gửi: `phishing_bot@trojan-domain.ru`
  - Tiêu đề: `[THÔNG BÁO] Chi trả bảng lương và tiền thưởng dự án DACS4 HK1`
  - Nội dung: *"Chi tiết bảng lương nhân viên và mức thưởng vui lòng mở tệp đính kèm."*
  - Tệp đính kèm giả lập: `bang_luong_thuong_quy.xlsx.exe` (File nhị phân ngụy trang trojan thực thi PE Windows).
- **⚙️ Điều gì xảy ra dưới hệ thống?**
  1. **Luồng 1 (Ingest & Anti-Spam Gatekeeper):** Node 2 bóc tách tệp đính kèm, phát hiện đuôi kép độc hại `.xlsx.exe`. Hệ thống đối chiếu danh sách cấm thực thi: `.exe`, `.bat`, `.vbs`, `.sh` $\rightarrow$ Định danh là mã độc Trojan phát tán qua thư.
  2. **Rẽ sang nhánh False:** Lưu vào `email_quarantine_vault` với nhãn `MALWARE_SUSPECTED`. Bắn email cảnh báo nguy hại mã độc cho Quản trị viên hệ thống. Hạ điểm uy tín người gửi về mức 0 (Blacklisted). Ngắt quy trình, bảo vệ an toàn tuyệt đối cho máy chủ backend và nhân sự.
- **📬 Luân chuyển hòm thư:**
  - `kieutrangg06123@gmail.com` gửi cảnh báo tấn công mã độc đính kèm file thực thi tới `tranngo170770@gmail.com`.
- **🖥️ Kết quả hiển thị trên Web:**
  - Tại tab "Kho Cách Ly" trang `/tickets`: Xuất hiện dòng cảnh báo mã độc màu xám đen với tên file nguy hiểm `bang_luong_thuong_quy.xlsx.exe`.

---

### 🔄 QUY TRÌNH TIẾP NỐI: PHÊ DUYỆT HUMAN-IN-THE-LOOP (LUỒNG 5) TRÊN WEB
Sau khi Kịch bản 1 hoặc 5 tạo ra bản nháp RAG thành công:
1. Chuyên viên mở trang Duyệt Thư Nháp (`http://localhost:3000/approval`).
2. Màn hình hiển thị song song: Câu hỏi gốc của khách hàng, trích dẫn tài liệu từ `knowledge_base` (cosine > 0.75), và khung soạn thảo thư do AI tạo sẵn.
3. Chuyên viên kiểm tra, có thể chỉnh sửa lại câu từ trực tiếp trên giao diện rồi bấm **"Duyệt & Gửi Email"**.
4. **Điều gì xảy ra ở Luồng 5 n8n?**
   - Giao diện Web gửi request tới Webhook `/webhook/m2-flow5-approval`.
   - Node 2 xác thực quyền hạn của chuyên viên phê duyệt.
   - Node 5 kích hoạt gửi email thực tế qua Gmail SMTP từ `kieutrangg06123@gmail.com` đến `trangltk.24it@vku.udn.vn`.
   - Node 7 cập nhật bản nháp thành `SENT`.
   - Node 8 đổi trạng thái vé trong bảng `tickets` thành `RESOLVED` (Đã giải quyết - Thẻ xanh).
   - Node 10 & 11 tính toán độ trễ, ghi nhận chỉ số tuân thủ cam kết SLA (`MET_SLA`).
   - Bản nháp tự động biến mất khỏi hàng đợi chờ duyệt trên UI, vé chuyển sang trạng thái hoàn tất.

---

## 8. CẨM NANG THAO TÁC TRÊN GIAO DIỆN WEB NEXT.JS (PORT 3000)

Giao diện người dùng được xây dựng hoàn toàn bằng **Next.js 14 App Router** kết hợp **Tailwind CSS**, mang phong cách SaaS thương mại hiện đại:

### 8.1. Trang Chủ Dashboard (`http://localhost:3000`)
- **Thống kê 4 thẻ KPI:** Tổng số email tiếp nhận, Số vé đang mở, Tỷ lệ tuân thủ cam kết SLA (% đúng hạn), Tổng cơ hội kinh doanh CRM.
- **Nút "Cập Nhật Số Liệu":** Tự động đồng bộ số liệu thời gian thực từ Backend NestJS (Port 4000) mà không cần tải lại trang.
- **Lịch sử hoạt động gần đây:** Hiển thị 5 sự kiện mới nhất từ bảng `system_audit_logs`.

### 8.2. Trang Hộp Thư & Quản Trị Vé (`http://localhost:3000/tickets`)
- **Nút "+ Gửi Email Đến Hệ Thống":** Mở Inbound Portal Modal kèm 7 Nút Quick Test Scenario Pills để thử nghiệm ngay lập tức các tình huống thực tế.
- **Bảng danh sách vé:** Phân loại theo màu sắc mức độ ưu tiên:
  - *P1 - Critical:* Viền đỏ, nhấp nháy khẩn cấp.
  - *P2 - High:* Màu cam.
  - *P3 - Medium:* Màu vàng.
  - *P4 - Low:* Màu xanh dương.
- **Đồng hồ đếm ngược SLA:** Đếm lùi thời gian thực theo hạn cam kết SLA.
- **Tab "Kho Cách Ly (Quarantine Vault)":** Nơi theo dõi các email lừa đảo, thư rác, tệp đính kèm độc hại bị AI chặn đứng ở Luồng 1.

### 8.3. Trang Phê Duyệt Thư Nháp Human-in-the-Loop (`http://localhost:3000/approval`)
- **Cơ chế cốt lõi HITL:** Nơi nhân viên CSKH/KTV kiểm soát chất lượng câu trả lời của AI trước khi gửi cho khách hàng.
- **Hiển thị song song:**
  - *Bên trái:* Nội dung câu hỏi của khách và trích lục tài liệu tham chiếu từ `knowledge_base` (pgvector).
  - *Bên phải:* Dự thảo câu trả lời do Gemini RAG soạn thảo.
- **Nút "Duyệt & Gửi Email":** Kích hoạt Luồng 5 n8n gửi email qua SMTP và tự động đổi vé sang `RESOLVED`.

### 8.4. Trang Khách Hàng & Cơ Hội Bán Hàng CRM (`http://localhost:3000/crm` hoặc `/leads`)
- **Bảng Kanban 5 Cột:** Trực quan hóa quy trình bán hàng qua các giai đoạn:
  - Mới Tiếp Nhận (`NEW_INQUIRY`)
  - Đã Báo Giá (`QUOTED`)
  - Cần Chăm Sóc Lại (`COLD_LEAD`)
  - Chốt Thành Công (`WON`)
  - Thất Bại (`LOST`)
- **Thẻ Lead Score:** Tự động gắn nhãn điểm tiềm năng do AI chấm (0–100) và ngân sách dự kiến (ví dụ: VIP LEAD 95/100, 250.000.000 đ).
- **Nút "⏰ Kích Hoạt Chăm Sóc 48H":** Bấm kích hoạt thủ công Luồng 8 để quét và tự động gửi email nuôi dưỡng khách hàng trễ hẹn.

### 8.5. Trang Đối Soát Hóa Đơn VAT (`http://localhost:3000/invoices`)
- **Danh sách chứng từ kế toán:** Bóc tách từ Luồng 9 gồm: Số hóa đơn, Đơn vị bán, Mã số thuế, Tiền hàng, Tiền thuế VAT, Tổng tiền thanh toán.
- **Huy hiệu trạng thái đối soát số học:**
  - *HỢP LỆ (VALIDATED):* Màu xanh lá cây (Khớp 100%).
  - *SAI LỆCH (DISCREPANCY_FLAGGED):* Màu đỏ cảnh báo kèm số tiền chênh lệch (Kê khống).
- **Tab "Nhật Ký Kiểm Toán (Audit Logs)":** Xem chi tiết lịch sử từng phép tính đối soát toán học.

### 8.6. Trang Báo Cáo Điều Hành & SLA Analytics (`http://localhost:3000/analytics`)
- **Biểu đồ SVG trực quan:** Tỷ lệ phân bổ sự cố giữa 4 phòng ban và tỷ lệ đạt chuẩn cam kết SLA.
- **Bản tin Executive Digest:** Bản tóm tắt điều hành 24 giờ do AI Agent 5 tổng hợp, nêu rõ 3 điểm nghẽn và giải pháp chiến lược.
- **Nút "🚀 Kích Hoạt Gửi Báo Cáo 24H (Ban Giám Đốc)":** Kích hoạt ngay Luồng 6 gửi email báo cáo kèm 4 thẻ KPI động tới `tranngo170770@gmail.com`.

---

## 9. TOÀN BỘ CÂU LỆNH KHỞI CHẠY, TẮT, RESET DATA VÀ GIÁM SÁT CSDL

Toàn bộ các tác vụ vận hành trên máy trạm đều được đóng gói thành các kịch bản Bash script thực thi 1 chạm tại thư mục dự án `/home/kieu-trang/email-automation-plan`:

### 9.1. Lệnh Khởi Chạy 1 Chạm Toàn Bộ Hệ Thống
```bash
cd /home/kieu-trang/email-automation-plan
./run_all.sh
```
*Script tự động: Khởi động 2 container Docker (`enterprise_db` và `enterprise_n8n`), tự động import và kích hoạt 9 workflows, khởi chạy Backend NestJS trên port 4000 và Frontend Next.js trên port 3000.*

### 9.2. Lệnh Mở Cloudflare Tunnel Cho Hội Đồng Truy Cập Từ Xa
```bash
cd /home/kieu-trang/email-automation-plan
./start_tunnel.sh 3000
```
*Script cấp đường truyền public HTTPS (ví dụ `https://xxxx.trycloudflare.com`) giúp Hội đồng mở trên điện thoại hay laptop cá nhân mà không bị cản trở bởi NAT/Firewall.*

### 9.3. Lệnh Nạp Tự Động 9 Workflows vào n8n
```bash
cd /home/kieu-trang/email-automation-plan
./import_workflows_to_n8n.sh
```

### 9.4. Lệnh Khởi Tạo Bộ Dữ Liệu 7 Ngày Demo (Phục vụ Demo & Hội Đồng)
```bash
cd /home/kieu-trang/email-automation-plan
node seed_multi_day_demo_data.js
```
*Tự động nạp bộ dữ liệu phong phú gồm lịch sử 7 ngày: hàng chục vé hỗ trợ các cấp độ P1–P4, các cơ hội bán hàng CRM, các hóa đơn đối soát, nhật ký kiểm toán và báo cáo điều hành phục vụ chấm thi.*

### 9.5. Lệnh Làm Sạch Dữ Liệu Giao Dịch (Reset Data về 0)
```bash
cd /home/kieu-trang/email-automation-plan
./reset_test_data.sh
```
*Làm sạch trắng toàn bộ dữ liệu giao dịch phát sinh trong quá trình test (`tickets`, `email_drafts`, `crm_deals`, `finance_invoices`), đưa hệ thống về trạng thái ban đầu sạch sẽ nhưng vẫn giữ nguyên danh mục phòng ban và 16 cẩm nang tri thức RAG.*

### 9.6. Lệnh Xem Số Lượng Bản Ghi 14 Bảng CSDL Nhanh
```bash
cd /home/kieu-trang/email-automation-plan
./view_db_stats.sh
```
*Truy vấn trực tiếp vào container PostgreSQL và in bảng thống kê chi tiết số lượng bản ghi của 14 bảng dữ liệu, top 5 vé mới nhất, top 5 bản nháp HITL và top 5 hóa đơn.*

### 9.7. Lệnh Tắt An Toàn Toàn Bộ Hệ Thống
```bash
cd /home/kieu-trang/email-automation-plan
./stop_all.sh
```
*Tắt an toàn các tiến trình nền của NestJS, Next.js và dừng các container Docker.*

### 9.8. Lệnh Chạy Bộ Kiểm Thử Tự Động (20/20 Test Suite Pass)
```bash
cd /home/kieu-trang/email-automation-plan
node test_all_9_flows_e2e.js
```

---

## 10. BỘ CÂU HỎI VẤN ĐÁP HỘI ĐỒNG THƯỜNG GẶP & CÁCH TRẢ LỜI "ĂN ĐIỂM TỐI ĐA"

### 🎯 Câu 1: Tại sao nhóm lại giới hạn mỗi workflow chính xác đúng 12 bước xử lý mà không thiết kế tự do?
> **Đáp án trả lời phản biện xuất sắc:**  
> *"Dạ thưa Thầy/Cô, trong các dự án tự động hóa doanh nghiệp thực tế, các workflow cồng kềnh (> 20 nodes) rất dễ gây tràn bộ nhớ (OOM) trong container n8n và giữ kết nối webhook quá lâu dẫn tới Timeout từ phía client (> 30s).  
> Nhóm áp dụng nguyên lý thiết kế Microservices và kiến trúc Micro-Workflows: chuẩn hóa chính xác đúng 12 bước xử lý cho mỗi DAG để vừa bao quát trọn vẹn cả nhánh chính (Happy path) lẫn nhánh xử lý ngoại lệ (Exception handling).  
> Cách tiếp cận này mang lại 3 giá trị kỹ thuật cốt lõi:  
> 1. **Kiểm soát tài nguyên:** RAM tiêu thụ của n8n luôn dưới 150MB, thời gian phản hồi webhook tức thời dưới 3 giây.  
> 2. **Dễ cô lập lỗi (Fault Isolation):** Nếu bước OCR hóa đơn gặp sự cố mạng, toàn bộ chuỗi tiếp nhận email và điều phối vé P1 của phòng Kỹ thuật vẫn hoạt động độc lập 100%.  
> 3. **Phân chia khối lượng công việc cân đối:** 3 thành viên trong nhóm phụ trách chính xác 3 luồng chức năng độc lập (TV1: Tiếp nhận & Điều phối; TV2: RAG & Điều hành; TV3: CRM & Kế toán), liên thông dữ liệu thông qua webhook nội bộ một cách mạch lạc."*

### 🎯 Câu 2: Cơ chế RAG trong dự án hoạt động như thế nào? Tại sao lại dùng pgvector thay vì các Vector DB độc lập như Pinecone hay Chroma?
> **Đáp án trả lời phản biện xuất sắc:**  
> *"Dạ thưa Thầy/Cô, ở Luồng 4, khi có vé sự cố kỹ thuật, hệ thống sử dụng mô hình embedding để vector hóa câu hỏi của khách hàng thành vector nhúng. Sau đó, hệ thống thực hiện truy vấn Cosine Similarity Search (`ORDER BY embedding <=> $1 LIMIT 3`) trực tiếp trên bảng `knowledge_base` với ngưỡng lọc tương đồng khắt khe $> 0.75$.  
> Nhóm chọn pgvector tích hợp trên PostgreSQL 16 thay vì các dịch vụ bên ngoài như Pinecone hay Chroma vì:  
> 1. **Tính toàn vẹn giao dịch ACID:** Cho phép thực hiện JOIN trực tiếp giữa dữ liệu vector của cẩm nang tri thức với dữ liệu quan hệ của vé sự cố (`tickets`) và thông tin khách hàng trong cùng một giao dịch mà không phát sinh độ trễ mạng.  
> 2. **Tiết kiệm chi phí & Tối ưu hạ tầng:** Doanh nghiệp không cần phải duy trì và vận hành một cụm server Vector DB riêng biệt, đơn giản hóa việc backup và phục hồi dữ liệu."*

### 🎯 Câu 3: Tại sao lại cần khâu Human-in-the-Loop (HITL) ở Luồng 5 mà không để AI tự động gửi thẳng email cho khách hàng?
> **Đáp án trả lời phản biện xuất sắc:**  
> *"Dạ thưa Thầy/Cô, trong môi trường doanh nghiệp B2B, văn bản gửi ra ngoài đại diện cho uy tín thương hiệu và trách nhiệm pháp lý của công ty. Dù các mô hình LLM hiện đại rất thông minh, nhưng vẫn luôn tồn tại xác suất Ảo giác thông tin (Hallucination).  
> Vì vậy, ở Luồng 4, AI chỉ đóng vai trò Trợ lý soạn thảo thông minh (Copilot), tạo dự thảo ở trạng thái `PENDING_APPROVAL` và đẩy realtime lên giao diện Next.js (`/approval`). Chuyên viên hỗ trợ chỉ mất 5 giây đọc lướt, chỉnh sửa nếu cần và bấm 'Duyệt & Gửi'.  
> Chỉ khi có hành động phê duyệt của con người, Luồng 5 mới kích hoạt gửi email qua SMTP và đổi vé sang `RESOLVED`. Đây là tiêu chuẩn vàng (Golden Standard) trong các giải pháp Enterprise AI hiện nay nhằm bảo đảm an toàn dữ liệu và tuân thủ trách nhiệm giải trình."*

### 🎯 Câu 4: Thuật toán cân bằng tải Least-Busy cho kỹ thuật viên ở Luồng 3 hoạt động ra sao?
> **Đáp án trả lời phản biện xuất sắc:**  
> *"Dạ thưa Thầy/Cô, trong bảng `support_agents`, mỗi KTV có trường `active_tickets_count` theo dõi số lượng vé đang xử lý dở dang.  
> Khi có sự cố kỹ thuật mới, Node 5 của Luồng 3 truy vấn danh sách KTV thuộc phòng ban đang ở trạng thái `status = 'AVAILABLE'`, sắp xếp theo thứ tự `active_tickets_count ASC` và chọn người đầu tiên (người đang rảnh nhất).  
> Ngay sau khi gán việc, hệ thống thực hiện transaction cập nhật tăng `active_tickets_count + 1`. Khi vé được giải quyết xong ở Luồng 5 sau khi duyệt gửi thư, bộ đếm tải của KTV đó sẽ được tự động trừ đi 1. Cơ chế này giúp triệt tiêu hoàn toàn tình trạng 'người làm không hết việc, người ngồi không', tối ưu hóa năng suất vận hành của đội ngũ kỹ thuật."*

### 🎯 Câu 5: Hệ thống kiểm toán số học hóa đơn VAT ở Luồng 9 phát hiện gian lận bằng cách nào?
> **Đáp án trả lời phản biện xuất sắc:**  
> *"Dạ thưa Thầy/Cô, sau khi AI Multimodal Vision OCR bóc tách 3 trường số học từ ảnh/PDF hóa đơn: Tiền hàng trước thuế (`subtotal`), Tiền thuế VAT (`vat_amount`) và Tổng tiền thanh toán (`total_amount`), hệ thống không tin tưởng tuyệt đối vào văn bản trích xuất mà chạy một thuật toán kiểm toán số học độc lập tại Node 5: $|\text{subtotal} + \text{vat\_amount} - \text{total\_amount}| \le 1 \text{ VNĐ}$ (Cho phép sai số làm tròn tối đa 1 đồng).  
> - **Nếu đẳng thức thỏa mãn:** Hóa đơn được gắn cờ `VALIDATED` (Huy hiệu xanh lá cây trên Web).  
> - **Nếu phát hiện sai lệch:** (ví dụ Kịch bản 4: Tiền hàng 10tr + VAT 1tr = 11tr nhưng tổng tiền ghi khống 15tr, lệch 4 triệu đồng), hệ thống lập tức rẽ sang nhánh False: gắn cờ `DISCREPANCY_FLAGGED` (Cảnh báo đỏ trên Web) và gửi email khẩn cấp cho Kế toán trưởng yêu cầu tạm dừng thanh toán, ngăn ngừa triệt để rủi ro thất thoát tài chính cho công ty."*

### 🎯 Câu 6: Làm thế nào hệ thống đảm bảo an toàn bảo mật, không lộ cấu hình và không rò rỉ mã biểu thức n8n?
> **Đáp án trả lời phản biện xuất sắc:**  
> *"Dạ thưa Thầy/Cô, hệ thống áp dụng cơ chế bảo mật đa lớp theo chuẩn công nghiệp:  
> 1. **Bảo mật biến môi trường:** Mọi thông tin nhạy cảm (Mật khẩu CSDL PostgreSQL, Gemini API Key, Gmail SMTP App Password) đều được lưu trữ trong tệp `.env` và nằm trong danh sách `.gitignore`, tuyệt đối không bao giờ bị lộ lên GitHub.  
> 2. **Bảo mật truy cập CSDL:** n8n chỉ giao tiếp với CSDL qua các endpoint Backend NestJS có kiểm tra schema DTO chặt chẽ, ngăn ngừa tấn công SQL Injection.  
> 3. **Chuẩn hóa biểu thức & Guard:** Toàn bộ biểu thức nội suy trong n8n được viết chuẩn theo cú pháp ES6 Template Literal kèm cơ chế Fallback ở tầng code, đảm bảo chuỗi luôn được biên dịch an toàn trước khi gửi đến Gemini, triệt tiêu nguy cơ rò rỉ mã biểu thức thô ra CSDL hay giao diện người dùng."*

### 🎯 Câu 7: Nếu có 1000 email gửi tới cùng lúc thì hệ thống có bị nghẽn không?
> **Đáp án trả lời phản biện xuất sắc:**  
> *"Dạ thưa Thầy/Cô, hệ thống được thiết kế theo kiến trúc Event-Driven phi đồng bộ (Asynchronous):  
> - Node 1 của Luồng 1 khi tiếp nhận webhook chỉ làm nhiệm vụ ghi nhận payload và phản hồi HTTP 200 ngay lập tức cho client trong vòng dưới 100ms, không giữ kết nối chờ AI xử lý xong mới trả lời.  
> - Các luồng nghiệp vụ sau đó xử lý tuần tự qua hàng đợi sự kiện của n8n và connection pool của PostgreSQL 16.  
> - Khi cần mở rộng quy mô lớn (Scale-up), n8n hỗ trợ chế độ Queue Mode kết hợp với Redis để phân tán tác vụ ra nhiều worker container độc lập một cách dễ dàng."*

### 🎯 Câu 8: Điểm khác biệt lớn nhất giữa dự án này và một phần mềm CRM/Helpdesk thương mại có sẵn trên thị trường là gì?
> **Đáp án trả lời phản biện xuất sắc:**  
> *"Dạ thưa Thầy/Cô, các phần mềm CRM/Helpdesk truyền thống (như Zendesk hay Freshdesk) chủ yếu dựa vào các quy tắc cứng (Rule-based: từ khóa cứng, if-else) và yêu cầu con người phải đọc, phân loại và gán vé thủ công.  
> Điểm khác biệt vượt trội của dự án nằm ở Hệ sinh thái 10 AI Agents chuyên biệt kết hợp RAG:  
> 1. **Hiểu ngữ nghĩa tự nhiên tiếng Việt:** Tự động nhận diện ý định và mức độ khẩn cấp mà không cần từ khóa cố định.  
> 2. **RAG nội bộ:** Tự động đối chiếu cẩm nang tri thức nội bộ để soạn thảo câu trả lời sẵn sàng cho chuyên viên duyệt, giảm 80% thời gian xử lý vé.  
> 3. **Đa chức năng liên phòng ban:** Một giải pháp duy nhất giải quyết đồng thời cả 3 bài toán: Hỗ trợ kỹ thuật (IT Support), Bán hàng (CRM Lead Scoring & Nuôi dưỡng 48h) và Kế toán (Vision OCR đối soát hóa đơn chống gian lận)."*

---
*Báo cáo được biên soạn và cập nhật đồng bộ trực tiếp với mã nguồn đang vận hành tại dự án `email-automation-plan`.*

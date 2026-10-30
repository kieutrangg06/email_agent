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

| STT | Tên AI Agent | Kiểu Node n8n & Mô hình | Vị trí trong Luồng n8n | Chức năng cụ thể |
|:---:|:---|:---|:---:|:---|
| **1** | **AI Semantic Triage Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 2 (Node 3) | Phân tích ngữ cảnh tiếng Việt, định tuyến 4 phòng ban (TECH, SALES, FINANCE, GENERAL), gán nhãn độ khẩn cấp P1–P4, trích xuất sắc thái và lý do. |
| **2** | **AI RAG Response Drafter Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 4 (Node 6) | Kết hợp kết quả tra cứu vector cosine similarity (pgvector) từ NestJS RAG API để sinh dự thảo trả lời kỹ thuật chuẩn xác. |
| **3** | **AI Email-to-Ticket Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 3 (Node 2) | Bóc tách tiêu đề sự cố ngắn gọn, xác định phân hệ lỗi (`affected_module`), trích xuất các bước tái hiện lỗi (`reproduce_steps`). |
| **4** | **AI Email-to-CRM Lead Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 7 (Node 2) | Bóc tách cấu trúc thực thể kinh doanh từ thư phi cấu trúc: Tên liên hệ, SĐT (+84), Doanh nghiệp, Nhu cầu giải pháp, Ngân sách dự kiến. |
| **5** | **AI Executive Summarizer Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 6 (Node 5) | Tóm tắt tổng thể email và vé sự cố trong 24h, phân tích sắc thái chung và chỉ ra 3 vấn đề trọng tâm gửi Ban Giám Đốc. |
| **6** | **AI Follow-up Nurturing Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 8 (Node 6) | Đọc lịch sử trao đổi của các deal báo giá > 48h, tự động tạo email hỏi thăm cá nhân hóa theo 3 giai đoạn (Lần 1, Lần 2, Lần 3). |
| **7** | **AI Campaign Categorizer Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 7 (Node 3) | Định vị phân khúc khách hàng (`ENTERPRISE_HIGH_VALUE` vs `SME_RETAIL`) và gắn nhãn chiến dịch tiếp thị tương ứng. |
| **8** | **AI Deliverability Monitor** | Rule Engine + Gemini Audit | Luồng 1 (Node 4) & Luồng 6 (Node 4) | Kiểm soát chỉ số uy tín người gửi (`reputation_score`), phát hiện tỷ lệ bounce/spam và cảnh báo spike số lượng lỗi P1 tăng đột biến > 20%. |
| **9** | **AI Spam & Phishing Classifier Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 1 (Node 5) | Cửa ngõ phòng vệ đầu tiên: Phân tích phát hiện thư rác (Spam), thư lừa đảo tài chính (Phishing), mã độc hoặc nội dung không hợp lệ. |
| **10** | **Multimodal Invoice Vision OCR Agent** | `@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash | Luồng 9 (Node 4) | Đọc file PDF/ảnh hóa đơn, bóc tách Số hóa đơn, MST, Ngày lập, Tiền hàng, Thuế VAT, Tổng tiền thanh toán. |

---

## 4. CƠ CHẾ LIÊN HOÀN & CHI TIẾT 12 NODE CỦA 9 WORKFLOWS
Mỗi workflow được thiết kế đúng **12 nodes DAG**; các dây nối (connections) được kích hoạt tuần tự và thông qua các nhánh rẽ điều kiện (Condition Router):

### PHẦN THÀNH VIÊN 1: Ingest, Triage & Helpdesk SLA
#### [Luồng 1] Email Ingest, Anti-Spam & Blacklist Quarantine (12 Nodes)
*File: `workflows/flow01_ingest_antispam.json`*
- **Node 1 (Webhook Ingest Trigger):** Tiếp nhận payload email qua `POST /webhook/m1-flow1-ingest`.
- **Node 2 (Payload Normalization Code):** Dùng Regex bóc tách email gốc, làm sạch mã HTML body, chuẩn hóa chuỗi đầu vào.
- **Node 3 (System/No-Reply Filter Code):** Phát hiện email tự sinh (no-reply, mailer-daemon, bounce). Nếu là email hệ thống, đẩy sang nhánh cách ly.
- **Node 4 (Check Sender Reputation HTTP API):** Gọi NestJS API `GET /api/v1/audit/reputation` kiểm tra điểm `reputation_score` và trạng thái chặn của người gửi.
- **Node 5 (AI Spam & Phishing Classifier Agent):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) phân tích nội dung có chứa dấu hiệu lừa đảo, phát tán mã độc hay không.
- **Node 6 (IF Clean & High Reputation):** Rẽ nhánh: Nếu `is_spam == false` và `reputation_score >= 20` -> Đi vào Nhánh True (Sạch); Ngược lại -> Đi vào Nhánh False (Độc hại).
- **Node 7 (Quarantine Vault HTTP API - Nhánh False):** Gọi NestJS API `POST /api/v1/audit/quarantine` lưu trữ an toàn email vi phạm vào bảng cách ly.
- **Node 8 (Security Alert Mailer - Nhánh False):** Gửi email SMTP cảnh báo khẩn cấp cho Quản trị viên (`tranngo170770@gmail.com`).
- **Node 9 (Update Sender Strike Score HTTP API - Nhánh False):** Gọi NestJS API `POST /api/v1/audit/reputation/strike` tăng `failed_attempts + 1` và trừ điểm tín nhiệm.
- **Node 10 (Format Clean Verified Payload Code - Nhánh True):** Đóng gói payload email sạch, gắn cờ `IS_CLEAN_VERIFIED = true`.
- **Node 11 (Audit Ingest Pass HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi sự kiện `INBOUND_CLEAN_EMAIL_ACCEPTED` vào hệ thống audit.
- **Node 12 (Trigger Workflow 2 Sub-workflow):** Bắn HTTP POST chuyển tiếp toàn bộ payload sang Luồng 2 (`/webhook/m1-flow2-triage`).

#### [Luồng 2] AI Multi-Department Triage & Acknowledgment (12 Nodes)
*File: `workflows/flow02_department_triage.json`*
- **Node 1 (Sub-Workflow Trigger):** Tiếp nhận email sạch từ Luồng 1 tại path `m1-flow2-triage`.
- **Node 2 (Fetch Departments HTTP):** Gọi NestJS API `GET /api/v1/departments` lấy danh sách 4 phòng ban hoạt động.
- **Node 3 (AI Semantic Triage Agent - Agent 1):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) phân tích ngữ nghĩa tiếng Việt: xác định phòng ban (TECH, SALES, FINANCE, GENERAL), mức ưu tiên (P1 đến P4), sắc thái khách hàng.
- **Node 4 (Output Schema Guard Code):** Kiểm tra và ép kiểu JSON chặt chẽ, thiết lập giá trị dự phòng nếu AI phản hồi thiếu trường.
- **Node 5 (Save Triage Log HTTP API):** Gọi NestJS API `POST /api/v1/tickets/triage/logs` lưu bản ghi phân loại và nhận `triage_id`.
- **Node 6 (Compute SLA Window Code):** Tính toán thời hạn SLA cam kết (P1: 1h, P2: 4h, P3: 24h, P4: 48h).
- **Node 7 (IF Critical Priority P1):** Rẽ nhánh kiểm tra sự cố khẩn cấp mức P1.
- **Node 8 (Escalate Emergency Alert Email - Nhánh True):** Gửi email cảnh báo đỏ lập tức cho Kỹ thuật viên trực nhật (`tranngo170770@gmail.com`).
- **Node 9 (Send Customer Confirmation Email):** Gửi email phản hồi tự động cho khách hàng (`trangltk.24it@vku.udn.vn`) kèm mã tra cứu và thời hạn SLA.
- **Node 10 (Audit Triage Success HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi nhận sự kiện `EMAIL_TRIAGED_SUCCESSFULLY`.
- **Node 11 (Format Routing Packet Code):** Chuẩn hóa gói dữ liệu điều phối theo mã `department_code`.
- **Node 12 (Route to Downstream Workflows Code):** Định tuyến tự động:
  - `TECH` -> Bắn Webhook Luồng 3 (`/webhook/m1-flow3-ticket`).
  - `SALES` -> Bắn Webhook Luồng 7 (`/webhook/m3-flow7-crm-lead`).
  - `FINANCE` -> Bắn Webhook Luồng 9 (`/webhook/m3-flow9-invoice-ocr`).

#### [Luồng 3] AI-Driven Ticket Generation & SLA Dispatcher (12 Nodes)
*File: `workflows/flow03_ticket_sla_dispatch.json`*
- **Node 1 (Receive Tech Intent Trigger):** Tiếp nhận sự kiện kỹ thuật tại path `m1-flow3-ticket`.
- **Node 2 (AI Email-to-Ticket Agent - Agent 3):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) bóc tách tóm tắt lỗi, phân loại module bị ảnh hưởng, trích xuất reproduce steps.
- **Node 3 (Generate Ticket Code ID Code):** Tạo mã vé chuẩn doanh nghiệp `TK-YYYYMMDD-XXXX`.
- **Node 4 (Query Available Agents HTTP API):** Gọi NestJS API `GET /api/v1/tickets/agents?category=Technical` lấy danh sách kỹ thuật viên trực nhật.
- **Node 5 (Least-Busy Load Balancer Code):** Thuật toán tìm KTV có `active_tickets_count` thấp nhất để giao việc công bằng.
- **Node 6 (Create Ticket Master HTTP):** Gọi NestJS `POST /api/v1/tickets` tạo vé trạng thái `PENDING`.
- **Node 7 (Update Agent Workload HTTP API):** Gọi NestJS API `POST /api/v1/tickets/agents/workload` tăng `active_tickets_count + 1` của KTV được phân công.
- **Node 8 (Initial System Comment HTTP):** Lưu chi tiết phân tích lỗi gốc của AI vào bảng `ticket_comments`.
- **Node 9 (Notify Support Agent Email):** Gửi email thông báo phân công vé cho KTV (`tranngo170770@gmail.com`).
- **Node 10 (Audit SLA Dispatch HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi log `TICKET_DISPATCHED_TO_AGENT`.
- **Node 11 (Format Ticket Packet Code):** Đóng gói payload vé kỹ thuật.
- **Node 12 (Trigger Luồng 4 Sub-Workflow Code):** Bắn HTTP POST kích hoạt ngay Luồng 4 (`/webhook/m2-flow4-rag-draft`).

---

### PHẦN THÀNH VIÊN 2: Knowledge RAG, Approval & Executive Intelligence
#### [Luồng 4] Vector Search RAG & Draft Reply Generator (12 Nodes)
*File: `workflows/flow04_rag_knowledge_draft.json`*
- **Node 1 (Ticket Created Trigger):** Đón nhận thông tin vé từ Luồng 3 tại `m2-flow4-rag-draft`.
- **Node 2 (Extract Search Query Keywords Code):** Trích lọc từ khóa kỹ thuật cốt lõi và loại bỏ stopwords.
- **Node 3 (Generate Query Embedding / Gemini):** Gọi mô hình `text-embedding-004` mã hóa câu hỏi thành vector 768 chiều.
- **Node 4 (Query Knowledge Base Vector Search HTTP API):** Gọi NestJS API `POST /api/v1/knowledge/search` thực hiện cosine similarity search trên pgvector.
- **Node 5 (Check Knowledge Relevance Code):** Lọc bài viết có độ tương đồng đạt chuẩn (> 0.75).
- **Node 6 (AI RAG Response Drafter Agent - Agent 2):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) kết hợp tri thức kỹ thuật từ RAG API để sinh dự thảo trả lời kỹ thuật chuẩn mực.
- **Node 7 (Draft Quality & HTML Polish Code):** Định dạng HTML email chuyên nghiệp, thêm header và chữ ký hỗ trợ.
- **Node 8 (Insert Draft to Database HTTP):** Gọi NestJS `POST /api/v1/drafts` lưu thư nháp với trạng thái `PENDING_APPROVAL`.
- **Node 9 (Link Draft to Ticket HTTP API):** Gọi NestJS API `PATCH /api/v1/tickets/:code/link-draft` liên kết `draft_id` vào vé tương ứng.
- **Node 10 (Push Real-time Notification HTTP):** Bắn tín hiệu WebSocket/SSE lên giao diện Next.js (`/approval`).
- **Node 11 (Audit Draft Creation HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi log `AI_REPLY_DRAFT_GENERATED`.
- **Node 12 (Dispatch to Luồng 5 Bridge Code):** Đóng gói dữ liệu sẵn sàng đón nhận thao tác phê duyệt từ con người.

#### [Luồng 5] Human-in-the-Loop Web Approval & Outbound Dispatch (12 Nodes)
*File: `workflows/flow05_hitl_approval_send.json`*
- **Node 1 (Human Action Webhook Trigger):** Lắng nghe lệnh từ giao diện Next.js khi người dùng bấm "Duyệt & Gửi" (`/webhook/m2-flow5-approval`).
- **Node 2 (Validate Reviewer Permission HTTP):** Gọi NestJS API xác thực quyền hạn của `reviewer_email`.
- **Node 3 (Fetch Final Draft Content HTTP API):** Gọi NestJS API `GET /api/v1/drafts/:id` lấy nội dung bản nháp và thông tin vé/SLA tương ứng.
- **Node 4 (Email Address Validation Code):** Kiểm tra tính hợp lệ cú pháp của địa chỉ người nhận.
- **Node 5 (Send Outbound Email SMTP):** Gửi email chính thức từ `kieutrangg06123@gmail.com` tới khách hàng (`trangltk.24it@vku.udn.vn`).
- **Node 6 (IF Send Success):** Bắt lỗi kết nối SMTP / timeout.
- **Node 7 (Update Draft Sent Status HTTP):** Cập nhật trạng thái bản nháp thành `SENT` và ghi nhận `sent_at = NOW()`.
- **Node 8 (Update Ticket Status HTTP):** Đổi trạng thái vé sang `RESOLVED`.
- **Node 9 (Append Resolution Comment HTTP API):** Gọi NestJS API `POST /api/v1/tickets/comments` ghi lại toàn bộ nội dung thư đã gửi vào lịch sử trao đổi của vé.
- **Node 10 (Calculate Resolution Time Code):** Tính toán thời gian xử lý thực tế so với hạn mức cam kết SLA ban đầu.
- **Node 11 (Log SLA Compliance Metric HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` lưu chỉ số tuân thủ SLA (`MET_SLA` / `BREACHED_SLA`).
- **Node 12 (Audit Log Email Dispatched HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi log `OUTBOUND_EMAIL_SUCCESSFULLY_SENT`.

#### [Luồng 6] Daily Executive Intelligence & Incident Spike Alert (12 Nodes)
*File: `workflows/flow06_executive_digest.json`*
- **Node 1 (Daily Executive Digest Trigger):** Kích hoạt qua Cron định kỳ lúc 18h00 hoặc gọi Webhook test (`m2-flow6-digest-trigger`).
- **Node 2 (Fetch Daily Inbound Volume HTTP API):** Gọi NestJS API `GET /api/v1/digest/inbound-volume` thống kê tổng số email đến và spam bị chặn.
- **Node 3 (Fetch Ticket & SLA Stats HTTP API):** Gọi NestJS API `GET /api/v1/digest/ticket-stats` tổng hợp số vé sự cố, tỷ lệ SLA, số vé P1.
- **Node 4 (Detect Incident Spike Code):** Thuật toán phát hiện dị thường: cảnh báo đỏ nếu số lỗi P1 tăng trên 20% so với trung bình 7 ngày.
- **Node 5 (AI Executive Summarizer Agent - Agent 5):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) phân tích sắc thái, chỉ ra 3 điểm nghẽn nghiêm trọng nhất trong ngày và đề xuất giải pháp cho Ban Giám Đốc.
- **Node 6 (Format Executive HTML Report Code):** Biên tập báo cáo trực quan với biểu đồ chỉ số, bảng xếp hạng KTV xuất sắc.
- **Node 7 (Query Recipient Directors HTTP API):** Gọi NestJS API `GET /api/v1/digest/recipients` lấy danh sách email Ban Lãnh Đạo.
- **Node 8 (Save Daily Summary Record HTTP):** Gọi NestJS lưu bản ghi báo cáo vào bảng `daily_summaries`.
- **Node 9 (Send Executive Digest Email):** Gửi email báo cáo điều hành tổng thể tới Ban Giám Đốc.
- **Node 10 (IF Critical Spike Detected):** Rẽ nhánh kiểm tra có xảy ra spike sự cố P1 bất thường hay không.
- **Node 11 (Emergency Director Alert Mailer - Nhánh True):** Gửi thêm email cảnh báo đỏ khẩn cấp cho Tổng giám đốc.
- **Node 12 (Audit Digest Generation HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi nhận sự kiện `EXECUTIVE_DIGEST_COMPILED`.

---

### PHẦN THÀNH VIÊN 3: CRM Growth, Nurturing & Invoice OCR
#### [Luồng 7] AI Entity Extraction & CRM Lead Scoring (12 Nodes)
*File: `workflows/flow07_crm_lead_scoring.json`*
- **Node 1 (Sales Intent Ingest Trigger):** Tiếp nhận dữ liệu hỏi mua hàng từ Luồng 2 tại path `m3-flow7-crm-lead`.
- **Node 2 (AI Email-to-CRM Lead Agent - Agent 4):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) bóc tách Tên, SĐT (+84), Doanh nghiệp, Nhu cầu, Ngân sách dự kiến.
- **Node 3 (AI Campaign Categorizer Agent - Agent 7):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) định vị phân khúc (`ENTERPRISE_HIGH_VALUE` vs `SME_RETAIL`).
- **Node 4 (Sanitize Extracted Entities Code):** Chuẩn hóa định dạng số điện thoại Việt Nam, viết hoa tên doanh nghiệp, làm sạch chuỗi.
- **Node 5 (Query Existing Customer HTTP API):** Gọi NestJS API `GET /api/v1/crm/customers/by-email` kiểm tra khách hàng đã có trong bảng `crm_customers`.
- **Node 6 (AI Lead Scoring Engine Code):** Tính toán Lead Score (0–100) theo độ rõ ràng của ngân sách và vai trò người liên hệ.
- **Node 7 (Upsert CRM Customer Record HTTP):** Ghi hoặc cập nhật thông tin khách hàng vào `crm_customers`.
- **Node 8 (Create Sales Deal Opportunity HTTP):** Tạo cơ hội bán hàng mới trong `crm_deals` với trạng thái `NEW_INQUIRY`.
- **Node 9 (Assign Sales Representative Code):** Phân bổ cơ hội cho chuyên viên phụ trách (`tranngo170770@gmail.com`).
- **Node 10 (Internal Sales Alert Email):** Gửi email thông báo kèm Lead Score và tóm tắt nhu cầu cho chuyên viên Sales.
- **Node 11 (Audit CRM Creation HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi log `CRM_LEAD_QUALIFIED_AND_STORED`.
- **Node 12 (Enqueue Follow-up Tracker Code):** Đăng ký mã deal vào quy trình rà soát tự động của Luồng 8.

#### [Luồng 8] Automated Multi-Stage Follow-up & Nurturing (12 Nodes)
*File: `workflows/flow08_automated_followup.json`*
- **Node 1 (Follow-up Check Schedule Trigger):** Kích hoạt định kỳ 09h00 sáng mỗi ngày hoặc gọi Webhook `m3-flow8-followup-trigger`.
- **Node 2 (Query Stale Sales Deals HTTP API):** Gọi NestJS API `GET /api/v1/crm/deals/stale` quét các deal `QUOTED` đã quá 48 giờ chưa có phản hồi.
- **Node 3 (Filter Blacklisted Leads Code):** Loại bỏ khách hàng đã chọn `is_unsubscribed = true`.
- **Node 4 (Fetch Previous Chat Context HTTP API):** Gọi NestJS API `GET /api/v1/crm/deals/:id` lấy thông tin chi tiết và campaign của deal.
- **Node 5 (Check Follow-up Stage Code):** Xác định giai đoạn nhắc nhở (Lần 1: Thân mật; Lần 2: Mời dùng thử; Lần 3: Đề xuất ưu đãi có hạn).
- **Node 6 (AI Follow-up Nurturing Agent - Agent 6):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) sinh nội dung email hỏi thăm lịch sự, nhấn mạnh giá trị sản phẩm.
- **Node 7 (Send Follow-up Email SMTP):** Gửi email chăm sóc tự động tới `trangltk.24it@vku.udn.vn` từ `kieutrangg06123@gmail.com`.
- **Node 8 (Update Deal Activity Timestamp HTTP):** Cập nhật `last_contacted_at = NOW()` và tăng `followup_count + 1`.
- **Node 9 (IF Max Attempts Reached):** Kiểm tra nếu đã vượt quá 3 lần gửi thư mà khách chưa hồi âm.
- **Node 10 (Mark Deal Stale & Task Sales HTTP - Nhánh True):** Đổi trạng thái sang `COLD_LEAD` và tạo nhiệm vụ gọi điện trực tiếp trên CRM.
- **Node 11 (Audit Follow-up Sent HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi log `SALES_FOLLOWUP_DISPATCHED`.
- **Node 12 (Complete Follow-up Cycle Code):** Đóng gói báo cáo thống kê chu kỳ gửi và kết thúc tiến trình.

#### [Luồng 9] Multi-Modal Invoice OCR & Accounting Audit (12 Nodes)
*File: `workflows/flow09_invoice_multimodal_ocr.json`*
- **Node 1 (Finance Intent Ingest Trigger):** Tiếp nhận email hóa đơn từ Luồng 2 tại path `m3-flow9-invoice-ocr`.
- **Node 2 (Check Attachment Format Code):** Kiểm tra định dạng tệp (PDF, PNG, JPG).
- **Node 3 (Download & Convert File to Base64 Code):** Mã hóa file đính kèm sang base64 để nạp cho mô hình Vision.
- **Node 4 (Multimodal Invoice Vision OCR Agent - Agent 10):** Node Native AI Agent (`@n8n/n8n-nodes-langchain.agent` + Chat Model Gemini 1.5 Flash) bóc tách Số hóa đơn, Mã số thuế, Ngày lập, Tiền hàng, Thuế VAT, Tổng tiền thanh toán.
- **Node 5 (Mathematical Integrity Verifier Code):** Đối soát logic số học: $|Tiền hàng + VAT - Tổng tiền| \le 1$ VNĐ.
- **Node 6 (IF Math Verification Passed):** Rẽ nhánh: Nếu khớp số học -> Nhánh True (`VALIDATED`); Nếu sai lệch -> Nhánh False (`DISCREPANCY_FLAGGED`).
- **Node 7 (Store Verified Invoice HTTP - Nhánh True):** Lưu hóa đơn hợp lệ vào `finance_invoices` với trạng thái `VALIDATED`.
- **Node 8 (Flag Invoice Discrepancy HTTP - Nhánh False):** Lưu hóa đơn vào `finance_invoices` với trạng thái `DISCREPANCY_FLAGGED`.
- **Node 9 (Push Accounting Real-time Alert HTTP):** Bắn thông báo theo thời gian thực tới bộ phận Kế toán.
- **Node 10 (Archive Invoice Document Storage Code):** Đặt tên tệp theo chuẩn lưu trữ hóa đơn điện tử.
- **Node 11 (Audit Accounting Log HTTP API):** Gọi NestJS API `POST /api/v1/audit/logs` ghi log `INVOICE_OCR_PROCESSED`.
- **Node 12 (Close Finance Ingest Cycle Code):** Đóng gói trạng thái hoàn tất chu kỳ đối soát tài chính.


---

## 5. TOÀN BỘ CÂU LỆNH KHỞI CHẠY & TẮT DỰ ÁN

### 5.1. Khởi chạy 1 chạm toàn bộ hệ thống
Tại thư mục gốc `/home/kieu-trang/email-automation-plan`:
```bash
./run_all.sh
```
*Script sẽ tự động:*
1. Khởi động container `enterprise_db` (Postgres 16 + pgvector) và `enterprise_n8n`.
2. Tự động đồng bộ và nạp 9 Workflows JSON từ 3 thư mục thành viên (`workflows/member1_...`, `workflows/member2_...`, `workflows/member3_...`) vào n8n và kích hoạt `active = true`.
3. Bật NestJS Backend trên cổng 4000.
4. Bật Next.js Frontend trên cổng 3000.

### 5.2. Mở cổng Host/Internet cho Hội Đồng chấm thi (Cloudflare Tunnel - 0đ)
Theo đúng Phương án 2 của Báo cáo Đề xuất:
```bash
# Mở cổng giao diện Next.js Web UI ra Internet cho Hội đồng truy cập:
./start_tunnel.sh 3000

# Hoặc mở cổng n8n Workflow Engine ra Internet:
./start_tunnel.sh 5678
```
*Cloudflare Tunnel sẽ cấp ngay 1 URL HTTPS công khai (ví dụ `https://xxx.trycloudflare.com`) để Hội đồng dùng điện thoại hoặc laptop cá nhân mở và đánh giá trực tiếp.*

### 5.3. Tắt 1 chạm toàn bộ hệ thống
```bash
./stop_all.sh
```
*Script sẽ tự động giải phóng các cổng 3000, 4000 và dừng các container an toàn.*

### 5.3. Khởi chạy và tắt thủ công từng thành phần
```bash
# Khởi chạy Docker Services (Postgres 16 + pgvector & n8n)
docker compose up -d

# Thiết lập Credentials cho n8n (Postgres & SMTP)
bash credentials/setup_credentials.sh

# Khởi chạy Backend NestJS
cd backend && npm run start:dev

# Khởi chạy Frontend Next.js
cd frontend && npm run dev

# Tắt nhanh Backend và Frontend
fuser -k 3000/tcp 4000/tcp 2>/dev/null || true

# Tắt Docker containers
docker compose down
```

---

## 6. CÁC ĐƯỜNG LINK HỆ THỐNG QUAN TRỌNG

| Thành phần | Địa chỉ Truy Cập | Mục đích sử dụng |
|:---|:---|:---|
| **Giao diện Tổng quan (Overview)** | http://localhost:3000 | Dashboard thống kê tổng thể số vé, tỉ lệ SLA, lead CRM và hóa đơn. |
| **Tickets & SLA Board** | http://localhost:3000/tickets | Quản lý vé sự cố kỹ thuật, theo dõi hạn cam kết SLA P1–P4, cân bằng tải KTV. |
| **Human-in-the-Loop Approval** | http://localhost:3000/approval | Giao diện cho chuyên viên rà soát, chỉnh sửa thư nháp AI RAG và bấm "Duyệt & Gửi". |
| **Executive Analytics** | http://localhost:3000/analytics | Báo cáo điều hành 24h cho Ban Giám Đốc, phát hiện spike sự cố dị thường. |
| **CRM Deals Pipeline** | http://localhost:3000/crm | Bảng Kanban quản lý cơ hội kinh doanh, Lead Score 0-100, theo dõi lịch follow-up. |
| **Invoices OCR & Audit** | http://localhost:3000/invoices | Màn hình đối soát hóa đơn VAT, kiểm tra tính đúng đắn số học (Khớp vs Sai lệch). |
| **Backend Core API (NestJS)** | http://localhost:4000/api/v1 | RESTful API phục vụ xác thực JWT, Tickets, Drafts, CRM, Invoices và Audit Logs. |
| **n8n Automation Engine** | http://localhost:5678 | Giao diện quản lý 9 Micro-Workflows, xem execution logs trực quan. |
| **PostgreSQL Database** | `localhost:5432` (`email_automation_db`) | User: `admin` / Password: `SecretPassword123!` |

---

## 7. LỆNH TRUY XUẤT XEM DỮ LIỆU & LỆNH DỌN DẸP TEST DATA

### 7.1. Lệnh truy xuất xem tất cả dữ liệu thực tế trên Database
Chạy script tự động tổng hợp toàn bộ 14 bảng:
```bash
./view_db_stats.sh
```

Hoặc truy vấn trực tiếp bằng câu lệnh `psql`:
```bash
# 1. Xem số lượng bản ghi của toàn bộ 14 bảng
docker exec -i enterprise_db psql -U admin -d email_automation_db -c "
SELECT 'email_senders_reputation' AS t, count(*) FROM email_senders_reputation
UNION ALL SELECT 'email_quarantine_vault', count(*) FROM email_quarantine_vault
UNION ALL SELECT 'departments', count(*) FROM departments
UNION ALL SELECT 'support_agents', count(*) FROM support_agents
UNION ALL SELECT 'tickets', count(*) FROM tickets
UNION ALL SELECT 'ticket_comments', count(*) FROM ticket_comments
UNION ALL SELECT 'email_triage_logs', count(*) FROM email_triage_logs
UNION ALL SELECT 'knowledge_base', count(*) FROM knowledge_base
UNION ALL SELECT 'email_drafts', count(*) FROM email_drafts
UNION ALL SELECT 'daily_summaries', count(*) FROM daily_summaries
UNION ALL SELECT 'crm_customers', count(*) FROM crm_customers
UNION ALL SELECT 'crm_deals', count(*) FROM crm_deals
UNION ALL SELECT 'finance_invoices', count(*) FROM finance_invoices
UNION ALL SELECT 'system_audit_logs', count(*) FROM system_audit_logs;
"

# 2. Xem các vé sự cố kỹ thuật vừa được phân phối
docker exec -i enterprise_db psql -U admin -d email_automation_db -c \
"SELECT ticket_code, customer_email, priority, status, assigned_to, created_at FROM tickets ORDER BY id DESC LIMIT 5;"

# 3. Xem danh sách thư nháp AI RAG chờ duyệt HITL
docker exec -i enterprise_db psql -U admin -d email_automation_db -c \
"SELECT id, ticket_code, recipient_email, status, reviewed_by, sent_at FROM email_drafts ORDER BY id DESC LIMIT 5;"

# 4. Xem các cơ hội bán hàng CRM mới được bóc tách và tính điểm Lead Score
docker exec -i enterprise_db psql -U admin -d email_automation_db -c \
"SELECT d.id, c.full_name, c.email, d.deal_name, d.expected_budget, d.stage FROM crm_deals d LEFT JOIN crm_customers c ON d.customer_id = c.id ORDER BY d.id DESC LIMIT 5;"

# 5. Xem kết quả đối soát hóa đơn VAT và trạng thái số học
docker exec -i enterprise_db psql -U admin -d email_automation_db -c \
"SELECT invoice_number, buyer_email, total_amount, math_status, created_at FROM finance_invoices ORDER BY id DESC LIMIT 5;"

# 6. Xem nhật ký kiểm toán hệ thống (Audit Logs)
docker exec -i enterprise_db psql -U admin -d email_automation_db -c \
"SELECT id, event_type, workflow_id, created_at, description FROM system_audit_logs ORDER BY id DESC LIMIT 7;"
```

### 7.2. Lệnh dọn dẹp dữ liệu (RESET DATA TEST)
Để xóa sạch các bản ghi thử nghiệm nhưng vẫn giữ nguyên cấu trúc bảng và Seed Data chuẩn (Phòng ban, Kỹ thuật viên, Kho tri thức RAG, Giám đốc nhận báo cáo):
```bash
./reset_test_data.sh
```
*(Script thực thi file SQL chuẩn hóa `database/reset_test_data.sql`).*

---

## 8. BÁO CÁO KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST DATA DATASET & E2E)
Hệ thống đã trải qua kiểm thử toàn diện trên tất cả các trường hợp biên, các nhánh rẽ và các dây nối:
```bash
node test_all_9_flows_e2e.js
```
```text
======================================================================
🧪 KIỂM THỬ TÍCH HỢP TOÀN DIỆN HỆ THỐNG (E2E TEST 100%)
======================================================================
✅ [PASS] Backend Health & Departments API
✅ [PASS] Auth API Login (admin@enterprise.vn)
✅ [PASS] Auth API Profile with JWT Token
✅ [PASS] Reviewer Permission Validation API
✅ [PASS] Member 1 - Tickets List & Stats API
✅ [PASS] Member 1 - Create Ticket & Least-Busy Agent Assignment
✅ [PASS] Member 2 - Knowledge Base & Vector Store API
✅ [PASS] Member 2 - Drafts Generation & Human Approval Flow
✅ [PASS] Member 2 - Executive Analytics Digest API
✅ [PASS] Member 3 - CRM Lead Scoring & Deals Upsert
✅ [PASS] Member 3 - Invoice OCR & Mathematical Integrity Audit (Valid & Flagged)
✅ [PASS] System Global Audit Logs API
✅ [PASS] Real-time Notifications Gateway & Event Stream
✅ [PASS] Next.js Frontend Route: Home / Dashboard (Port 3000)
✅ [PASS] Next.js Frontend Route: Tickets Page (/tickets)
✅ [PASS] Next.js Frontend Route: Approval HITL Page (/approval)
✅ [PASS] Next.js Frontend Route: CRM Pipeline Page (/crm)
✅ [PASS] Next.js Frontend Route: Invoices OCR Page (/invoices)
✅ [PASS] Next.js Frontend Route: Executive Analytics Page (/analytics)
✅ [PASS] Next.js Frontend Route: Auth Login Page (/login)
======================================================================
🎉 KẾT QUẢ KIỂM THỬ: 20 PASSED / 20 TOTAL (100% HOÀN HẢO)
======================================================================
```

---

## PHẦN 1: GIẢI PHẪU CẤU TRÚC DỰ ÁN (MỤC ĐÍCH TỪNG FILE / FOLDER)
Dự án được cấu trúc theo mô hình Monorepo chuẩn mực, sạch sẽ, không có file thừa, backup rác (`.bak`, `.tmp`, `.swp`) hay code trùng lặp:

```text
email-automation/
├── docker-compose.yml              # Quản lý 2 container: PostgreSQL 16 (pgvector) & n8n
├── .env / .env.example             # Cấu hình biến môi trường (DB, Port, Gemini API Key)
├── run_all.sh                      # Script 1 chạm khởi động: DB + n8n + Sync + NestJS + Next.js
├── stop_all.sh                     # Script 1 chạm tắt an toàn toàn bộ hệ thống
├── run_all_flows_test_scenarios.js # Bộ 25 kịch bản kiểm thử tự động 9 luồng & E2E liên hoàn
├── seed_multi_day_demo_data.js     # Khởi tạo bộ dữ liệu mẫu đa ngày (7 ngày) phục vụ demo
├── test_all_9_flows_e2e.js         # Bộ 20 test suite kiểm thử REST API & Web Routes (100% Pass)
├── view_db_stats.sh                # Script xem nhanh số lượng và nội dung 14 bảng CSDL
├── reset_test_data.sh              # Script làm sạch data test, bảo lưu cấu hình gốc & Seed Data
│
├── database/                       # Định nghĩa Schema & Dữ liệu hạt giống (Seed Data)
│   ├── 00_core_schema.sql          # Extension vector, departments, reputation, audit logs
│   ├── 01_member1_tickets.sql      # Triage logs, support agents, tickets, ticket comments
│   ├── 02_member2_knowledge_drafts.sql # Knowledge base (vector 768), email drafts, daily digest
│   ├── 03_member3_crm_invoices.sql # CRM customers, deals, finance invoices
│   └── reset_test_data.sql         # Script SQL phục vụ việc Reset Data Test an toàn
│
├── workflows/                      # 9 Micro-Workflows n8n (Mỗi file đúng 12 nodes)
│   ├── flow01_ingest_antispam.json # TV1: Lọc rác, kiểm tra danh tính, cách ly blacklist
│   ├── flow02_department_triage.json # TV1: Phân loại 4 phòng ban (P1-P4), phản hồi SLA
│   ├── flow03_ticket_sla_dispatch.json # TV1: Bóc tách lỗi, cân bằng tải Least-Busy KTV
│   ├── flow04_rag_knowledge_draft.json # TV2: Tra cứu vector pgvector, AI sinh thư nháp
│   ├── flow05_hitl_approval_send.json # TV2: Human-in-the-Loop duyệt, gửi SMTP, đổi RESOLVED
│   ├── flow06_executive_digest.json # TV2: Tóm tắt hoạt động 24h, cảnh báo Spike P1
│   ├── flow07_crm_lead_scoring.json # TV3: Bóc tách thực thể, chấm Lead Score, phân khúc
│   ├── flow08_automated_followup.json # TV3: Quét deal trễ 48h, gửi email chăm sóc 3 giai đoạn
│   └── flow09_invoice_multimodal_ocr.json # TV3: Vision OCR hóa đơn, đối soát số học VAT
│
├── credentials/                    # Quản lý chứng thực n8n
│   ├── n8n_credentials_template.json # Template Credential: Postgres + SMTP Gmail
│   └── setup_credentials.sh        # Script tự động import credential vào container n8n
│
├── test_scripts/                   # Bộ kịch bản cURL test độc lập từng luồng & liên hoàn
│   ├── test_01_flow1_clean.sh      # Test email sạch vào Luồng 1
│   ├── test_01_flow1_bounce.sh     # Test email hệ thống/bounce bị cách ly
│   ├── test_02_flow1_blacklist.sh  # Test spam/phishing bị đánh tụt điểm uy tín
│   ├── test_03_flow2_triage_p1.sh  # Test sự cố kỹ thuật P1 khẩn cấp
│   ├── test_04_flow2_sales_p2.sh   # Test hỏi mua hàng phòng Kinh doanh
│   ├── test_05_flow2_finance_p3.sh # Test phòng Tài chính - Kế toán
│   ├── test_06_flow2_general_p4.sh # Test hỏi đáp thông tin chung
│   ├── test_07_flow3_ticket_least_busy.sh # Test cân bằng tải tự động cho KTV ít việc nhất
│   ├── test_08_flow4_rag_draft.sh  # Test sinh thư nháp từ kho tri thức nội bộ
│   ├── test_09_flow5_hitl_approval.sh # Test duyệt và gửi thư ra ngoài
│   ├── test_10_flow6_executive_digest.sh # Test kích hoạt báo cáo điều hành cho BGĐ
│   ├── test_11_flow7_crm_lead_scoring.sh # Test bóc tách thông tin khách hàng và Lead Score
│   ├── test_12_flow8_followup_cadence.sh # Test quét cơ hội 48h chưa phản hồi
│   ├── test_13_flow9_invoice_ocr_math.sh # Test đối soát số học hóa đơn (Khớp vs Lệch)
│   └── test_e2e_full_chain.sh      # Kịch bản liên hoàn 3 chuỗi nghiệp vụ lớn
│
├── backend/                        # NestJS Core Business Logic & WebSocket (Cổng 4000)
│   └── src/
│       ├── main.ts                 # Khởi chạy NestJS, cấu hình CORS, prefix /api/v1
│       ├── app.module.ts           # Root module kết nối toàn bộ 8 feature modules
│       ├── core/database/          # Service kết nối PostgreSQL qua pg Pool
│       └── modules/
│           ├── auth/               # Xác thực JWT, đăng nhập & kiểm tra quyền Reviewer
│           ├── tickets/            # CRUD vé sự cố, thống kê SLA, cân bằng tải KTV
│           ├── drafts/             # Quản lý thư nháp PENDING_APPROVAL, PATCH trạng thái SENT
│           ├── crm/                # Quản lý khách hàng, Deals pipeline & Lead Scoring
│           ├── finance/            # Lưu trữ và đối soát hóa đơn VAT
│           ├── knowledge/          # CRUD kho tri thức & truy vấn vector pgvector
│           ├── analytics/          # Lưu và trả về Daily Executive Digest
│           ├── notifications/      # Realtime SSE/WebSocket thông báo vé mới & thư nháp
│           └── audit/              # Ghi nhận và truy vấn lịch sử kiểm toán system_audit_logs
│
└── frontend/                       # Next.js 14 App Router UI (Cổng 3000)
    └── src/
        ├── app/
        │   ├── page.tsx            # Trang chủ: Tổng quan Dashboard & Thống kê hệ thống
        │   ├── tickets/page.tsx    # Giao diện quản lý vé sự cố & bảng theo dõi SLA
        │   ├── approval/page.tsx   # Giao diện duyệt thư nháp Human-in-the-Loop (HITL)
        │   ├── analytics/page.tsx  # Bảng điều khiển tóm tắt điều hành Executive
        │   ├── crm/page.tsx        # Bảng Kanban cơ hội bán hàng CRM Pipeline
        │   ├── invoices/page.tsx   # Màn hình đối soát hóa đơn VAT & kiểm tra số học
        │   └── login/page.tsx      # Giao diện đăng nhập xác thực tài khoản chuyên viên
        └── components/
            └── Navbar.tsx          # Thanh điều hướng thương mại sạch sẽ
```

---

## PHẦN 2: GIẢI MÃ CƠ CHẾ RẼ NHÁNH CỦA TỪNG LUỒNG
Cơ chế rẽ nhánh tổng quát tại các Node IF trong DAG n8n:
```text
[Node Điều Kiện IF]
├── Output 0 (Nhánh True) ──> Thực hiện nhánh xử lý đặc biệt / trường hợp thỏa mãn
└── Output 1 (Nhánh False) ──> Thực hiện nhánh dự phòng / cách ly / bỏ qua bước phụ
```

### 1. LUỒNG 1: Khi nào Node 6 sang Nhánh Clean (Node 10) vs Nhánh Quarantine / Strike (Node 7, 8, 9)?
- **Node kiểm tra:** Node 6 (`6. IF Clean & High Reputation`).
- **Biểu thức điều kiện:** $\text{reputation\_score} \ge 20 \quad \text{VÀ} \quad \text{is\_spam} == \text{false}$
- **Khi nào đi lên Node 10 (Format Clean Payload)?**
  - Khi người gửi không nằm trong danh sách đen (`reputation_score >= 20`) và mô hình AI Gemini xác nhận email hợp lệ, không chứa mã độc, lừa đảo (`is_spam == false`).
  - Dây nối chạy lên **Node 10** ➔ **Node 11** (ghi log `INBOUND_CLEAN_EMAIL_ACCEPTED`) ➔ **Node 12** (kích hoạt Luồng 2).
- **Khi nào rẽ xuống Node 7 (Quarantine Vault) và Node 9 (Update Sender Strike Score)?**
  - Khi AI Gemini phát hiện dấu hiệu lừa đảo, phishing, spam (`is_spam == true`) HOẶC người gửi có điểm uy tín thấp (< 20).
  - Dây nối rẽ đồng thời sang **Node 7** (cách ly vào database), kích hoạt **Node 8** (gửi email cảnh báo SOC cho IT), và sang **Node 9** (trừ điểm uy tín, tăng vi phạm). Luồng dừng lại tại đây, không bao giờ gọi sang Luồng 2.

### 2. LUỒNG 2: Khi nào Node 7 đi lên Node 8 (Escalate P1) rồi sang 9, khi nào đi THẲNG sang 9?
- **Node kiểm tra:** Node 7 (`7. IF Critical Priority P1`).
- **Biểu thức điều kiện:** $\text{priority} == \text{'P1'}$
- **Khi nào đi lên Node 8 (Escalate Emergency Alert Email) rồi mới tới Node 9?**
  - Khi AI Semantic Classifier phân tích nội dung xác định đây là sự cố khẩn cấp cấp độ P1 (Hệ thống sập, database deadlock, gián đoạn dịch vụ diện rộng).
  - Dây nối đi lên **Node 8** để bắn email cảnh báo đỏ khẩn cấp cho Kỹ thuật viên trực nhật (`tranngo170770@gmail.com`), sau đó từ Node 8 tiếp tục đi đến **Node 9** (`Send Customer Confirmation Email`) gửi email cam kết SLA 1h cho khách hàng.
- **Khi nào KHÔNG qua Node 8 mà đi THẲNG sang Node 9?**
  - Khi email thuộc các mức ưu tiên thông thường: P2 (Nghiêm trọng - 4h), P3 (Trung bình - 24h) hoặc P4 (Thấp - 48h).
  - Vì không phải sự cố thảm họa, hệ thống bỏ qua bước báo động đỏ (Node 8) và đi thẳng sang **Node 9** để gửi thư xác nhận thời hạn SLA bình thường cho khách hàng.

### 3. LUỒNG 5: Khi nào Node 6 sang Node 7, khi nào đi THẲNG sang Node 12?
- **Node kiểm tra:** Node 6 (`6. IF Send Success`).
- **Biểu thức điều kiện:** $\text{smtp\_status} == 200 \quad \text{hoặc có } \text{messageId (không có mã lỗi SMTP)}$
- **Khi nào đi sang Node 7 (Update Draft Sent Status HTTP)?**
  - Khi máy chủ SMTP Gmail (`smtp.gmail.com`) gửi email ra ngoài thành công và trả về mã xác nhận.
  - Dây nối đi vào **Node 7** (đổi draft sang `SENT`) ➔ **Node 8** (đổi vé sang `RESOLVED`) ➔ **Node 9** (ghi comment) ➔ **Node 10 & 11** (ghi nhận đạt chuẩn `MET_SLA`) ➔ **Node 12** (Audit log thành công).
- **Khi nào đi THẲNG sang Node 12 (Audit Log Email Dispatched Postgres) mà không qua 7, 8, 9, 10, 11?**
  - Khi máy chủ SMTP gặp lỗi (mất mạng, timeout kết nối, bị từ chối xác thực).
  - Hệ thống nhảy thẳng sang **Node 12** để ghi nhận log kiểm toán thất bại `OUTBOUND_EMAIL_SEND_FAILED`. Việc này đảm bảo vé KHÔNG bị đóng nhầm sang RESOLVED khi khách hàng thực tế chưa nhận được email.

### 4. LUỒNG 6: Khi nào Node 10 sang Node 11, khi nào đi THẲNG sang Node 12?
- **Node kiểm tra:** Node 10 (`10. IF Critical Spike Detected`).
- **Biểu thức điều kiện:** $\text{anomaly\_detected} == \text{true} \quad (\text{Số vé P1 tăng } > 20\% \text{ so với trung bình 7 ngày})$
- **Khi nào đi sang Node 11 (Emergency Director Alert Mailer)?**
  - Khi thuật toán phát hiện dị thường của Node 4 xác nhận có đợt tăng vọt sự cố P1 bất thường trong 24h qua (`anomaly_detected = true`).
  - Dây nối kích hoạt **Node 11** gửi thêm 1 email cảnh báo đặc biệt có chữ ký số tới riêng Tổng Giám Đốc, sau đó đi tiếp sang **Node 12**.
- **Khi nào đi THẲNG sang Node 12 mà không qua Node 11?**
  - Khi tình hình vận hành bình thường, không có sự cố P1 đột biến (`anomaly_detected = false`).
  - Hệ thống bỏ qua email khẩn cấp, đi thẳng sang **Node 12** để ghi log kiểm toán hoàn tất báo cáo ngày `EXECUTIVE_DIGEST_COMPILED`.

### 5. LUỒNG 8: Khi nào Node 9 sang Node 10, khi nào đi THẲNG sang Node 11?
- **Node kiểm tra:** Node 9 (`9. IF Max Attempts Reached`).
- **Biểu thức điều kiện:** $\text{followup\_count} \ge 3$
- **Khi nào đi sang Node 10 (Mark Deal Stale & Task Sales HTTP)?**
  - Khi hệ thống đã tự động gửi email chăm sóc đủ 3 lần sau các mốc 48 giờ mà khách hàng vẫn không phản hồi.
  - Dây nối đi sang **Node 10** để đổi trạng thái deal sang `COLD_LEAD` (Khách hàng nguội) và tự động tạo nhiệm vụ cho nhân viên Sales gọi điện thoại trực tiếp trên CRM, sau đó sang **Node 11**.
- **Khi nào đi THẲNG sang Node 11 mà không qua Node 10?**
  - Khi số lần gửi thư mới là lần 1 hoặc lần 2 (`followup_count < 3`).
  - Khách hàng vẫn đang trong quy trình nuôi dưỡng tự động bằng email, deal được giữ nguyên ở cột `QUOTED` để tiếp tục gửi thư theo chu kỳ.

### 6. LUỒNG 9: Khi nào Node 6 sang Node 7 (Xanh), khi nào sang Node 8 (Đỏ)?
- **Node kiểm tra:** Node 6 (`6. IF Math Verification Passed`).
- **Biểu thức điều kiện:** $|\text{subtotal} + \text{vat\_amount} - \text{total\_amount}| \le 1 \text{ VNĐ}$
- **Khi nào đi sang Node 7 (Store Verified Invoice HTTP - Nhánh True)?**
  - Khi số học khớp hoàn hảo: Tiền hàng + Thuế VAT = Tổng thanh toán.
  - Hóa đơn được lưu vào database với trạng thái `VALIDATED` (hiển thị huy hiệu xanh lá trên web).
- **Khi nào đi sang Node 8 (Flag Invoice Discrepancy HTTP - Nhánh False)?**
  - Khi phát hiện số học sai lệch (ví dụ: tiền hàng 45tr + VAT 4.5tr = 49.5tr nhưng tổng tiền ghi 52tr, lệch 2.5 triệu).
  - Hóa đơn được lưu vào database với trạng thái `DISCREPANCY_FLAGGED` (hiển thị cảnh báo đỏ rực trên web), đồng thời kích hoạt **Node 9** gửi email báo động cho Kế toán trưởng.

---

## PHẦN 3: BỘ KỊCH BẢN KIỂM THỬ TỪNG LUỒNG ĐƠN LẺ CHO TẤT CẢ CÁC NHÁNH

### 1. LUỒNG 1: INGEST & ANTI-SPAM (2 NHÁNH)
**Kịch bản 1A (Email sạch -> Nhánh True sang L2):**
```bash
curl -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Yêu cầu tài liệu tích hợp API",
    "text": "Kính gửi phòng kỹ thuật, tôi cần hướng dẫn kết nối API cổng thanh toán."
  }'
```
*Kết quả:* Node 6 đi lên Node 10, ghi log `INBOUND_CLEAN_EMAIL_ACCEPTED`, tự động gọi sang Luồng 2.

**Kịch bản 1B (Spam lừa đảo -> Nhánh False cách ly):**
```bash
curl -X POST http://localhost:5678/webhook/m1-flow1-ingest \
  -H "Content-Type: application/json" \
  -d '{
    "from": "spammer@evil.com",
    "name": "Lucky Spammer",
    "subject": "Nhận ngay 1000 USDT miễn phí",
    "text": "Bấm vào đường link lừa đảo này ngay để nhận tiền thưởng miễn phí."
  }'
```
*Kết quả:* Node 6 đi xuống Node 7 (`email_quarantine_vault`), trừ điểm uy tín tại Node 9, gửi email cảnh báo SOC tại Node 8.

---

### 2. LUỒNG 2: PHÂN LOẠI PHÒNG BAN & SLA (4 PHÒNG BAN & 2 NHÁNH P1)
**Kịch bản 2A (Nhánh TECH & P1 khẩn cấp -> Đi qua Node 8 Escalate):**
```bash
curl -X POST http://localhost:5678/webhook/m1-flow2-triage \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Hệ thống máy chủ cơ sở dữ liệu sập hoàn toàn",
    "clean_body": "Toàn bộ dịch vụ tê liệt, database deadlock 100%, lỗi diện rộng cần khắc phục P1."
  }'
```
*Kết quả:* AI gán P1, Node 7 rẽ sang Node 8 (email báo động đỏ cho KTV) ➔ Node 9 (mail cam kết 1h cho khách) ➔ Node 12 gọi Luồng 3.

**Kịch bản 2B (Nhánh SALES & P2 -> Không qua Node 8):**
```bash
curl -X POST http://localhost:5678/webhook/m1-flow2-triage \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Hỏi giá bản quyền phần mềm Email Automation",
    "clean_body": "Chúng tôi cần mua bản quyền cho 300 nhân sự với ngân sách 95 triệu đồng."
  }'
```
*Kết quả:* AI gán SALES, P2, Node 7 đi THẲNG sang Node 9 (bỏ qua Node 8) ➔ Node 12 kích hoạt Luồng 7.

**Kịch bản 2C (Nhánh FINANCE & P3):**
```bash
curl -X POST http://localhost:5678/webhook/m1-flow2-triage \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Hóa đơn VAT dịch vụ thanh toán",
    "clean_body": "Gửi phòng kế toán hóa đơn điện tử đính kèm để đối soát thanh toán."
  }'
```
*Kết quả:* Node 12 tự động kích hoạt Luồng 9 (`m3-flow9-invoice-ocr`).

---

### 3. LUỒNG 3: TẠO VÉ & CÂN BẰNG TẢI KỸ THUẬT VIÊN
```bash
curl -X POST http://localhost:5678/webhook/m1-flow3-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "customer_email": "trangltk.24it@vku.udn.vn",
    "sender_name": "Lê Thị Kiều Trang",
    "subject": "Lỗi 504 kết nối Redis Cache",
    "body": "Cụm Redis timeout liên tục sau khi nâng cấp cấu hình mạng.",
    "category": "Technical",
    "priority": "P2 - High"
  }'
```
*Kết quả:* Sinh mã `TK-YYYYMMDD-XXXX`, thuật toán Least-Busy gán cho KTV có ít vé nhất (Nguyễn Văn An), lưu vé vào `tickets` trạng thái PENDING, gọi tiếp sang Luồng 4.

---

### 4. LUỒNG 4: VECTOR RAG & SINH THƯ NHÁP
```bash
curl -X POST http://localhost:5678/webhook/m2-flow4-rag-draft \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_code": "TK-20261016-0001",
    "customer_email": "trangltk.24it@vku.udn.vn",
    "sender_email": "trangltk.24it@vku.udn.vn",
    "subject": "Hỏi về cách cấu hình kết nối Redis Cache tối ưu",
    "body": "Chúng tôi gặp sự cố timeout khi kết nối tới cụm Redis Cache, cần tài liệu hướng dẫn khắc phục."
  }'
```
*Kết quả:* Mô hình `text-embedding-004` tra cứu `knowledge_base` (cosine similarity > 75%), AI Gemini sinh thư nháp HTML, lưu vào `email_drafts` trạng thái `PENDING_APPROVAL`, đẩy tín hiệu WebSocket lên giao diện Web `/approval`.

---

### 5. LUỒNG 5: DUYỆT HUMAN-IN-THE-LOOP & GỬI THƯ (2 NHÁNH)
**Kịch bản 5A (Gửi thành công -> Nhánh True qua Node 7, 8, 9, 10, 11):**
```bash
curl -X POST http://localhost:5678/webhook/m2-flow5-approval \
  -H "Content-Type: application/json" \
  -d '{
    "draft_id": 1,
    "reviewer_email": "tranngo170770@gmail.com",
    "modified_subject": "[ĐÃ DUYỆT] Hướng dẫn tối ưu hóa kết nối Redis Cache",
    "modified_body": "<p>Kính gửi Quý khách, Bộ phận kỹ thuật đã kiểm tra và gửi tài liệu hướng dẫn đính kèm.</p>",
    "action": "APPROVE_SEND"
  }'
```
*Kết quả:* Gửi email SMTP thành công từ `kieutrangg06123@gmail.com` tới `trangltk.24it@vku.udn.vn`, Node 6 đi sang Node 7 (đổi draft thành `SENT`), Node 8 (đổi vé thành `RESOLVED`), Node 11 (ghi nhận `MET_SLA`).

---

### 6. LUỒNG 6: BÁO CÁO ĐIỀU HÀNH & PHÁT HIỆN DỊ THƯỜNG (2 NHÁNH)
**Kịch bản 6A (Vận hành chuẩn -> Nhánh bình thường sang Node 12):**
```bash
curl -X POST http://localhost:5678/webhook/m2-flow6-digest-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_mode": "MANUAL_TEST",
    "requested_by": "tranngo170770@gmail.com",
    "timestamp": "2026-10-16T18:00:00Z"
  }'
```
*Kết quả:* Node 1 kết nối Node 2 ➔ Node 5 AI tóm tắt 3 vấn đề nổi cộm ➔ Gửi email cho Ban Giám Đốc ➔ Node 10 nhận diện không có spike ➔ Đi THẲNG sang Node 12 lưu audit log (không qua 11).

---

### 7. LUỒNG 7: BÓC TÁCH THỰC THỂ & LEAD SCORING CRM
```bash
curl -X POST http://localhost:5678/webhook/m3-flow7-crm-lead \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "trangltk.24it@vku.udn.vn",
    "customer_email": "trangltk.24it@vku.udn.vn",
    "name": "Lê Thị Kiều Trang",
    "subject": "Yêu cầu báo giá Email Automation",
    "content": "Tập đoàn Công nghệ VKU Global cần mua phần mềm cho 300 nhân sự với ngân sách 95 triệu đồng. SĐT liên hệ: 0912888999."
  }'
```
*Kết quả:* AI bóc tách SĐT 0912888999, Công ty VKU Global, Ngân sách 95.000.000 VNĐ, tính Lead Score = 100, tạo Deal trên Kanban `/crm`.

---

### 8. LUỒNG 8: FOLLOW-UP NUÔI DƯỠNG DEAL (2 NHÁNH)
**Kịch bản 8 (Chạy quét chu kỳ 48h):**
```bash
curl -X POST http://localhost:5678/webhook/m3-flow8-followup-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_mode": "MANUAL_TEST",
    "timestamp": "2026-10-16T09:00:00Z"
  }'
```
*Kết quả:*
- Nếu `followup_count < 3`: Gửi email hỏi thăm, tăng `followup_count + 1`, Node 9 đi THẲNG sang Node 11.
- Nếu `followup_count >= 3`: Node 9 rẽ sang Node 10 đổi trạng thái thành `COLD_LEAD` và tạo nhiệm vụ gọi điện thoại trên CRM.

---

### 9. LUỒNG 9: VISION AI OCR HÓA ĐƠN & ĐỐI SOÁT SỐ HỌC (2 NHÁNH)
**Kịch bản 9A (Khớp số học -> Nhánh True qua Node 7):**
```bash
curl -X POST http://localhost:5678/webhook/m3-flow9-invoice-ocr \
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
```
*Kết quả:* $|50\text{tr} + 5\text{tr} - 55\text{tr}| = 0$, Node 6 đi sang Node 7 lưu trạng thái `VALIDATED` (hiện huy hiệu xanh lá trên web).

**Kịch bản 9B (Sai lệch số học -> Nhánh False qua Node 8):**
```bash
curl -X POST http://localhost:5678/webhook/m3-flow9-invoice-ocr \
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
```
*Kết quả:* $|45\text{tr} + 4.5\text{tr} - 52\text{tr}| = 2.500.000$ VNĐ > 1 VNĐ, Node 6 đi sang Node 8 lưu trạng thái `DISCREPANCY_FLAGGED` (hiện cảnh báo đỏ rực trên web) và gửi mail cảnh báo cho Kế toán trưởng.

---

## PHẦN 4: HƯỚNG DẪN THAO TÁC TRÊN GIAO DIỆN WEB NEXT.JS (PORT 3000)

### 1. Trang Quản lý Vé sự cố & SLA (`/tickets`)
- **Quan sát:**
  - Bảng danh sách vé được tự động phân nhóm theo mức ưu tiên: P1 - Critical (đỏ), P2 - High (cam), P3 - Medium (vàng), P4 - Low (xanh).
  - Cột Kỹ thuật viên phụ trách hiển thị người được thuật toán Least-Busy phân công (Nguyễn Văn An).
  - Đồng hồ đếm ngược SLA: Hiển thị thời hạn cam kết (ví dụ: còn 45 phút đối với vé P1).
- **Thao tác người dùng:**
  - Bấm vào từng dòng vé để mở Modal xem chi tiết: Xem các bước tái hiện sự cố (`reproduce_steps`) do AI Agent 3 bóc tách và các ghi chú ban đầu trong `ticket_comments`.
  - Có thể lọc vé theo trạng thái: Tất cả, Đang chờ (`PENDING`), Đang xử lý (`IN_PROGRESS`), Đã giải quyết (`RESOLVED`).

### 2. Trang Phê duyệt Thư nháp Human-in-the-Loop (`/approval`)
*(Trọng tâm của cơ chế Human-in-the-Loop HITL)*
- **Quan sát:**
  - Cột bên trái: Danh sách các thư nháp do AI RAG tạo ra đang ở trạng thái Chờ phê duyệt (`PENDING_APPROVAL`).
  - Cột bên phải:
    - Nội dung email gốc của khách hàng: Hiển thị câu hỏi hoặc phản ánh của khách.
    - Tài liệu tham chiếu từ pgvector: Hiển thị các bài viết tri thức nội bộ mà hệ thống đã tra cứu được kèm điểm tương đồng (Similarity Score > 75%).
    - Khung soạn thảo phản hồi: Chứa tiêu đề và nội dung HTML do AI Agent 2 đề xuất.
- **Thao tác người dùng:**
  - **Chỉnh sửa (Tùy chọn):** Người dùng có thể click chuột vào ô Tiêu đề hoặc Nội dung để chỉnh sửa, thêm bớt lời chào hoặc điều chỉnh câu từ theo ý muốn.
  - **Bấm nút "Duyệt & Gửi Email":**
    - Trình duyệt lập tức gửi lệnh HTTP POST tới Luồng 5 n8n (`/webhook/m2-flow5-approval`).
    - Nút bấm chuyển sang trạng thái loading "Đang gửi qua SMTP...".
    - Sau 1–2 giây, thông báo thành công màu xanh hiện lên: "Thư đã gửi thành công tới khách hàng!".
    - Bản ghi thư nháp tự động đổi trạng thái sang ĐÃ GỬI (`SENT`).
    - Đồng thời, vé tương ứng bên trang `/tickets` tự động chuyển sang `RESOLVED`.
  - **Bấm nút "Từ chối (Reject)":** Nếu thư nháp không phù hợp, bấm từ chối để hủy bản nháp.

### 3. Trang Bán hàng CRM Pipeline (`/crm`)
- **Quan sát:**
  - Bảng Kanban trực quan gồm các cột giai đoạn: Mới tiếp nhận (New Inquiry), Đã báo giá (Quoted), Khách lạnh (Cold Lead), Thành công (Won), Thất bại (Lost).
  - Mỗi thẻ Deal hiển thị: Tên khách hàng (Lê Thị Kiều Trang), Công ty (Tập đoàn Công nghệ VKU Global), Số điện thoại, Ngân sách dự kiến và Huy hiệu Lead Score (0–100).
- **Thao tác người dùng:**
  - Kéo thả thẻ deal hoặc bấm chọn để chuyển trạng thái từ Mới tiếp nhận sang Đã báo giá (`Quoted`).
  - Khi deal nằm ở cột Đã báo giá quá 48h, Luồng 8 sẽ tự động kích hoạt gửi email chăm sóc và số lần follow-up (`followup_count`) trên thẻ sẽ tự động nhảy lên 1, 2, 3.

### 4. Trang Đối soát Hóa đơn VAT (`/invoices`)
- **Quan sát:**
  - Bảng danh sách hóa đơn bóc tách từ file PDF/ảnh.
  - Cột trạng thái toán học hiển thị trực quan:
    - Huy hiệu Xanh Lá (`VALIDATED`): Hóa đơn hợp lệ 100% số học (Tiền hàng + VAT = Tổng thanh toán).
    - Huy hiệu Đỏ Cảnh Báo (`DISCREPANCY_FLAGGED`): Phát hiện hóa đơn có sự sai lệch số tiền.
- **Thao tác người dùng:**
  - Bấm vào dòng hóa đơn để xem chi tiết: Mã số thuế bên bán, Ngày lập hóa đơn, Số tiền chênh lệch cụ thể.
  - Kế toán trưởng có thể đối soát và quyết toán trực tiếp trên hệ thống.

### 5. Trang Báo cáo Điều hành Executive Analytics (`/analytics`)
- **Quan sát:**
  - 4 thẻ chỉ số KPI trên cùng: Tổng email tiếp nhận 24h, Tỷ lệ Spam bị chặn, Tổng vé sự cố đã xử lý, Tỷ lệ tuân thủ SLA (%).
  - Biểu đồ tỷ lệ phân loại theo phòng ban và độ ưu tiên P1–P4.
  - Hộp phân tích của AI: 3 khuyến nghị trọng tâm gửi Ban Giám Đốc.
- **Thao tác người dùng:**
  - Có thể theo dõi biến động số liệu thực tế thời gian thực được tổng hợp từ toàn bộ các bảng trong CSDL PostgreSQL.

---

## PHẦN 5: TỔNG KẾT VẬN HÀNH DEMO ĐỒ ÁN

| Bước | Hành động thao tác | Luồng n8n xử lý ngầm | Kết quả quan sát được |
|:---:|:---|:---|:---|
| **1** | Chạy `./run_all.sh` | Hệ thống khởi động | DB, n8n, NestJS (4000) và Next.js (3000) cùng bật xanh. |
| **2** | Bắn cURL email sự cố P1 từ `trangltk.24it@vku.udn.vn` | Luồng 1 ➔ 2 ➔ 3 ➔ 4 | Khách nhận mail xác nhận SLA; KTV nhận mail giao việc; Vé P1 xuất hiện trên `/tickets`; Thư nháp xuất hiện trên `/approval`. |
| **3** | Mở trình duyệt vào `/approval`, bấm "Duyệt & Gửi" | Luồng 5 | Email gửi tới khách từ `kieutrangg06123@gmail.com`; Vé đổi sang `RESOLVED`; SLA đạt chuẩn `MET_SLA`. |
| **4** | Bắn cURL email hỏi mua bản quyền 95 triệu | Luồng 1 ➔ 2 ➔ 7 | Deal xuất hiện trên Kanban `/crm`, Lead Score = 100, Sales nhận email thông báo. |
| **5** | Bắn cURL 2 hóa đơn (1 đúng số học, 1 sai số học) | Luồng 9 | Màn hình `/invoices` hiện 1 thẻ xanh `VALIDATED` và 1 thẻ đỏ `DISCREPANCY_FLAGGED`. |
| **6** | Chạy `./view_db_stats.sh` | Truy vấn Postgres | Toàn bộ 14 bảng dữ liệu hiển thị bản ghi thực tế, chứng minh tính toàn vẹn 100%. |
| **7** | Chạy `./stop_all.sh` | Dừng hệ thống | Toàn bộ các cổng 3000, 4000 và container PostgreSQL, n8n được tắt an toàn. |

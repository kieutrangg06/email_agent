# KẾ HOẠCH KIẾN TRÚC & PHÂN CHIA NHÁNH LÀM VIỆC SONG SONG
## Intelligent Enterprise Email Automation & Helpdesk CRM
**(n8n + AI Agent + Next.js + NestJS + PostgreSQL 16)**

---

## 1. NGUYÊN NHÂN CỐT LÕI GÂY XUNG ĐỘT NHÁNH (GIT CONFLICT) TRONG NHÓM
Trong một dự án Monorepo đa thành phần (gồm n8n JSON, SQL scripts, Backend NestJS, Frontend Next.js, Docker Compose):
1. **Lỗi "Tạo nhánh từ Repository trống":** Khi 3 thành viên tạo 3 nhánh từ một repo chưa có khung chuẩn, mỗi người tự khởi tạo dự án (`nest new`, `create-next-app`, tạo `init.sql`) dẫn đến xung đột 100% cấu trúc khi gộp.
2. **Lỗi "Tranh chấp file dùng chung":** Cả 3 người cùng sửa vào `backend/src/app.module.ts`, `database/init.sql`, hoặc `frontend/src/app/layout.tsx`.
3. **Lỗi "Xung đột JSON n8n":** Lưu file workflow n8n chung một thư mục hoặc chung một file. Việc merge JSON tự động của Git gần như luôn bị hỏng cú pháp.
4. **Không có quy trình Git Flow chuẩn:** Không có nhánh tích hợp `develop`, đẩy thẳng lên `main` hoặc rebase sai cách.

---

## 2. NGUYÊN TẮC THIẾT KẾ KIẾN TRÚC CÁCH LY TUYỆT ĐỐI (ZERO-CONFLICT ARCHITECTURE)

Nhóm áp dụng nguyên tắc **Domain-Driven Directory Isolation**: Mỗi thành viên sở hữu 100% thư mục của mình trên cả 4 tầng (Workflows, Database, Backend, Frontend).

```
email-automation-agentic-system/
├── docker/
│   ├── docker-compose.yml           # Khởi chạy PostgreSQL & n8n host mode (Lead quản lý)
│   └── .env.example
├── database/
│   ├── 00_core_schema.sql           # Schema chung: departments, reputation, audit (Lead)
│   ├── 01_member1_tickets.sql       # Schema Thành viên 1: triage logs, tickets
│   ├── 02_member2_knowledge_drafts.sql # Schema Thành viên 2: knowledge, drafts, digest
│   ├── 03_member3_crm_invoices.sql  # Schema Thành viên 3: crm_customers, finance_invoices
│   └── init.sql                     # Master script nạp theo thứ tự
├── workflows/                       # n8n workflows (Cô lập thư mục theo member)
│   ├── member-1/
│   │   ├── workflow-1-triage.json   # 21 nodes (AI Triage & Routing)
│   │   └── workflow-2-tickets.json  # 20 nodes (Ticket Generator & SLA)
│   ├── member-2/
│   │   ├── workflow-3-reply-rag.json# 22 nodes (RAG & Human-in-the-Loop)
│   │   └── workflow-4-digest.json   # 20 nodes (Daily Inbox Digest)
│   └── member-3/
│       ├── workflow-5-crm-lead.json # 21 nodes (CRM Lead Scoring)
│       └── workflow-6-invoice-ocr.json # 21 nodes (OCR Invoices & VAT Audit)
├── backend/                         # NestJS Core API (Port 4000)
│   ├── src/
│   │   ├── core/database/           # Core DB Service (Lead tạo sẵn, các module chỉ gọi dùng)
│   │   ├── app.module.ts            # Đã khai báo sẵn 4 module (Thành viên KHÔNG SỬA file này)
│   │   └── modules/
│   │       ├── tickets/             # [MEMBER 1 ĐỘC QUYỀN]
│   │       ├── knowledge/           # [MEMBER 2 ĐỘC QUYỀN]
│   │       ├── crm/                 # [MEMBER 3 ĐỘC QUYỀN]
│   │       └── invoices/            # [MEMBER 3 ĐỘC QUYỀN]
└── frontend/                        # Next.js App Router (Port 3000)
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx           # Layout gốc + Navbar điều hướng (Lead tạo sẵn)
    │   │   ├── tickets/             # [MEMBER 1 ĐỘC QUYỀN] Màn hình Tickets & SLA
    │   │   ├── approvals/           # [MEMBER 2 ĐỘC QUYỀN] Màn hình Duyệt thư HITL
    │   │   ├── crm/                 # [MEMBER 3 ĐỘC QUYỀN] Màn hình CRM Leads
    │   │   └── invoices/            # [MEMBER 3 ĐỘC QUYỀN] Màn hình Đối soát Hóa đơn
    │   └── components/
    │       └── Navbar.tsx           # Đã gắn sẵn 4 tab điều hướng cho 3 thành viên
```

---

## 3. PHÂN CHIA TRÁCH NHIỆM & RANH GIỚI FILE CHI TIẾT

| Thành viên | Nhánh phát triển | Workflows n8n (≥ 20 nodes) | Bảng Cơ sở dữ liệu | Module NestJS (Cổng 4000) | Giao diện Next.js (Cổng 3000) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Trưởng nhóm (Team Lead)** | `main`, `develop` | Hạ tầng Docker & Cấu hình môi trường | `departments`, `email_senders_reputation`, `system_audit_logs` | `DatabaseModule`, `AppModule` baseline | `Navbar.tsx`, `layout.tsx`, `page.tsx` (Dashboard) |
| **Thành viên 1** | `feature/m1-triage-tickets` | • Luồng 1 (21 nodes)<br>• Luồng 2 (20 nodes) | `email_triage_logs`<br>`tickets` | `backend/src/modules/tickets/` | `frontend/src/app/tickets/` |
| **Thành viên 2** | `feature/m2-reply-rag` | • Luồng 3 (22 nodes)<br>• Luồng 4 (20 nodes) | `knowledge_base`<br>`email_drafts`<br>`daily_summaries` | `backend/src/modules/knowledge/` | `frontend/src/app/approvals/` |
| **Thành viên 3** | `feature/m3-crm-ocr` | • Luồng 5 (21 nodes)<br>• Luồng 6 (21 nodes) | `crm_customers`<br>`finance_invoices` | `backend/src/modules/crm/`<br>`backend/src/modules/invoices/` | `frontend/src/app/crm/`<br>`frontend/src/app/invoices/` |

---

## 4. CHI TIẾT GIAO DIỆN HỢP ĐỒNG API & WEBHOOK (CONTRACTS)

### 4.1. Thành viên 1: Triage & Tickets
- **API Cung cấp cho n8n:**
  - `GET http://localhost:4000/api/v1/triage/departments` -> Trả về danh sách phòng ban cho Luồng 1 Node 6.
  - `POST http://localhost:4000/api/v1/tickets` -> Nhận payload từ Luồng 2 Node 7 để tạo ticket.
- **Webhook n8n đón nhận:**
  - `POST http://localhost:5678/webhook/triage-inbound` -> Tiếp nhận thư thô ban đầu.
  - `POST http://localhost:5678/webhook/ticket-generation` -> Tiếp nhận thư kỹ thuật cần tạo ticket.

### 4.2. Thành viên 2: RAG & Human-in-the-Loop
- **API Cung cấp cho n8n & Web:**
  - `GET http://localhost:4000/api/v1/knowledge?q=...` -> Tra cứu cơ sở tri thức cho Luồng 3.
  - `GET http://localhost:4000/api/v1/drafts` -> Trả về danh sách bản thảo cho trang `/approvals`.
  - `PATCH http://localhost:4000/api/v1/drafts/:id/status` -> Nhận quyết định APPROVE/MODIFY từ nút bấm Next.js và đánh thức n8n Wait Node.
  - `POST http://localhost:4000/api/v1/digest` -> Lưu bản ghi tóm tắt ngày từ Luồng 4 Node 17.
- **Webhook n8n đón nhận:**
  - `POST http://localhost:5678/webhook/reply-rag` -> Tiếp nhận thư cần soạn thảo câu trả lời.
  - `POST http://localhost:5678/webhook/approval-resume` -> Resume webhook khi người dùng bấm duyệt trên Web.

### 4.3. Thành viên 3: CRM & Invoices OCR
- **API Cung cấp cho n8n & Web:**
  - `POST http://localhost:4000/api/v1/crm/leads` -> Bóc tách thông tin khách hàng từ Luồng 5 Node 11.
  - `GET http://localhost:4000/api/v1/crm/customers` -> Trả về bảng khách hàng cho trang `/crm`.
  - `POST http://localhost:4000/api/v1/invoices` -> Lưu chứng từ hóa đơn từ Luồng 6 Node 14.
  - `GET http://localhost:4000/api/v1/invoices` -> Trả về bảng hóa đơn và cờ sai lệch VAT cho trang `/invoices`.
- **Webhook n8n đón nhận:**
  - `POST http://localhost:5678/webhook/crm-sales` -> Tiếp nhận thư phòng kinh doanh.
  - `POST http://localhost:5678/webhook/attachment-ocr` -> Tiếp nhận thư có file đính kèm PDF/Ảnh.

---

## 5. BẢO ĐẢM TIÊU CHUẨN ≥ 20 NODES MỖI LUỒNG
Toàn bộ 6 luồng n8n đều được thiết kế đầy đủ các node bảo vệ, audit log và kiểm tra ngoại lệ:
1. **Luồng 1 (21 nodes):** Webhook -> Filter Spam -> Cleanse Code -> Check Reputation DB -> IF Blacklisted -> Fetch Depts API -> AI Real Classifier -> Output Schema Validator -> Switch Dept -> 4 Audit Nodes -> Merge Data -> IF P1 Urgent -> Urgent Alert DB -> Store Triage Log DB -> Send Confirmation Email -> Compute SLA -> Commit SLA DB -> Quarantine DB.
2. **Luồng 2 (20 nodes):** Webhook -> Clean Payload -> Gen Ticket Code -> Query Available Agents DB -> AI Summarize -> Format Markdown -> Call NestJS POST API -> IF API 201 -> Audit Created DB -> Push Toast API -> Customer Ticket Email -> Log Assignment DB -> Wait 2s -> Calc SLA -> Update SLA DB -> Check Status DB -> IF Unassigned -> Escalation Email -> Audit Escalation DB -> Error Catch.
3. **Luồng 3 (22 nodes):** Webhook -> Extract Keywords -> Normalize Search -> Query KB DB -> Inject Context -> AI Reply Generator -> JSON Parser -> IF High Confidence -> Save Draft DB -> Notify Next.js API -> Audit Draft DB -> Human Wait -> Webhook Approval Resume -> Switch Route -> Prepare Payload -> Send Official SMTP -> Update Draft DB -> Calc Resolution Time -> Log KPI DB -> Sync Dashboard API -> Audit Sent DB -> Error Handler.
4. **Luồng 4 (20 nodes):** Daily Cron 18h -> Count Total DB -> Query Pending DB -> Query Negative DB -> Aggregate Stats -> AI Insights -> Markdown Digest -> HTML Template -> Fetch Exec Emails DB -> Save Daily DB -> Detect Spike -> IF Spike -> Send Alert Email -> Audit Spike DB -> Split Batches -> Send Digest Email -> Push Stats API -> Confirm Done -> Audit Final DB -> Error Catch.
5. **Luồng 5 (21 nodes):** Webhook -> Extract Signature -> AI Entity Extractor -> JSON Lead Formatter -> Check Customer DB -> IF Existing -> Insert DB -> Update DB -> Merge State -> Calculate Lead Score -> Create Deal API -> IF High-Value -> Assign Sales DB -> Alert Sales Email -> Send Intro Deck Email -> Wait 48h -> Query Response DB -> IF No Response -> Send Follow-up Email -> Update CRM DB -> Error Handler.
6. **Luồng 6 (21 nodes):** Webhook -> Filter Extensions -> Extract Metadata -> Save Binary Storage -> IF Format -> Read PDF Buffer -> Vision OCR -> Merge Text -> AI Field Extractor -> Parse Schema -> Math Integrity Audit -> IF Valid -> Insert Invoice DB -> Sync Accounting API -> Confirm Receipt Email -> Audit Success DB -> Flag Suspicious DB -> Alert Accountant Email -> Push UI Toast API -> Audit Integrity Flag DB -> Pipeline Error Catch.

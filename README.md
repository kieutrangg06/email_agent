# Intelligent Enterprise Email Automation & Helpdesk CRM
> Hệ thống Tự động hóa Email Doanh nghiệp & CRM Helpdesk với n8n (≥ 20 Nodes), 10 AI Agents, NestJS Core API, Next.js App Router và PostgreSQL 16.

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![n8n](https://img.shields.io/badge/n8n-Workflow_Automation-orange.svg)](https://n8n.io/)
[![NestJS](https://img.shields.io/badge/NestJS-Core_API-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-black.svg)](https://nextjs.org/)

---

## 📂 Cấu trúc Dự án (Monorepo Zero-Conflict)

```
email-automation-agentic-system/
├── docker/                          # PostgreSQL 16 & n8n Host mode
│   └── docker-compose.yml
├── database/                        # SQL DDL Schemas cách ly theo Member
│   ├── 00_core_schema.sql
│   ├── 01_member1_tickets.sql
│   ├── 02_member2_knowledge_drafts.sql
│   ├── 03_member3_crm_invoices.sql
│   └── init.sql
├── workflows/                       # File JSON 6 luồng n8n (≥ 20 Nodes)
│   ├── member-1/                    # Luồng 1 (21 nodes), Luồng 2 (20 nodes)
│   ├── member-2/                    # Luồng 3 (22 nodes), Luồng 4 (20 nodes)
│   └── member-3/                    # Luồng 5 (21 nodes), Luồng 6 (21 nodes)
├── backend/                         # NestJS Core API (Port 4000)
│   └── src/modules/                 # tickets, knowledge, crm, invoices
├── frontend/                        # Next.js App Router (Port 3000)
│   └── src/app/                     # /tickets, /approvals, /crm, /invoices
├── ARCHITECTURE_AND_BRANCHING_PLAN.md # Kế hoạch kiến trúc & chia nhánh chi tiết
└── PARALLEL_GIT_FLOW.md             # Hướng dẫn câu lệnh Git làm việc song song
```

---

## ⚡ Hướng dẫn Khởi chạy Nhanh

### 1. Khởi động Docker (PostgreSQL & n8n)
```bash
cd docker
docker compose up -d
```
- PostgreSQL: `localhost:5432` (user: `admin`, pass: `SecretPassword123!`, db: `email_automation_db`)
- n8n Dashboard: `http://localhost:5678`

### 2. Khởi động Backend NestJS (Port 4000)
```bash
cd ../backend
npm install
npm run start:dev
```
- API Base: `http://localhost:4000/api/v1`

### 3. Khởi động Frontend Next.js (Port 3000)
```bash
cd ../frontend
npm install
npm run dev
```
- Dashboard: `http://localhost:3000`

---

## 🌿 Phân chia Nhánh Git cho 3 Thành viên

Xem chi tiết câu lệnh từng bước tại [PARALLEL_GIT_FLOW.md](./PARALLEL_GIT_FLOW.md):
- **Thành viên 1:** `feature/m1-triage-ticket` (Luồng 1 & 2: Triage & Tickets)
- **Thành viên 2:** `feature/m2-reply-rag` (Luồng 3 & 4: RAG, Human-in-the-loop, Daily Digest)
- **Thành viên 3:** `feature/m3-crm-ocr` (Luồng 5 & 6: CRM Lead Scoring, Invoice OCR)

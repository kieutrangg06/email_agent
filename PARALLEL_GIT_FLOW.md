# HƯỚNG DẪN CÂU LỆNH GIT SONG SONG (PARALLEL GIT WORKFLOW)
## Không Ai Ảnh Hưởng Ai - Không Xung Đột Code - Hợp Nhất An Toàn

Tài liệu này cung cấp toàn bộ chuỗi câu lệnh Git thực tế dành cho **Trưởng nhóm** và **3 Thành viên** để làm việc song song 100% độc lập, không bị đè code lên nhau và tích hợp mượt mà.

---

## 🚀 GIAI ĐOẠN 0: TRƯỞNG NHÓM (LEADER) THIẾT LẬP REPO GỐC (BASELINE)

> **Mục tiêu:** Đẩy toàn bộ khung mã nguồn gốc (Scaffold) lên GitHub/GitLab trước để tạo nền móng chung.

```bash
# 1. Di chuyển vào thư mục dự án
cd ~/email-automation

# 2. Khởi tạo Git nếu chưa có
git init -b main

# 3. Thêm toàn bộ khung dự án ban đầu
git add .
git commit -m "chore: initialize enterprise email automation monorepo scaffold"

# 4. Liên kết với remote repository trên GitHub/GitLab của nhóm (thay URL của nhóm bạn)
# Ví dụ: git remote add origin https://github.com/your-team/email-automation-system.git
git remote add origin <URL_REPO_CUA_NHOM>

# 5. Đẩy nhánh main lên remote
git push -u origin main

# 6. Tạo nhánh develop (nhánh tích hợp chính) từ main và đẩy lên remote
git checkout -b develop
git push -u origin develop
```

---

## 👥 GIAI ĐOẠN 1: TỪNG THÀNH VIÊN CLONE VÀ TẠO NHÁNH TÍNH NĂNG ĐỘC LẬP

Mỗi thành viên khi nhận nhiệm vụ thực hiện đúng các bước sau trên máy cá nhân:

### 1️⃣ THÀNH VIÊN 1 (MEMBER 1: Triage & Tickets)
```bash
# Bước 1.1: Clone repository về máy cá nhân
git clone <URL_REPO_CUA_NHOM> email-automation-m1
cd email-automation-m1

# Bước 1.2: Lấy thông tin tất cả các nhánh từ server
git fetch origin

# Bước 1.3: Tạo và chuyển sang nhánh riêng dựa trên develop
git checkout -b feature/m1-triage-ticket origin/develop

# Bước 1.4: Xác nhận nhánh hiện tại
git branch
# Kết quả hiển thị: * feature/m1-triage-ticket
```

### 2️⃣ THÀNH VIÊN 2 (MEMBER 2: Reply RAG & Human-in-the-Loop)
```bash
# Bước 2.1: Clone repository về máy cá nhân
git clone <URL_REPO_CUA_NHOM> email-automation-m2
cd email-automation-m2

# Bước 2.2: Lấy thông tin nhánh từ server
git fetch origin

# Bước 2.3: Tạo và chuyển sang nhánh riêng dựa trên develop
git checkout -b feature/m2-reply-rag origin/develop

# Bước 2.4: Xác nhận nhánh hiện tại
git branch
# Kết quả hiển thị: * feature/m2-reply-rag
```

### 3️⃣ THÀNH VIÊN 3 (MEMBER 3: CRM Leads & Invoices OCR)
```bash
# Bước 3.1: Clone repository về máy cá nhân
git clone <URL_REPO_CUA_NHOM> email-automation-m3
cd email-automation-m3

# Bước 3.2: Lấy thông tin nhánh từ server
git fetch origin

# Bước 3.3: Tạo và chuyển sang nhánh riêng dựa trên develop
git checkout -b feature/m3-crm-ocr origin/develop

# Bước 3.4: Xác nhận nhánh hiện tại
git branch
# Kết quả hiển thị: * feature/m3-crm-ocr
```

---

## 💻 GIAI ĐOẠN 2: LÀM VIỆC HẰNG NGÀY & COMMIT CHUẨN CONVENTIONAL COMMITS

Mỗi thành viên chỉ làm việc trong **vùng thư mục độc quyền** của mình:

### Quy tắc làm việc của Thành viên 1:
- Sửa/thêm file trong:
  - `workflows/member-1/*`
  - `database/01_member1_tickets.sql`
  - `backend/src/modules/tickets/*`
  - `frontend/src/app/tickets/*`
```bash
# Lưu và đẩy tiến độ hằng ngày
git status
git add workflows/member-1/ database/01_member1_tickets.sql backend/src/modules/tickets/ frontend/src/app/tickets/
git commit -m "feat(tickets): implement SLA calculation node and API endpoint"
git push -u origin feature/m1-triage-ticket
```

### Quy tắc làm việc của Thành viên 2:
- Sửa/thêm file trong:
  - `workflows/member-2/*`
  - `database/02_member2_knowledge_drafts.sql`
  - `backend/src/modules/knowledge/*`
  - `frontend/src/app/approvals/*`
```bash
# Lưu và đẩy tiến độ hằng ngày
git status
git add workflows/member-2/ database/02_member2_knowledge_drafts.sql backend/src/modules/knowledge/ frontend/src/app/approvals/
git commit -m "feat(reply-rag): connect RAG knowledge retrieval and HITL approval webhook"
git push -u origin feature/m2-reply-rag
```

### Quy tắc làm việc của Thành viên 3:
- Sửa/thêm file trong:
  - `workflows/member-3/*`
  - `database/03_member3_crm_invoices.sql`
  - `backend/src/modules/crm/*`
  - `backend/src/modules/invoices/*`
  - `frontend/src/app/crm/*`
  - `frontend/src/app/invoices/*`
```bash
# Lưu và đẩy tiến độ hằng ngày
git status
git add workflows/member-3/ database/03_member3_crm_invoices.sql backend/src/modules/crm/ backend/src/modules/invoices/ frontend/src/app/crm/ frontend/src/app/invoices/
git commit -m "feat(ocr-invoices): integrate math integrity audit and lead score calculation"
git push -u origin feature/m3-crm-ocr
```

---

## 🔄 GIAI ĐOẠN 3: ĐỒNG BỘ ĐỊNH KỲ ĐỂ TRÁNH LỖI LỆCH CODE (ANTI-CONFLICT ROUTINE)

Khi **Thành viên 1** đã hoàn thành và được merge vào `develop`, **Thành viên 2 và 3** cần cập nhật code mới từ `develop` về nhánh của mình **trước khi tạo PR** bằng lệnh `rebase`:

```bash
# Đang đứng tại nhánh của mình (ví dụ feature/m2-reply-rag):
# Bước 1: Lưu tạm các thay đổi chưa commit (nếu có)
git stash

# Bước 2: Tải code mới nhất từ remote
git fetch origin

# Bước 3: Đặt lại nhánh tính năng của mình lên trên đầu nhánh develop mới nhất
git rebase origin/develop

# Bước 4: Khôi phục lại thay đổi đang làm dở (nếu đã stash)
git stash pop

# Bước 5: Đẩy nhánh đã rebase lên remote (dùng --force-with-lease để an toàn)
git push --force-with-lease origin feature/m2-reply-rag
```

*Nhờ kiến trúc cô lập thư mục triệt để ở Mục 2, lệnh rebase này sẽ chạy thành công 100% tự động mà KHÔNG BAO GIỜ bị conflict!*

---

## 🔀 GIAI ĐOẠN 4: HỢP NHẤT TẤT CẢ VÀO `develop` VÀ `main` (INTEGRATION & RELEASE)

### Cách A: Qua giao diện Web GitHub / GitLab (Khuyên dùng)
1. Mỗi thành viên lên GitHub tạo **Pull Request (PR)** từ `feature/<ten-nhanh>` vào nhánh `develop`.
2. Trưởng nhóm review, kiểm tra các node n8n và chạy test.
3. Bấm **Merge Pull Request** (Squash and merge hoặc Create a merge commit).

### Cách B: Bằng câu lệnh Terminal (Dành cho Trưởng nhóm merge trực tiếp)
```bash
# 1. Chuyển sang nhánh develop và kéo bản mới nhất
git checkout develop
git pull origin develop

# 2. Merge nhánh Member 1
git merge --no-ff feature/m1-triage-ticket -m "merge: integrate Member 1 triage & tickets feature"
git push origin develop

# 3. Merge nhánh Member 2
git merge --no-ff feature/m2-reply-rag -m "merge: integrate Member 2 reply RAG & HITL approval feature"
git push origin develop

# 4. Merge nhánh Member 3
git merge --no-ff feature/m3-crm-ocr -m "merge: integrate Member 3 CRM leads & invoice OCR feature"
git push origin develop

# 5. Sau khi nghiệm thu toàn bộ 6 luồng và API hoạt động ổn định trên develop, merge vào main:
git checkout main
git pull origin main
git merge --no-ff develop -m "release: v1.0.0 complete intelligent enterprise email automation system"
git push origin main
```

---

## 💡 MẸO NÂNG CAO: DÙNG GIT WORKTREE (LÀM VIỆC ĐA NHÁNH TRÊN 1 MÁY DUY NHẤT)

Nếu bạn là Trưởng nhóm muốn mở đồng thời cả 3 nhánh trên cùng một máy mà không cần `git checkout` qua lại liên tục:

```bash
cd ~/email-automation

# Tạo 3 thư mục song song ánh xạ vào 3 nhánh riêng biệt:
git worktree add ../email-m1 feature/m1-triage-ticket
git worktree add ../email-m2 feature/m2-reply-rag
git worktree add ../email-m3 feature/m3-crm-ocr

# Khi đó:
# - Thư mục ~/email-m1 chạy nhánh Member 1
# - Thư mục ~/email-m2 chạy nhánh Member 2
# - Thư mục ~/email-m3 chạy nhánh Member 3
# Cả 3 thư mục tồn tại độc lập cùng lúc trên ổ cứng!
```

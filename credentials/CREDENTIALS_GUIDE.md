# HƯỚNG DẪN CẤU HÌNH CREDENTIALS CHO MEMBER 1

Trong hệ thống n8n của Thành viên 1, các node thao tác Database và Gửi Email cần kết nối với 2 tài khoản chứng thực (Credentials):
1. **Postgres account** (ID: `CaIms8Oqvb0ztig0`)
2. **SMTP account** (ID: `Jtq10Z7c0pkw5YhZ`)

---

## Cách 1: Nạp Tự Động Bằng 1 Dòng Lệnh (Khuyên dùng)

Sau khi khởi động container Docker, chỉ cần chạy script:

```bash
bash /home/kieu-trang/email-automation/credentials/setup_credentials.sh
```

Lệnh này sẽ tự động nạp file `n8n_credentials.json` vào n8n với đúng ID. Khi mở lại n8n, 3 workflow sẽ tự động liên kết thành công 100% không bị báo đỏ.

---

## Cách 2: Cấu hình Thủ công trên Giao diện Web n8n UI

Nếu muốn tạo trực tiếp trên giao diện `http://localhost:5678`:

### 1. Postgres Account
* Vào menu **Credentials** (bên trái) $\rightarrow$ Bấm nút **Add Credential** góc phải.
* Tìm loại: **Postgres**.
* Đặt tên: `Postgres account`.
* Điền thông tin kết nối:
  * **Host:** `127.0.0.1` (hoặc `localhost`)
  * **Database:** `email_automation_m1_db` (hoặc `email_automation_db`)
  * **User:** `admin`
  * **Password:** `SecretPassword123!`
  * **Port:** `5432`
  * **SSL:** `disable`
* Bấm **Save**.

### 2. SMTP Account
* Vào menu **Credentials** $\rightarrow$ Bấm nút **Add Credential**.
* Tìm loại: **SMTP**.
* Đặt tên: `SMTP account`.
* Điền thông tin kết nối:
  * **Host:** `smtp.gmail.com`
  * **Port:** `465` (SSL/TLS bật `true`)
  * **User:** `tranglee12306@gmail.com`
  * **Password:** Mật khẩu ứng dụng 16 ký tự của Google (*App Password*)
* Bấm **Save**.

---

Sau khi tạo xong, 3 Workflow (`flow01_ingest_antispam.json`, `flow02_department_triage.json`, `flow03_ticket_sla_dispatch.json`) sẽ tự động nhận diện và hoạt động trơn tru!

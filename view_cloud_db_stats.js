/**
 * TRUY XUẤT XEM TRỰC TIẾP TOÀN BỘ DỮ LIỆU CSDL TRÊN CLOUD SUPABASE
 * API Host: https://email-automation-api-a377.onrender.com
 */

const https = require('https');

const API_BASE = 'https://email-automation-api-a377.onrender.com';

function get(path) {
  return new Promise((resolve) => {
    https.get(`${API_BASE}${path}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  console.log('======================================================================');
  console.log('🌐 KIỂM TRA DỮ LIỆU TRỰC TIẾP TRÊN CLOUD DATABASE (SUPABASE TOKYO)');
  console.log('======================================================================\n');

  const [triageStats, tickets, drafts, crmCustomers, crmDeals, invoices, auditLogs] = await Promise.all([
    get('/api/v1/triage/stats'),
    get('/api/v1/tickets'),
    get('/api/v1/drafts'),
    get('/api/v1/crm/customers'),
    get('/api/v1/crm/deals'),
    get('/api/v1/finance/invoices'),
    get('/api/v1/audit/logs'),
  ]);

  console.log('📊 1. THỐNG KÊ TỔNG QUAN HỘP THƯ & VÉ:');
  console.table(triageStats || { note: 'Không có dữ liệu' });

  console.log('\n🎫 2. DANH SÁCH VÉ HỖ TRỢ GẦN NHẤT (TICKETS):');
  if (Array.isArray(tickets) && tickets.length > 0) {
    console.table(tickets.slice(0, 5).map(t => ({
      Mã_vé: t.ticket_code,
      Khách_hàng: t.customer_email || t.sender_email,
      Ưu_tiên: t.priority,
      Kỹ_thuật_viên: t.assigned_to,
      Trạng_thái: t.status,
    })));
  } else {
    console.log('   (Trống - Chưa có vé nào)');
  }

  console.log('\n✍️ 3. DANH SÁCH BẢN NHÁP DUYỆT THƯ HITL (DRAFTS):');
  if (Array.isArray(drafts) && drafts.length > 0) {
    console.table(drafts.slice(0, 5).map(d => ({
      ID: d.id,
      Mã_vé: d.ticket_code,
      Người_nhận: d.recipient_email,
      Trạng_thái: d.status,
      Độ_tin_cậy: `${d.confidence_score}%`,
      Người_duyệt: d.reviewed_by || 'Chưa duyệt',
    })));
  } else {
    console.log('   (Trống - Chưa có bản nháp nào)');
  }

  console.log('\n💼 4. CRM LEADS & CƠ HỘI BÁN HÀNG:');
  console.log(`   - Tổng khách hàng CRM: ${Array.isArray(crmCustomers) ? crmCustomers.length : 0}`);
  console.log(`   - Tổng Deal Pipeline: ${Array.isArray(crmDeals) ? crmDeals.length : 0}`);

  console.log('\n🧾 5. HÓA ĐƠN & OCR ĐỐI SOÁT KẾ TOÁN:');
  if (Array.isArray(invoices) && invoices.length > 0) {
    console.table(invoices.slice(0, 5).map(inv => ({
      Số_HĐ: inv.invoice_number,
      Bên_bán: inv.seller_name,
      Tiền_hàng: Number(inv.subtotal).toLocaleString('vi-VN') + ' đ',
      VAT: Number(inv.vat_amount).toLocaleString('vi-VN') + ' đ',
      Tổng_tiền: Number(inv.total_amount).toLocaleString('vi-VN') + ' đ',
      Kết_quả_toán: inv.math_status,
    })));
  } else {
    console.log('   (Trống - Chưa có hóa đơn nào)');
  }

  console.log('\n🛡️ 6. NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS MỚI NHẤT):');
  if (Array.isArray(auditLogs) && auditLogs.length > 0) {
    console.table(auditLogs.slice(0, 5).map(log => ({
      Sự_kiện: log.event_type,
      Luồng: log.workflow_id,
      Mô_tả: log.description,
      Thời_gian: new Date(log.created_at).toLocaleTimeString('vi-VN'),
    })));
  } else {
    console.log('   (Trống)');
  }

  console.log('\n======================================================================');
}

main().catch(console.error);

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'kieutrangg06123@gmail.com',
        pass: process.env.SMTP_PASS || 'uijgddklkjyggoxq',
      },
    });
  }

  async sendMail(to: string, subject: string, html: string, fromName = 'Enterprise AI Helpdesk') {
    try {
      const fromEmail = process.env.SMTP_USER || 'kieutrangg06123@gmail.com';
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Real email dispatched successfully to ${to} (MessageId: ${info.messageId})`);
      return info;
    } catch (err: any) {
      this.logger.error(`Failed to send real email to ${to}: ${err.message}`);
      return null;
    }
  }

  // 1. Gửi thông báo vé mới cho Ban Tiếp Nhận Doanh Nghiệp (tranngo170770@gmail.com)
  async notifyEnterpriseNewTicket(ticket: any) {
    const to = 'tranngo170770@gmail.com';
    const subject = `[TIẾP NHẬN MỚI] Sự cố ${ticket.priority || 'P1'} từ ${ticket.sender_email || ticket.customer_email} - Mã vé: ${ticket.ticket_code}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f43f5e; border-radius: 12px; background-color: #fff;">
        <h2 style="color: #e11d48; margin-top: 0;">🏢 Doanh Nghiệp: Thông Báo Yêu Cầu Hỗ Trợ Mới</h2>
        <p>Hệ thống AI vừa tiếp nhận một yêu cầu hỗ trợ mới gửi đến hòm thư doanh nghiệp (<b>tranngo170770@gmail.com</b>):</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Mã vé:</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #e11d48; font-weight: bold;">${ticket.ticket_code}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Khách hàng gửi:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${ticket.sender_email || ticket.customer_email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Tiêu đề:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${ticket.title}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Mức độ ưu tiên:</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc2626; font-weight: bold;">${ticket.priority}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Kỹ thuật viên gán:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${ticket.assigned_to || 'Nguyễn Văn An'}</td></tr>
        </table>
        <div style="background-color: #fff1f2; padding: 12px; border-radius: 8px; border-left: 4px solid #f43f5e; margin-top: 15px;">
          <p style="margin: 0; font-size: 13px; color: #881337;"><b>Mô tả sự cố:</b><br/>${ticket.description || 'Không có mô tả chi tiết'}</p>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 25px;">Thư tự động chuyển tiếp từ máy chủ SMTP: <b>kieutrangg06123@gmail.com</b></p>
      </div>
    `;
    return this.sendMail(to, subject, html, 'Enterprise Internal Alert');
  }

  // 2. Gửi thư xác nhận tiếp nhận cho Khách Hàng (trangltk.24it@vku.udn.vn)
  async confirmCustomerTicketReceived(ticket: any) {
    const to = ticket.sender_email || ticket.customer_email;
    if (!to || !to.includes('@')) return null;

    const subject = `[XÁC NHẬN TIẾP NHẬN] Sự cố mã số ${ticket.ticket_code} - Enterprise Support`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Kính gửi quý khách,</h2>
        <p>Hệ thống hỗ trợ Doanh nghiệp (<b>tranngo170770@gmail.com</b>) đã tiếp nhận thành công yêu cầu của bạn:</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 4px 0;"><b>Mã số vé:</b> <span style="color: #2563eb; font-weight: bold;">${ticket.ticket_code}</span></p>
          <p style="margin: 4px 0;"><b>Tiêu đề:</b> ${ticket.title}</p>
          <p style="margin: 4px 0;"><b>Mức độ ưu tiên:</b> ${ticket.priority}</p>
          <p style="margin: 4px 0;"><b>Kỹ sư tiếp nhận xử lý:</b> ${ticket.assigned_to || 'Nguyễn Văn An'}</p>
        </div>
        <p>Đội ngũ kỹ thuật đang khẩn trương xử lý sự cố để đảm bảo thời hạn cam kết SLA. Chúng tôi sẽ phản hồi email hướng dẫn chi tiết ngay khi có kết quả.</p>
        <p style="margin-top: 25px;">Trân trọng,<br/><b>Đội Ngũ Hỗ Trợ Kỹ Thuật Doanh Nghiệp</b></p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin-top: 25px;" />
        <p style="font-size: 11px; color: #94a3b8;">Email tự động gửi từ máy chủ SMTP doanh nghiệp: <b>kieutrangg06123@gmail.com</b></p>
      </div>
    `;
    return this.sendMail(to, subject, html, 'Enterprise Customer Support');
  }

  // 3. Gửi email phản hồi chính thức sau khi Chuyên viên bấm DUYỆT (HITL)
  async sendApprovedReplyToCustomer(draft: any) {
    const to = draft.recipient_email;
    if (!to || !to.includes('@')) return null;

    const subject = draft.subject || draft.proposed_subject || `[PHẢN HỒI HỖ TRỢ] Vé ${draft.ticket_code}`;
    const body = draft.html_content || draft.proposed_body || '<p>Kính gửi quý khách, yêu cầu của bạn đã được xử lý thành công.</p>';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #ffffff;">
        <div style="margin-bottom: 20px;">
          ${body}
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
        <p style="font-size: 11px; color: #64748b; margin-top: 10px;">
          🏢 <b>Hòm thư tiếp nhận Doanh nghiệp:</b> tranngo170770@gmail.com<br/>
          🚀 <b>Thư phản hồi gửi từ máy chủ SMTP:</b> kieutrangg06123@gmail.com<br/>
          Người phê duyệt nội dung: <b>${draft.reviewed_by || 'admin@enterprise.vn'}</b>
        </p>
      </div>
    `;
    return this.sendMail(to, subject, html, 'Enterprise Technical Team');
  }
}

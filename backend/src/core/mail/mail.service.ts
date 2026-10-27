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
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <!-- Header Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 30px; text-align: left;">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Enterprise Alert</span>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 800;">Thông Báo Yêu Cầu Hỗ Trợ Mới</h1>
                    <p style="color: #ffe4e6; margin: 0; font-size: 13px;">Hòm thư Doanh Nghiệp (tranngo170770@gmail.com)</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 14px; line-height: 1.6; margin-top: 0; color: #334155;">
                      Hệ thống AI vừa tiếp nhận và phân loại một yêu cầu hỗ trợ sự cố từ khách hàng:
                    </p>

                    <!-- Ticket Detail Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff1f2; border-radius: 14px; border: 1px solid #fecdd3; margin: 20px 0;">
                      <tr>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #ffe4e6; font-size: 13px; color: #64748b; width: 140px;">Mã số vé:</td>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #ffe4e6; font-size: 14px; font-weight: 800; color: #be123c; font-family: monospace;">${ticket.ticket_code}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #ffe4e6; font-size: 13px; color: #64748b;">Khách hàng gửi:</td>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #ffe4e6; font-size: 13px; font-weight: 600; color: #0f172a;">${ticket.sender_email || ticket.customer_email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #ffe4e6; font-size: 13px; color: #64748b;">Mức độ ưu tiên:</td>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #ffe4e6; font-size: 12px;">
                          <span style="background-color: #e11d48; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-weight: bold;">${ticket.priority}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #ffe4e6; font-size: 13px; color: #64748b;">Kỹ thuật viên gán:</td>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #ffe4e6; font-size: 13px; font-weight: bold; color: #0f172a;">${ticket.assigned_to || 'Nguyễn Văn An'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 18px; font-size: 13px; color: #64748b;">Tiêu đề email:</td>
                        <td style="padding: 14px 18px; font-size: 13px; font-weight: 600; color: #0f172a;">${ticket.title}</td>
                      </tr>
                    </table>

                    <!-- Issue snippet -->
                    <div style="background-color: #f8fafc; border-left: 4px solid #e11d48; border-radius: 0 10px 10px 0; padding: 14px 18px; margin: 20px 0;">
                      <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b;">Chi tiết phản ánh từ khách:</span>
                      <p style="font-size: 13px; color: #1e293b; line-height: 1.6; margin: 8px 0 0 0;">
                        ${ticket.description || 'Không có mô tả chi tiết'}
                      </p>
                    </div>

                    <!-- Button link to dashboard -->
                    <div style="text-align: center; margin: 30px 0 10px 0;">
                      <a href="https://email-automation-vku.onrender.com/tickets" style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25);">
                        Mở Vé Trên Hệ Thống Cloud &rarr;
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
                    Hệ thống Tự Động Hóa Email Doanh Nghiệp VKU &bull; Máy chủ SMTP: <b>kieutrangg06123@gmail.com</b>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    return this.sendMail(to, subject, html, 'Enterprise Internal Alert');
  }

  // 2. Gửi thư xác nhận tiếp nhận cho Khách Hàng (trangltk.24it@vku.udn.vn)
  async confirmCustomerTicketReceived(ticket: any) {
    const to = ticket.sender_email || ticket.customer_email;
    if (!to || !to.includes('@')) return null;

    const subject = `[XÁC NHẬN TIẾP NHẬN] Sự cố mã số ${ticket.ticket_code} - Enterprise Support`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <!-- Header Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px; text-align: left;">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Customer Helpdesk</span>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 800;">Xác Nhận Đã Tiếp Nhận Yêu Cầu</h1>
                    <p style="color: #e0f2fe; margin: 0; font-size: 13px;">Hệ thống Hỗ trợ Kỹ thuật Khách hàng</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 14px; line-height: 1.6; margin-top: 0; color: #334155;">
                      Kính gửi quý khách,<br/>
                      Hệ thống Doanh nghiệp (<b>tranngo170770@gmail.com</b>) đã tiếp nhận thành công yêu cầu hỗ trợ của bạn. Yêu cầu đã được khởi tạo thành vé hỗ trợ chính thức:
                    </p>

                    <!-- Ticket Detail Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 14px; border: 1px solid #bae6fd; margin: 20px 0;">
                      <tr>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #e0f2fe; font-size: 13px; color: #64748b; width: 140px;">Mã số vé:</td>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #e0f2fe; font-size: 15px; font-weight: 800; color: #0284c7; font-family: monospace;">${ticket.ticket_code}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #e0f2fe; font-size: 13px; color: #64748b;">Tiêu đề:</td>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #e0f2fe; font-size: 13px; font-weight: 600; color: #0f172a;">${ticket.title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #e0f2fe; font-size: 13px; color: #64748b;">Mức độ cam kết:</td>
                        <td style="padding: 14px 18px; border-bottom: 1px solid #e0f2fe; font-size: 12px;">
                          <span style="background-color: #0284c7; color: #ffffff; padding: 4px 10px; border-radius: 20px; font-weight: bold;">${ticket.priority}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 18px; font-size: 13px; color: #64748b;">Kỹ sư phụ trách:</td>
                        <td style="padding: 14px 18px; font-size: 13px; font-weight: bold; color: #0f172a;">${ticket.assigned_to || 'Nguyễn Văn An'}</td>
                      </tr>
                    </table>

                    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                      Đội ngũ kỹ thuật viên đang khẩn trương kiểm tra và xử lý sự cố để đảm bảo đúng thời hạn cam kết SLA. Chúng tôi sẽ phản hồi thư hướng dẫn chi tiết ngay khi hoàn tất.
                    </p>

                    <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-top: 25px;">
                      Trân trọng,<br/>
                      <strong style="color: #0f172a;">Đội Ngũ Hỗ Trợ Kỹ Thuật Doanh Nghiệp</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
                    Hòm thư tiếp nhận Doanh nghiệp: <b>tranngo170770@gmail.com</b> &bull; Máy chủ gửi: <b>kieutrangg06123@gmail.com</b>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <!-- Header Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: left;">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Official Resolution</span>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 800;">Phản Hồi Xử Lý Yêu Cầu Hỗ Trợ</h1>
                    <p style="color: #d1fae5; margin: 0; font-size: 13px;">Vé hỗ trợ: <b>${draft.ticket_code}</b> &bull; Đã qua thẩm định chuyên viên</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <!-- Body Content from AI / Human Reviewer -->
                    <div style="font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 25px;">
                      ${body}
                    </div>

                    <!-- Verified Badge -->
                    <div style="background-color: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0; padding: 14px 18px; margin-top: 25px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size: 12px; color: #065f46;">
                            &#10004; Thư trả lời này đã được thẩm định và phê duyệt bởi Chuyên viên: <b>${draft.reviewed_by || 'admin@enterprise.vn'}</b>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
                    🏢 <b>Hòm thư tiếp nhận DN:</b> tranngo170770@gmail.com &bull; 🚀 <b>Máy chủ gửi SMTP:</b> kieutrangg06123@gmail.com
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    return this.sendMail(to, subject, html, 'Enterprise Technical Team');
  }
}

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
    const fromEmail = process.env.SMTP_USER || 'kieutrangg06123@gmail.com';
    const brevoApiKey = process.env.BREVO_API_KEY;

    // 1. Nếu có BREVO_API_KEY: Bắn qua giao thức HTTPS API (Port 443 - Không bao giờ bị Render chặn)
    if (brevoApiKey) {
      try {
        const payload = JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        });

        const res = await new Promise<any>((resolve, reject) => {
          const https = require('https');
          const req = https.request(
            {
              hostname: 'api.brevo.com',
              port: 443,
              path: '/v3/smtp/email',
              method: 'POST',
              headers: {
                'api-key': brevoApiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
              },
              timeout: 10000,
            },
            (resp: any) => {
              let data = '';
              resp.on('data', (c: any) => (data += c));
              resp.on('end', () => {
                try {
                  resolve({ status: resp.statusCode, body: JSON.parse(data) });
                } catch {
                  resolve({ status: resp.statusCode, body: data });
                }
              });
            }
          );
          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Brevo API timeout'));
          });
          req.write(payload);
          req.end();
        });

        if (res.status === 201 || res.status === 200) {
          this.logger.log(`[Brevo HTTPS 443] Real email dispatched to ${to} (MessageId: ${res.body?.messageId})`);
          return { messageId: res.body?.messageId, response: '250 OK via Brevo HTTPS API' };
        } else {
          this.logger.warn(`Brevo API returned status ${res.status}: ${JSON.stringify(res.body)}`);
        }
      } catch (err: any) {
        this.logger.error(`Brevo HTTPS dispatch failed: ${err.message}`);
      }
    }

    // 2. Fallback: Gửi qua Google SMTP Socket (Port 465)
    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`[Google SMTP Socket] Real email dispatched successfully to ${to} (MessageId: ${info.messageId})`);
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

  // 4. Luồng 7: Gửi thông báo Lead VIP nội bộ cho chuyên viên Sales (tranngo170770@gmail.com)
  async notifySalesNewLead(lead: any, deal: any, to = 'tranngo170770@gmail.com') {
    const budgetStr = Number(deal.expected_budget || 0).toLocaleString('vi-VN');
    const subject = `[CƠ HỘI BÁN HÀNG MỚI] Lead VIP: ${lead.full_name || 'Khách hàng'} (${lead.company_name || 'Doanh nghiệp'}) - Deal: ${budgetStr} đ`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <tr>
                  <td style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 30px; text-align: left;">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Sales Opportunity</span>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 800;">Phát Hiện Cơ Hội Bán Hàng Mới</h1>
                    <p style="color: #fef3c7; margin: 0; font-size: 13px;">AI Triage bóc tách tự động &bull; Điểm tiềm năng: <b>${lead.lead_score || 95}/100</b></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 14px; line-height: 1.6; margin-top: 0; color: #334155;">
                      Hệ thống AI vừa tiếp nhận email hỏi mua sản phẩm/dịch vụ từ khách hàng doanh nghiệp:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 14px; border: 1px solid #fde68a; margin: 20px 0;">
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #fef3c7; font-size: 13px; color: #78350f; width: 140px;">Khách hàng:</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #fef3c7; font-size: 14px; font-weight: 800; color: #92400e;">${lead.full_name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #fef3c7; font-size: 13px; color: #78350f;">Doanh nghiệp:</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #fef3c7; font-size: 13px; font-weight: 600; color: #1e293b;">${lead.company_name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #fef3c7; font-size: 13px; color: #78350f;">Email &amp; SĐT:</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #fef3c7; font-size: 13px; font-weight: 600; color: #0284c7;">${lead.email} &bull; ${lead.phone || 'Chưa có SĐT'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #fef3c7; font-size: 13px; color: #78350f;">Quy mô dự kiến:</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #fef3c7; font-size: 15px; font-weight: 800; color: #b45309;">${budgetStr} VNĐ</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; font-size: 13px; color: #78350f;">Chuyên viên phụ trách:</td>
                        <td style="padding: 12px 18px; font-size: 13px; font-weight: bold; color: #1e293b;">${deal.assigned_sales_rep || 'Lê Thị Bích'}</td>
                      </tr>
                    </table>
                    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                      👉 Vui lòng liên hệ khách hàng trong vòng <b>2 giờ</b> để tư vấn giải pháp và hẹn lịch demo trực tiếp.
                    </p>
                  </td>
                </tr>
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
    return this.sendMail(to, subject, html, 'Enterprise CRM System');
  }

  // 5. Luồng 9: Gửi cảnh báo gian lận / sai lệch số học hóa đơn (tranngo170770@gmail.com)
  async sendInvoiceDiscrepancyAlert(invoice: any, to = 'tranngo170770@gmail.com') {
    const diffStr = Number(invoice.discrepancy || 0).toLocaleString('vi-VN');
    const subject = `[CẢNH BÁO GIAN LẬN] Hóa đơn ${invoice.invoice_number} sai lệch số học ${diffStr} đ`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: left;">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Finance Fraud Alert</span>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 800;">Phát Hiện Sai Lệch Số Học Hóa Đơn</h1>
                    <p style="color: #fee2e2; margin: 0; font-size: 13px;">Hệ thống Đối soát OCR Tự động &bull; Cờ đỏ: <b>DISCREPANCY_FLAGGED</b></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px; margin-bottom: 20px; color: #991b1b; font-size: 13px; font-weight: 600;">
                      ⚠️ Cảnh báo khẩn cấp: Tiền hàng + Tiền thuế VAT KHÔNG KHỚP với Tổng thanh toán ghi trên chứng từ!
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin: 20px 0;">
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; width: 150px;">Số Hóa Đơn:</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 800; font-family: monospace; color: #dc2626;">${invoice.invoice_number}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Đơn vị bán:</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #1e293b;">${invoice.seller_name} (MST: ${invoice.seller_tax_id})</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">1. Tiền hàng (Subtotal):</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #1e293b;">${Number(invoice.subtotal).toLocaleString('vi-VN')} đ</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">2. Thuế VAT:</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #1e293b;">${Number(invoice.vat_amount).toLocaleString('vi-VN')} đ</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">3. Tổng ghi trên HĐ:</td>
                        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 800; color: #dc2626;">${Number(invoice.total_amount).toLocaleString('vi-VN')} đ</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 18px; font-size: 13px; color: #dc2626; font-weight: bold;">Chênh lệch kê khống:</td>
                        <td style="padding: 12px 18px; font-size: 15px; font-weight: 900; color: #dc2626;">+ ${diffStr} đ</td>
                      </tr>
                    </table>
                    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                      🛑 <b>Khuyến nghị nghiệp vụ:</b> Kế toán trưởng tạm dừng thanh toán hóa đơn này để yêu cầu nhà cung cấp giải trình và xuất hóa đơn điều chỉnh.
                    </p>
                  </td>
                </tr>
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
    return this.sendMail(to, subject, html, 'Enterprise Fraud Protection');
  }

  // 6. Luồng 6: Gửi Báo Cáo Điều Hành hằng ngày cho Ban Giám Đốc (tranngo170770@gmail.com)
  async sendExecutiveDailyDigest(stats: any, to = 'tranngo170770@gmail.com') {
    const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const subject = `[BÁO CÁO ĐIỀU HÀNH 24H] Tổng kết vận hành hệ thống Email Automation & SLA - ${today}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <tr>
                  <td style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 30px; text-align: left;">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Executive Intelligence</span>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 800;">Báo Cáo Điều Hành Vận Hành 24H</h1>
                    <p style="color: #e0e7ff; margin: 0; font-size: 13px;">Gửi Ban Giám Đốc &bull; ${today}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 14px; line-height: 1.6; margin-top: 0; color: #334155;">
                      Kính gửi Ban Giám Đốc, hệ thống AI đã tổng hợp toàn bộ các chỉ số vận hành quan trọng trong 24 giờ qua:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                      <tr>
                        <td width="50%" style="padding: 8px;">
                          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 16px; text-align: center;">
                            <span style="font-size: 11px; color: #166534; font-weight: bold; text-transform: uppercase;">Tuân Thủ SLA</span>
                            <div style="font-size: 26px; font-weight: 900; color: #15803d; margin: 6px 0;">${stats.sla_rate || '100%'}</div>
                            <span style="font-size: 11px; color: #4ade80;">Không có vé trễ hạn</span>
                          </div>
                        </td>
                        <td width="50%" style="padding: 8px;">
                          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 16px; text-align: center;">
                            <span style="font-size: 11px; color: #1e40af; font-weight: bold; text-transform: uppercase;">Tổng Thư Tiếp Nhận</span>
                            <div style="font-size: 26px; font-weight: 900; color: #1d4ed8; margin: 6px 0;">${stats.total_emails || stats.total || 12}</div>
                            <span style="font-size: 11px; color: #60a5fa;">Xử lý tự động 100%</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 8px;">
                          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 16px; text-align: center;">
                            <span style="font-size: 11px; color: #9f1239; font-weight: bold; text-transform: uppercase;">Sự Cố P1 Khẩn Cấp</span>
                            <div style="font-size: 26px; font-weight: 900; color: #be123c; margin: 6px 0;">${stats.p1_count || stats.p1Count || 1}</div>
                            <span style="font-size: 11px; color: #f43f5e;">Đã điều phối KTV</span>
                          </div>
                        </td>
                        <td width="50%" style="padding: 8px;">
                          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 14px; padding: 16px; text-align: center;">
                            <span style="font-size: 11px; color: #854d0e; font-weight: bold; text-transform: uppercase;">Pipeline Bán Hàng</span>
                            <div style="font-size: 24px; font-weight: 900; color: #a16207; margin: 6px 0;">250.000.000 đ</div>
                            <span style="font-size: 11px; color: #eab308;">Lead VIP tăng trưởng</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                      ✅ Toàn bộ hạ tầng đám mây và cổng AI Semantic Triage hoạt động ổn định, đảm bảo bảo mật và cam kết dịch vụ SLA.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
                    Hệ thống Báo Cáo Tự Động VKU &bull; Máy chủ gửi: <b>kieutrangg06123@gmail.com</b>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    return this.sendMail(to, subject, html, 'Enterprise Executive Digest');
  }

  // 7. Luồng 8: Gửi email chăm sóc báo giá tự động cho khách hàng (trangltk.24it@vku.udn.vn)
  async sendSalesFollowUpToCustomer(deal: any, to: string) {
    if (!to || !to.includes('@')) return null;
    const subject = `[CHĂM SÓC KHÁCH HÀNG] Hỗ trợ tư vấn giải pháp cho ${deal.customer_name || 'Quý khách'} - Enterprise Sales`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: left;">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">Customer Success</span>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 800;">Chăm Sóc &amp; Hỗ Trợ Tư Vấn Giải Pháp</h1>
                    <p style="color: #dbeafe; margin: 0; font-size: 13px;">Gói giải pháp: <b>${deal.deal_name || 'Email Automation Enterprise'}</b></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 14px; line-height: 1.7; color: #334155;">
                      Kính gửi quý khách <b>${deal.customer_name || 'Quý khách'}</b>,<br/><br/>
                      Đội ngũ chuyên viên tư vấn Enterprise đã gửi đề xuất giải pháp kỹ thuật và báo giá chi tiết cho quý doanh nghiệp. Chúng tôi liên hệ để tìm hiểu xem quý khách có cần hỗ trợ thêm thông tin hoặc giải đáp thắc mắc nào về phương án triển khai hay không.
                    </p>
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 600;">
                        💡 Đội ngũ kỹ sư sẵn sàng thu xếp buổi <b>Live Demo (Trực Tuyến 1-1)</b> để hướng dẫn trực tiếp các tính năng AI tự động hóa phù hợp với mô hình doanh nghiệp của bạn.
                      </p>
                    </div>
                    <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                      Quý khách có thể trả lời trực tiếp email này hoặc liên hệ hotline để được hỗ trợ nhanh nhất.<br/><br/>
                      Trân trọng,<br/>
                      <strong>Lê Thị Bích &bull; Ban Chăm Sóc Khách Hàng Doanh Nghiệp</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
                    Hòm thư Doanh nghiệp: <b>tranngo170770@gmail.com</b> &bull; Máy chủ gửi: <b>kieutrangg06123@gmail.com</b>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    return this.sendMail(to, subject, html, 'Enterprise Customer Success');
  }
}

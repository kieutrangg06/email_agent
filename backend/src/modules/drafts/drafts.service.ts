import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../../core/database/database.service';
import { MailService } from '../../core/mail/mail.service';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DraftNotificationEvent {
  data: {
    type: string;
    draft_id?: number;
    ticket_code?: string;
    recipient_email?: string;
    subject?: string;
    timestamp: string;
    [key: string]: any;
  };
}

export interface ApprovalModeSettings {
  mode: 'HUMAN' | 'AI_FULL';
  debounce_seconds: number;
  confidence_threshold: number;
  updated_at?: string;
}

@Injectable()
export class DraftsService implements OnModuleInit {
  private readonly logger = new Logger(DraftsService.name);
  private readonly notifications$ = new Subject<any>();

  constructor(
    private readonly db: DatabaseService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    try {
      // Đảm bảo schema PostgreSQL của email_drafts và system_settings luôn đầy đủ
      await this.db.query(`
        ALTER TABLE email_drafts 
          ALTER COLUMN status TYPE VARCHAR(50),
          ADD COLUMN IF NOT EXISTS thread_id TEXT,
          ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
          ADD COLUMN IF NOT EXISTS superseded_by INT,
          ADD COLUMN IF NOT EXISTS unreplied_emails_count INT DEFAULT 1,
          ADD COLUMN IF NOT EXISTS aggregated_inbound_messages JSONB DEFAULT '[]'::jsonb;

        CREATE INDEX IF NOT EXISTS idx_email_drafts_thread_id ON email_drafts(thread_id);

        CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO system_settings (key, value)
        VALUES ('approval_mode', '{"mode": "HUMAN", "debounce_seconds": 30, "confidence_threshold": 75}'::jsonb)
        ON CONFLICT (key) DO NOTHING;
      `);
      this.logger.log('Database schema for Dual-Mode & Thread-Aware Drafts initialized successfully.');
    } catch (err: any) {
      this.logger.warn(`Could not run automatic schema migration: ${err.message}`);
    }
  }

  // ===========================================================================
  // 1. DUAL-MODE SETTINGS (HUMAN vs AI_FULL)
  // ===========================================================================
  async getApprovalMode(): Promise<ApprovalModeSettings> {
    try {
      const res = await this.db.query(
        "SELECT value FROM system_settings WHERE key = 'approval_mode' LIMIT 1"
      );
      if (res.rows.length > 0) {
        const val = typeof res.rows[0].value === 'string' ? JSON.parse(res.rows[0].value) : res.rows[0].value;
        return {
          mode: val.mode || 'HUMAN',
          debounce_seconds: Number(val.debounce_seconds) || 30,
          confidence_threshold: Number(val.confidence_threshold) || 75,
          updated_at: val.updated_at || new Date().toISOString(),
        };
      }
    } catch (e: any) {
      this.logger.warn(`Could not fetch approval mode: ${e.message}`);
    }
    return { mode: 'HUMAN', debounce_seconds: 30, confidence_threshold: 75 };
  }

  async setApprovalMode(payload: { mode: 'HUMAN' | 'AI_FULL'; debounce_seconds?: number; confidence_threshold?: number }): Promise<ApprovalModeSettings> {
    const current = await this.getApprovalMode();
    const updated: ApprovalModeSettings = {
      mode: payload.mode === 'AI_FULL' ? 'AI_FULL' : 'HUMAN',
      debounce_seconds: payload.debounce_seconds !== undefined ? Number(payload.debounce_seconds) : current.debounce_seconds,
      confidence_threshold: payload.confidence_threshold !== undefined ? Number(payload.confidence_threshold) : current.confidence_threshold,
      updated_at: new Date().toISOString(),
    };

    await this.db.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('approval_mode', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(updated)]
    );

    this.logger.log(`[Dual-Mode Switch] Approval Mode switched to: ${updated.mode}`);

    // Khi chuyển sang chế độ AI_FULL: Tự động quét và gửi ngay các bản nháp đang chờ duyệt đủ điều kiện an toàn
    if (updated.mode === 'AI_FULL') {
      try {
        const pendingRes = await this.db.query(
          `SELECT * FROM email_drafts 
           WHERE status = 'PENDING_APPROVAL' 
             AND COALESCE(confidence_score, 0) >= $1`,
          [updated.confidence_threshold || 75]
        );
        for (const draft of pendingRes.rows) {
          try {
            await this.mailService.sendApprovedReplyToCustomer(draft);
            await this.db.query(
              `UPDATE email_drafts 
               SET status = 'AUTO_SENT', sent_at = NOW(), reviewed_by = 'AI_AUTONOMOUS_AGENT', reviewed_at = NOW() 
               WHERE id = $1`,
              [draft.id]
            );
            if (draft.ticket_code) {
              await this.db.query(
                "UPDATE tickets SET status = 'RESOLVED', resolved_at = NOW() WHERE ticket_code = $1",
                [draft.ticket_code]
              ).catch(() => {});
            }
            this.logger.log(`[AI Auto-Pilot Sweep] Auto-dispatched pending draft #${draft.id} (${draft.ticket_code})`);

            this.notifications$.next({
              type: 'DRAFT_AUTO_SENT',
              draft_id: draft.id,
              ticket_code: draft.ticket_code,
              recipient_email: draft.recipient_email,
              timestamp: new Date().toISOString(),
            });
          } catch (e: any) {
            this.logger.error(`Failed to auto-dispatch draft #${draft.id}: ${e.message}`);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not sweep pending drafts for AI_FULL: ${err.message}`);
      }
    }

    this.notifications$.next({
      type: 'APPROVAL_MODE_CHANGED',
      mode: updated.mode,
      settings: updated,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  // ===========================================================================
  // 2. CREATE DRAFT WITH CONVERSATION THREADING & ANTI-OVERWRITE LOGIC
  // ===========================================================================
  async createDraft(payload: any) {
    const ticketCode = payload.ticket_code || payload.ticketCode || null;
    let ticketId = payload.ticket_id ? Number(payload.ticket_id) : null;
    let ticketData: any = null;

    if (ticketCode || ticketId) {
      try {
        const ticketRes = await this.db.query(
          `SELECT id, ticket_code, sender_email, customer_email, title, subject 
           FROM tickets 
           WHERE ticket_code = $1 OR id = $2 
           LIMIT 1`,
          [ticketCode || '', ticketId || 0],
        );
        if (ticketRes.rows.length > 0) {
          ticketData = ticketRes.rows[0];
          if (!ticketId) ticketId = ticketData.id;
        }
      } catch (err: any) {
        this.logger.warn(`Could not lookup ticket details for draft creation: ${err.message}`);
      }
    }

    let recipientEmail =
      payload.recipient_email ||
      payload.recipient ||
      payload.sender_email ||
      payload.customer_email ||
      payload.client_email ||
      payload.email ||
      payload.toEmail ||
      payload.to ||
      ticketData?.sender_email ||
      ticketData?.customer_email;

    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.trim()) {
      recipientEmail = 'trangltk.24it@vku.udn.vn';
    }
    recipientEmail = recipientEmail.trim().toLowerCase();

    // Xác định thread_id đại diện cho cuộc hội thoại
    let threadId = payload.thread_id || payload.threadId;
    if (!threadId) {
      if (ticketCode) {
        threadId = ticketCode;
      } else {
        threadId = `TH_${recipientEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
    }

    const senderName = payload.sender_name || payload.from_name || recipientEmail.split('@')[0];
    const incomingOriginalSubject = payload.original_subject || payload.subject || 'Yêu cầu hỗ trợ';
    const incomingOriginalBody = payload.original_body || payload.body || payload.content || '';

    // 2.1. KIỂM TRA XEM TRONG THREAD NÀY ĐÃ CÓ BẢN NHÁP NÀO ĐANG CHỜ DUYỆT KHÔNG (BÀI TOÁN CỦA THẦY)
    let prevDraft: any = null;
    try {
      const prevRes = await this.db.query(
        `SELECT * FROM email_drafts 
         WHERE (thread_id = $1 OR (ticket_code IS NOT NULL AND ticket_code = $2))
           AND status = 'PENDING_APPROVAL'
         ORDER BY version DESC, id DESC
         LIMIT 1`,
        [threadId, ticketCode || '']
      );
      if (prevRes.rows.length > 0) {
        prevDraft = prevRes.rows[0];
      }
    } catch (err: any) {
      this.logger.warn(`Could not check existing drafts in thread ${threadId}: ${err.message}`);
    }

    let newVersion = 1;
    let unrepliedCount = 1;
    let inboundMessages: any[] = [];
    let proposedSubject = payload.proposed_subject || payload.subject;
    let proposedBody = payload.proposed_body || payload.body || payload.content || '';

    if (prevDraft) {
      // ĐÃ CÓ BẢN NHÁP CŨ ĐANG CHỜ DUYỆT! -> THỰC HIỆN GỘP VÀ CHỐNG ĐÈ
      newVersion = (Number(prevDraft.version) || 1) + 1;
      
      // Khôi phục danh sách các tin nhắn inbound trước đó trong cuộc hội thoại
      if (Array.isArray(prevDraft.aggregated_inbound_messages) && prevDraft.aggregated_inbound_messages.length > 0) {
        inboundMessages = [...prevDraft.aggregated_inbound_messages];
      } else {
        inboundMessages = [
          {
            email_id: prevDraft.id,
            sent_at: prevDraft.received_at || prevDraft.created_at,
            sender: prevDraft.sender_name || prevDraft.recipient_email,
            subject: prevDraft.original_subject || prevDraft.subject || 'Email khởi tạo',
            body: prevDraft.original_body || prevDraft.proposed_body || '',
          }
        ];
      }

      // Thêm tin nhắn mới nhất vừa đến
      inboundMessages.push({
        email_id: payload.message_id || `msg_${Date.now()}`,
        sent_at: payload.received_at || new Date().toISOString(),
        sender: senderName,
        subject: incomingOriginalSubject,
        body: incomingOriginalBody,
      });

      unrepliedCount = inboundMessages.length;

      // Sinh nội dung trả lời gộp thông minh (Tổng hợp cả 2 câu hỏi) nếu chưa được AI bên ngoài gộp sẵn
      const prevBody = prevDraft.proposed_body || '';
      const newBody = proposedBody || incomingOriginalBody || '';

      if (!payload.is_pre_aggregated && prevBody && newBody) {
        proposedSubject = `[Cập nhật ${newVersion} thư gộp] Phản hồi: ${incomingOriginalSubject.replace(/^Re:\s*/i, '')}`;
        proposedBody = `Kính gửi Quý khách,\n\nChúng tôi đã tiếp nhận liên tiếp các yêu cầu của bạn trong cuộc hội thoại này và xin được giải đáp tổng hợp như sau:\n\n1. Về nội dung trước đó:\n${prevBody}\n\n2. Về câu hỏi/yêu cầu bổ sung mới nhất:\n${newBody}\n\nNếu bạn cần thêm bất kỳ sự hỗ trợ nào, xin vui lòng phản hồi trực tiếp qua email này.\n\nTrân trọng,\nEnterprise Support Team`;
      }
    } else {
      // Chưa có nháp chờ duyệt, khởi tạo message đầu tiên
      inboundMessages = [
        {
          email_id: payload.message_id || `msg_${Date.now()}`,
          sent_at: payload.received_at || new Date().toISOString(),
          sender: senderName,
          subject: incomingOriginalSubject,
          body: incomingOriginalBody,
        }
      ];
    }

    const subject = proposedSubject || (ticketCode ? `Phản hồi yêu cầu hỗ trợ [${ticketCode}]` : 'Phản hồi từ Enterprise Helpdesk');
    const htmlContent =
      payload.html_content ||
      `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Kính gửi Quý khách,</p>
        <p>${(proposedBody || 'Chúng tôi đã tiếp nhận và đang xử lý yêu cầu của bạn.').replace(/\n/g, '<br/>')}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 13px; color: #777;">Trân trọng,<br/><strong>Enterprise Support Team</strong></p>
      </div>`;

    const confidenceScore = Number(payload.confidence_score) || 95.0;
    const initialStatus = 'PENDING_APPROVAL';

    // 2.2. LƯU BẢN NHÁP MỚI VÀO CƠ SỞ DỮ LIỆU
    const insertQuery = `
      INSERT INTO email_drafts (
        ticket_id, ticket_code, recipient_email, subject, proposed_subject, 
        proposed_body, html_content, confidence_score, status, sender_name,
        original_subject, original_body, thread_id, version, unreplied_emails_count,
        aggregated_inbound_messages, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING *;
    `;
    const insertValues = [
      ticketId,
      ticketCode,
      recipientEmail,
      subject,
      proposedSubject,
      proposedBody,
      htmlContent,
      confidenceScore,
      initialStatus,
      senderName,
      incomingOriginalSubject,
      incomingOriginalBody,
      threadId,
      newVersion,
      unrepliedCount,
      JSON.stringify(inboundMessages),
    ];

    const res = await this.db.query(insertQuery, insertValues);
    const created = res.rows[0];

    // 2.3. NẾU CÓ BẢN NHÁP CŨ: CHUYỂN TRẠNG THÁI SANG SUPERSEDED (KHÔNG XÓA, LƯU VẾT)
    if (prevDraft) {
      try {
        await this.db.query(
          `UPDATE email_drafts 
           SET status = 'SUPERSEDED', 
               superseded_by = $1, 
               reviewed_at = NOW(), 
               reviewed_by = 'SYSTEM_SUPERSEDED'
           WHERE id = $2`,
          [created.id, prevDraft.id]
        );
        this.logger.log(`Draft #${prevDraft.id} in thread ${threadId} marked as SUPERSEDED by Draft #${created.id} (v${newVersion})`);

        this.notifications$.next({
          type: 'DRAFT_SUPERSEDED',
          old_draft_id: prevDraft.id,
          new_draft_id: created.id,
          thread_id: threadId,
          version: newVersion,
          unreplied_count: unrepliedCount,
          message: `Khách hàng vừa gửi thêm email mới trong thread [${threadId}]. Bản nháp #${prevDraft.id} đã được thay thế bằng bản nháp tổng hợp #${created.id} (Version ${newVersion}).`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        this.logger.error(`Failed to update superseded draft: ${err.message}`);
      }
    }

    // Auto-link draft_id to ticket
    if (ticketCode) {
      try {
        await this.db.query(
          `UPDATE tickets SET draft_id = $1 WHERE ticket_code = $2`,
          [created.id, ticketCode],
        );
      } catch (err: any) {
        this.logger.warn(`Could not link draft to ticket: ${err.message}`);
      }
    }

    // 2.4. XỬ LÝ CHẾ ĐỘ DUAL-MODE (HUMAN vs AI_FULL)
    const modeSettings = await this.getApprovalMode();
    if (modeSettings.mode === 'AI_FULL') {
      const threshold = Number(modeSettings.confidence_threshold) || 75.0;
      if (confidenceScore >= threshold) {
        // AI TỰ ĐỘNG GỬI ĐI THẲNG LUÔN KHÔNG CẦN DUYỆT THỦ CÔNG
        this.logger.log(`[AI Auto-Pilot Mode] Auto-dispatching Draft #${created.id} to ${recipientEmail} (Confidence: ${confidenceScore}%)`);
        try {
          await this.mailService.sendApprovedReplyToCustomer(created);
          await this.db.query(
            `UPDATE email_drafts 
             SET status = 'AUTO_SENT', 
                 sent_at = NOW(), 
                 reviewed_by = 'AI_AUTONOMOUS_AGENT', 
                 reviewed_at = NOW() 
             WHERE id = $1`,
            [created.id]
          );
          created.status = 'AUTO_SENT';
          created.sent_at = new Date().toISOString();
          created.reviewed_by = 'AI_AUTONOMOUS_AGENT';

          if (ticketCode) {
            await this.db.query(
              "UPDATE tickets SET status = 'RESOLVED', resolved_at = NOW() WHERE ticket_code = $1",
              [ticketCode]
            ).catch(() => {});
          }

          await this.db.query(
            `INSERT INTO system_audit_logs (event_type, severity, details)
             VALUES ('AI_AUTONOMOUS_EMAIL_DISPATCHED', 'INFO', $1)`,
            [JSON.stringify({ draft_id: created.id, recipient_email: recipientEmail, confidence_score: confidenceScore, version: newVersion })]
          ).catch(() => {});

          this.notifications$.next({
            type: 'DRAFT_AUTO_SENT',
            draft_id: created.id,
            ticket_code: created.ticket_code,
            recipient_email: created.recipient_email,
            subject: created.subject,
            confidence_score: confidenceScore,
            version: newVersion,
            unreplied_count: unrepliedCount,
            timestamp: new Date().toISOString(),
          });

          return created;
        } catch (sendErr: any) {
          this.logger.error(`AI Auto-send failed: ${sendErr.message}`);
        }
      } else {
        // Safety-net kích hoạt: Độ tin cậy thấp, giữ lại hàng chờ duyệt thủ công
        this.logger.warn(`[AI Safety-Net] Draft #${created.id} held for human review (Confidence: ${confidenceScore}% < ${threshold}%)`);
        await this.db.query(
          `INSERT INTO system_audit_logs (event_type, severity, details)
           VALUES ('AI_SAFETY_NET_TRIGGERED', 'WARNING', $1)`,
          [JSON.stringify({ draft_id: created.id, confidence_score: confidenceScore, reason: 'Confidence score below safe threshold' })]
        ).catch(() => {});

        this.notifications$.next({
          type: 'SAFETY_NET_TRIGGERED',
          draft_id: created.id,
          confidence_score: confidenceScore,
          reason: 'Độ tin cậy dưới ngưỡng an toàn 75%, giữ lại hàng chờ kiểm duyệt thủ công',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Phát sự kiện bản nháp mới được tạo (cho HUMAN mode)
    this.notifications$.next({
      type: 'DRAFT_CREATED',
      draft_id: created.id,
      ticket_code: created.ticket_code,
      recipient_email: created.recipient_email,
      subject: created.subject,
      thread_id: threadId,
      version: newVersion,
      unreplied_count: unrepliedCount,
      timestamp: new Date().toISOString(),
    });

    return created;
  }

  // ===========================================================================
  // 3. GET DRAFTS WITH THREADING & COMPATIBILITY
  // ===========================================================================
  async getAllDrafts(status?: string) {
    let query = `
      SELECT d.*, 
             COALESCE(t.priority, 'P2 - High') as priority, 
             t.assigned_to, 
             t.title as ticket_title,
             t.status as ticket_status,
             t.sla_due_at
      FROM email_drafts d 
      LEFT JOIN tickets t ON (d.ticket_code = t.ticket_code OR d.ticket_id = t.id)
    `;
    const params: any[] = [];
    if (status && status !== 'ALL' && status !== 'All') {
      if (status === 'SENT') {
        query += ` WHERE d.status IN ('SENT', 'APPROVED_SENT', 'AUTO_SENT')`;
      } else if (status === 'APPROVED_SENT') {
        query += ` WHERE d.status IN ('SENT', 'APPROVED_SENT')`;
      } else {
        params.push(status);
        query += ` WHERE d.status = $1`;
      }
    }
    query += ` ORDER BY d.created_at DESC LIMIT 150;`;
    const res = await this.db.query(query, params);
    return res.rows;
  }

  async getPendingDrafts() {
    const res = await this.db.query(
      `SELECT d.*, 
              COALESCE(t.priority, 'P2 - High') as priority, 
              t.assigned_to, 
              t.title as ticket_title,
              t.status as ticket_status,
              t.sla_due_at
       FROM email_drafts d 
       LEFT JOIN tickets t ON d.ticket_code = t.ticket_code 
       WHERE d.status = 'PENDING_APPROVAL' 
       ORDER BY d.created_at DESC;`
    );
    return res.rows;
  }

  async getDraftById(id: number) {
    const res = await this.db.query(
      `SELECT d.*, 
              t.id AS t_id, 
              t.ticket_code AS t_code, 
              t.created_at AS ticket_created_at, 
              t.sla_due_at, 
              t.first_response_sla, 
              t.priority, 
              t.assigned_to, 
              t.title as ticket_title 
       FROM email_drafts d 
       LEFT JOIN tickets t ON (d.ticket_code = t.ticket_code OR d.ticket_id = t.id)
       WHERE d.id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  // ===========================================================================
  // 4. UPDATE DRAFT STATUS & SAFE APPROVE (PREVENTS SENDING SUPERSEDED DRAFT)
  // ===========================================================================
  async updateDraftStatus(id: number, payload: any) {
    this.logger.log(`Updating status for draft #${id} to ${payload.status}`);

    const existingDraft = await this.getDraftById(id);
    if (!existingDraft) {
      throw new Error(`Draft #${id} not found`);
    }

    // CHỐNG GỬI THƯ ĐÃ LỖI THỜI: Nếu người dùng cố tình bấm duyệt bản nháp đã bị SUPERSEDED
    if (existingDraft.status === 'SUPERSEDED' && (payload.status === 'SENT' || payload.status === 'APPROVED_SENT')) {
      return {
        success: false,
        error: 'DRAFT_SUPERSEDED',
        message: `Bản nháp #${id} đã lỗi thời do khách hàng đã gửi thêm email mới trong cuộc hội thoại này. Vui lòng duyệt bản nháp mới nhất (Version ${Number(existingDraft.version || 1) + 1}).`,
        superseded_by: existingDraft.superseded_by,
      };
    }

    const isSent = payload.status === 'SENT' || payload.status === 'APPROVED_SENT';
    const finalStatus = isSent ? 'APPROVED_SENT' : payload.status;

    const query = `
      UPDATE email_drafts
      SET status = $1::text,
          reviewed_by = COALESCE($2::text, reviewed_by),
          reviewed_at = NOW(),
          sent_at = ${isSent ? 'NOW()' : 'sent_at'},
          proposed_subject = COALESCE($3::text, proposed_subject),
          proposed_body = COALESCE($4::text, proposed_body),
          subject = COALESCE($5::text, subject),
          html_content = COALESCE($6::text, html_content)
      WHERE id = $7::int
      RETURNING *;
    `;
    const res = await this.db.query(query, [
      finalStatus,
      payload.reviewed_by || 'reviewer@company.com',
      payload.proposed_subject || payload.subject || null,
      payload.proposed_body || payload.html_content || null,
      payload.subject || payload.proposed_subject || null,
      payload.html_content || payload.proposed_body || null,
      id,
    ]);

    const updated = res.rows[0];

    // Gửi email thật qua SMTP khi trạng thái là SENT / APPROVED_SENT
    if (updated && isSent) {
      try {
        if (!updated.recipient_email && updated.ticket_code) {
          const tRes = await this.db.query(
            'SELECT customer_email, sender_email FROM tickets WHERE ticket_code = $1',
            [updated.ticket_code],
          );
          if (tRes.rows.length > 0) {
            updated.recipient_email = tRes.rows[0].customer_email || tRes.rows[0].sender_email;
          }
        }
        await this.mailService.sendApprovedReplyToCustomer(updated);
        this.logger.log(`Approved reply successfully dispatched to ${updated.recipient_email}`);
      } catch (e: any) {
        this.logger.error(`Could not dispatch approved reply to customer: ${e.message}`);
      }
    }

    // Cập nhật ticket thành RESOLVED
    if (updated && updated.ticket_code && isSent) {
      try {
        const tRes = await this.db.query(
          "UPDATE tickets SET status = 'RESOLVED', resolved_at = NOW() WHERE ticket_code = $1 RETURNING *;",
          [updated.ticket_code]
        );
        if (tRes.rows.length > 0 && tRes.rows[0].agent_email) {
          await this.db.query(
            'UPDATE support_agents SET active_tickets_count = GREATEST(active_tickets_count - 1, 0) WHERE email = $1;',
            [tRes.rows[0].agent_email]
          ).catch(() => {});
        }
      } catch (err: any) {
        this.logger.warn(`Could not resolve ticket ${updated.ticket_code}: ${err.message}`);
      }
    }

    // Emit SSE event
    this.notifications$.next({
      type: 'DRAFT_STATUS_UPDATED',
      draft_id: id,
      status: finalStatus,
      reviewed_by: payload.reviewed_by,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async resendApprovedReply(id: number) {
    const draft = await this.getDraftById(id);
    if (!draft) {
      throw new Error(`Draft #${id} not found`);
    }
    if (!draft.recipient_email && draft.ticket_code) {
      const tRes = await this.db.query(
        'SELECT customer_email, sender_email FROM tickets WHERE ticket_code = $1',
        [draft.ticket_code],
      );
      if (tRes.rows.length > 0) {
        draft.recipient_email = tRes.rows[0].customer_email || tRes.rows[0].sender_email;
      }
    }
    const result = await this.mailService.sendApprovedReplyToCustomer(draft);
    return {
      success: true,
      message: `Đã gửi lại email phản hồi tới ${draft.recipient_email || 'khách hàng'}`,
      result,
    };
  }

  // ===========================================================================
  // 5. SIMULATION HELPER CHO KỊCH BẢN CỦA THẦY
  // ===========================================================================
  async simulateMultiTurnEmail(payload: { step: number; thread_id?: string; sender_name?: string; customer_email?: string; body?: string }) {
    const threadId = payload.thread_id || 'THREAD-THAY-DEMO-01';
    const customerEmail = payload.customer_email || 'trangltk.24it@vku.udn.vn';
    const senderName = payload.sender_name || 'Nguyễn Văn A (Khách hàng)';

    if (payload.step === 1) {
      // BƯỚC 1: Khách hỏi câu 1 "Bạn ơi bạn khỏe không?"
      return this.createDraft({
        thread_id: threadId,
        recipient_email: customerEmail,
        sender_name: senderName,
        original_subject: 'Hỏi thăm & Tư vấn dịch vụ',
        original_body: payload.body || 'Bạn ơi bạn khỏe không?',
        proposed_subject: 'Re: Hỏi thăm & Tư vấn dịch vụ',
        proposed_body: 'Chào bạn! Mình vẫn khỏe, cảm ơn bạn đã quan tâm hỏi thăm. Mình có thể hỗ trợ gì cho bạn hôm nay?',
        confidence_score: 96.0,
      });
    } else {
      // BƯỚC 2: Khách gửi câu 2 "Tôi muốn mua cái này" trong cùng thread khi câu 1 chưa duyệt!
      return this.createDraft({
        thread_id: threadId,
        recipient_email: customerEmail,
        sender_name: senderName,
        original_subject: 'Re: Hỏi thăm & Tư vấn dịch vụ (Gửi thêm câu hỏi)',
        original_body: payload.body || 'Tôi muốn mua sản phẩm này, bên bạn còn hàng không và giao hàng bao lâu?',
        proposed_subject: 'Re: Hỏi thăm & Tư vấn dịch vụ [Đã gộp câu hỏi]',
        proposed_body: 'Hiện tại sản phẩm bạn hỏi bên mình vẫn còn sẵn hàng trong kho. Thời gian giao hàng tiêu chuẩn là từ 1 đến 2 ngày làm việc. Bạn vui lòng cung cấp địa chỉ nhận hàng để bên mình lên đơn nhé!',
        confidence_score: 94.0,
      });
    }
  }

  validateReviewer(reviewerEmail: string) {
    const valid = !!reviewerEmail && reviewerEmail.includes('@');
    return {
      valid,
      reviewer_email: reviewerEmail,
      role: 'AGENT_REVIEWER',
      permissions: ['APPROVE_SEND', 'REJECT_DRAFT', 'EDIT_DRAFT'],
      validated_at: new Date().toISOString(),
    };
  }

  pushNotification(data: any) {
    this.notifications$.next({
      type: 'NOTIFICATION_PUSHED',
      ...data,
      timestamp: new Date().toISOString(),
    });
    return { success: true, message: 'Notification emitted to stream' };
  }

  getEventStream(): Observable<DraftNotificationEvent> {
    return this.notifications$.asObservable().pipe(
      map((event) => ({
        data: event,
      }))
    );
  }
}

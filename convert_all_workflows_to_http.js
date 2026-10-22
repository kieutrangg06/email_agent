const fs = require('fs');
const path = require('path');

const replacements = {
  'f1-node-04': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: "={{ 'http://localhost:4000/api/v1/audit/reputation?email=' + encodeURIComponent($('Payload Normalization').first().json.sender_email) }}",
      options: {}
    }
  },
  'f1-node-07': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/quarantine',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  sender_email: $('Payload Normalization').first().json.sender_email,\n  subject: $('Payload Normalization').first().json.subject,\n  raw_payload: $('Payload Normalization').first().json.raw_payload || $('Payload Normalization').first().json,\n  quarantine_reason: $('System/No-Reply Filter').first().json.is_system_email ? 'System/No-reply email rejected' : 'Quarantined by AI Spam & Phishing Classifier / Sender strike'\n}) }}",
      options: {}
    }
  },
  'f1-node-09': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/reputation/strike',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  sender_email: $('Payload Normalization').first().json.sender_email\n}) }}",
      options: {}
    }
  },
  'f1-node-11': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  source: 'flow01',\n  event_type: 'INBOUND_CLEAN_EMAIL_ACCEPTED',\n  workflow_id: 'flow01',\n  description: 'Inbound clean email accepted and verified through anti-spam filter',\n  payload_snapshot: $('Format Clean Payload').first().json,\n  payload: $('Format Clean Payload').first().json\n}) }}",
      options: {}
    }
  },
  'f2-node-05': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/tickets/triage/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  sender_email: $('Output Schema Guard').first().json.sender_email,\n  sender_name: $('Output Schema Guard').first().json.sender_name || 'Khách hàng',\n  subject: $('Output Schema Guard').first().json.subject,\n  body: String($('Output Schema Guard').first().json.body || $('Output Schema Guard').first().json.clean_body || '').substring(0, 250),\n  department: $('Output Schema Guard').first().json.department,\n  category: $('Output Schema Guard').first().json.category,\n  priority: $('Output Schema Guard').first().json.priority,\n  sentiment: $('Output Schema Guard').first().json.sentiment,\n  confidence_score: $('Output Schema Guard').first().json.confidence_score,\n  urgency_reason: $('Output Schema Guard').first().json.urgency_reason\n}) }}",
      options: {}
    }
  },
  'f2-node-10': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  source: 'flow02',\n  event_type: 'EMAIL_TRIAGED_SUCCESSFULLY',\n  workflow_id: 'flow02',\n  description: 'Email triaged successfully with department and SLA deadline assigned',\n  payload_snapshot: $('Compute SLA Window').first().json,\n  payload: $('Compute SLA Window').first().json\n}) }}",
      options: {}
    }
  },
  'f3-node-04': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: 'http://localhost:4000/api/v1/tickets/agents?category=Technical',
      options: {}
    }
  },
  'f3-node-07': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/tickets/agents/workload',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  agent_email: $('5. Least-Busy Load Balancer Code').first().json.agent_email,\n  agent_id: $('5. Least-Busy Load Balancer Code').first().json.assigned_agent_id\n}) }}",
      options: {}
    }
  },
  'f3-node-10': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  source: 'm1-flow3',\n  event_type: 'TICKET_DISPATCHED_TO_AGENT',\n  workflow_id: 'flow03_ticket_sla_dispatch',\n  description: 'Vé sự cố kỹ thuật đã được phân phối tự động cho KTV và kích hoạt SLA',\n  payload_snapshot: $('5. Least-Busy Load Balancer Code').first().json,\n  payload: $('5. Least-Busy Load Balancer Code').first().json\n}) }}",
      options: {}
    }
  },
  'f4-node-04': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/knowledge/search',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  query_embedding: $json?.embedding?.values || null,\n  top_k: 3\n}) }}",
      options: {}
    }
  },
  'f4-node-09': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'PATCH',
      url: "={{ 'http://localhost:4000/api/v1/tickets/' + encodeURIComponent($('2. Extract Search Query Keywords Code').first().json.ticket_code) + '/link-draft' }}",
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  draft_id: $('8. Insert Draft to Database HTTP').first().json.id\n}) }}",
      options: {}
    }
  },
  'f4-node-11': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  event_type: 'AI_REPLY_DRAFT_GENERATED',\n  workflow_id: 'flow04_rag_knowledge_draft',\n  description: 'Bản thảo phản hồi RAG đã được khởi tạo tự động và sẵn sàng cho HITL duyệt',\n  payload_snapshot: {\n    draft_id: $('8. Insert Draft to Database HTTP').first().json.id,\n    ticket_code: $('2. Extract Search Query Keywords Code').first().json.ticket_code,\n    customer_email: $('2. Extract Search Query Keywords Code').first().json.customer_email,\n    confidence_score: $('7. Draft Quality & HTML Polish Code').first().json.confidence_score,\n    fallback_used: $('5. Check Knowledge Relevance Code').first().json.fallback_used\n  }\n}) }}",
      options: {}
    }
  },
  'f5-node-03': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: "={{ 'http://localhost:4000/api/v1/drafts/' + Number($('1. Human Action Webhook Trigger').first().json.body?.draft_id || $('1. Human Action Webhook Trigger').first().json.draft_id || 1) }}",
      options: {}
    }
  },
  'f5-node-09': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/tickets/comments',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  ticket_code: $('4. Email Address Validation Code').first().json.ticket_code,\n  author_type: 'HUMAN_AGENT',\n  content: $('4. Email Address Validation Code').first().json.final_subject + ' | Đã gửi phản hồi thành công qua SMTP'\n}) }}",
      options: {}
    }
  },
  'f5-node-11': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  event_type: $('10. Calculate Resolution Time Code').first().json.sla_status || 'SLA_MET',\n  workflow_id: 'flow05_hitl_approval_send',\n  description: 'Đánh giá SLA cho vé ' + $('4. Email Address Validation Code').first().json.ticket_code + ': ' + $('10. Calculate Resolution Time Code').first().json.sla_status,\n  payload_snapshot: {\n    ticket_code: $('4. Email Address Validation Code').first().json.ticket_code,\n    resolution_time_ms: $('10. Calculate Resolution Time Code').first().json.resolution_time_ms,\n    resolution_time_minutes: $('10. Calculate Resolution Time Code').first().json.resolution_time_minutes,\n    sla_status: $('10. Calculate Resolution Time Code').first().json.sla_status,\n    reviewer_email: $('4. Email Address Validation Code').first().json.reviewer_email\n  }\n}) }}",
      options: {}
    }
  },
  'f5-node-12': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  event_type: 'OUTBOUND_EMAIL_SUCCESSFULLY_SENT',\n  workflow_id: 'flow05_hitl_approval_send',\n  description: 'Email phản hồi khách hàng đã được gửi thành công sau khi phê duyệt HITL',\n  payload_snapshot: {\n    draft_id: $('4. Email Address Validation Code').first().json.draft_id,\n    ticket_code: $('4. Email Address Validation Code').first().json.ticket_code,\n    recipient_email: $('4. Email Address Validation Code').first().json.recipient_email,\n    reviewer_email: $('4. Email Address Validation Code').first().json.reviewer_email,\n    final_subject: $('4. Email Address Validation Code').first().json.final_subject,\n    status: 'RESOLVED',\n    dispatched_at: new Date().toISOString()\n  }\n}) }}",
      options: {}
    }
  },
  'f6-node-02': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: 'http://localhost:4000/api/v1/digest/inbound-volume',
      options: {}
    }
  },
  'f6-node-03': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: 'http://localhost:4000/api/v1/digest/ticket-stats',
      options: {}
    }
  },
  'f6-node-07': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: 'http://localhost:4000/api/v1/digest/recipients',
      options: {}
    }
  },
  'f6-node-12': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  event_type: 'EXECUTIVE_DIGEST_COMPILED',\n  workflow_id: 'flow06_executive_digest',\n  description: 'Hoàn tất biên soạn và gửi báo cáo điều hành giám đốc hàng ngày',\n  payload_snapshot: {\n    summary_date: $('4. Detect Incident Spike Code').first().json.summary_date,\n    total_emails: $('4. Detect Incident Spike Code').first().json.total_emails_today,\n    total_tickets: $('4. Detect Incident Spike Code').first().json.total_tickets,\n    sla_compliance: $('4. Detect Incident Spike Code').first().json.sla_compliance_rate,\n    is_spike_detected: $('4. Detect Incident Spike Code').first().json.is_spike_detected,\n    compiled_at: new Date().toISOString()\n  }\n}) }}",
      options: {}
    }
  },
  'f7-node-05': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: "={{ 'http://localhost:4000/api/v1/crm/customers/by-email?email=' + encodeURIComponent($json.sender_email || '') }}",
      options: {}
    }
  },
  'f7-node-11': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  event_type: 'CRM_LEAD_QUALIFIED_AND_STORED',\n  workflow_id: 'flow07_crm_lead_scoring',\n  description: 'Đã bóc tách và phân loại khách hàng ' + ($json.clean_name || '') + ' điểm ' + ($json.lead_score || 0),\n  payload_snapshot: $json\n}) }}",
      options: {}
    }
  },
  'f8-node-02': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: 'http://localhost:4000/api/v1/crm/deals/stale',
      options: {}
    }
  },
  'f8-node-04': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: "={{ 'http://localhost:4000/api/v1/crm/deals/' + $json.deal_id }}",
      options: {}
    }
  },
  'f8-node-11': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  event_type: 'SALES_FOLLOWUP_DISPATCHED',\n  workflow_id: 'flow08_automated_followup',\n  description: 'Đã gửi email chăm sóc cho deal #' + $('5. Check Follow-up Stage Code').first().json.deal_id,\n  payload_snapshot: $('5. Check Follow-up Stage Code').first().json\n}) }}",
      options: {}
    }
  },
  'f9-node-11': {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'POST',
      url: 'http://localhost:4000/api/v1/audit/logs',
      sendHeaders: true,
      headerParameters: {
        parameters: [{ name: 'Content-Type', value: 'application/json' }]
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({\n  source: 'flow09',\n  event_type: 'INVOICE_OCR_PROCESSED',\n  workflow_id: 'flow09_invoice_multimodal_ocr',\n  description: $json.audit_notes || 'Invoice OCR processed',\n  payload_snapshot: $json,\n  payload: $json\n}) }}",
      options: {}
    }
  }
};

const dir = path.join(__dirname, 'workflows');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();

let totalConverted = 0;

for (const f of files) {
  const filePath = path.join(dir, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  for (const node of data.nodes || []) {
    if (replacements[node.id]) {
      const rep = replacements[node.id];
      node.type = rep.type;
      node.typeVersion = rep.typeVersion;
      node.parameters = rep.parameters;
      delete node.credentials; // Remove postgres credentials
      totalConverted++;
      modified = true;
      console.log(`[Converted] ${f} -> Node ID: ${node.id} ("${node.name}") to httpRequest`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}

console.log(`\n✅ Migration Complete: ${totalConverted}/26 nodes successfully converted to httpRequest!`);

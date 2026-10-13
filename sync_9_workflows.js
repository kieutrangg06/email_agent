const fs = require('fs');
const { Client } = require('./backend/node_modules/pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'admin',
  password: 'SecretPassword123!',
  database: 'email_automation_db',
});

const workflows = [
  ['wf01ingest000001', 'workflows/flow01_ingest_antispam.json'],
  ['wf02triage000001', 'workflows/flow02_department_triage.json'],
  ['wf03ticket000001', 'workflows/flow03_ticket_sla_dispatch.json'],
  ['wf04replyrag0001', 'workflows/member2_rag_intelligence/flow04_rag_knowledge_draft.json'],
  ['wf05approval0001', 'workflows/member2_rag_intelligence/flow05_hitl_approval_send.json'],
  ['wf06digest000001', 'workflows/member2_rag_intelligence/flow06_executive_digest.json'],
  ['wf07crmlead00001', 'workflows/member3_crm_invoices/flow07_crm_lead_scoring.json'],
  ['wf08followup0001', 'workflows/member3_crm_invoices/flow08_automated_followup.json'],
  ['wf09invoice00001', 'workflows/member3_crm_invoices/flow09_invoice_multimodal_ocr.json'],
];

async function sync() {
  await client.connect();
  for (const [id, file] of workflows) {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    const nodes = JSON.stringify(data.nodes || []);
    const conn = JSON.stringify(data.connections || {});
    const settings = JSON.stringify(data.settings || {});
    const name = data.name || 'Workflow';
    const versionId = 'v-' + Math.random().toString(36).substring(2, 12);

    await client.query(`
      INSERT INTO workflow_entity (id, name, active, nodes, connections, settings, "versionId", "createdAt", "updatedAt", "nodeGroups")
      VALUES ($1, $2, TRUE, $3::json, $4::json, $5::json, $6, NOW(), NOW(), '[]'::json)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        active = TRUE,
        nodes = EXCLUDED.nodes,
        connections = EXCLUDED.connections,
        settings = EXCLUDED.settings,
        "versionId" = EXCLUDED."versionId",
        "updatedAt" = NOW();
    `, [id, name, nodes, conn, settings, versionId]);

    // Also register webhooks in webhook_entity table
    const webhookNodes = (data.nodes || []).filter(n => n.type === 'n8n-nodes-base.webhook');
    for (const wn of webhookNodes) {
      const p = wn.parameters?.path;
      if (p) {
        const method = (wn.parameters?.httpMethod || 'GET').toUpperCase();
        const pLen = p.split('/').filter(Boolean).length;
        await client.query(`
          INSERT INTO webhook_entity ("webhookPath", method, node, "webhookId", "pathLength", "workflowId")
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT ("webhookPath", method) DO UPDATE SET
            node = EXCLUDED.node,
            "webhookId" = EXCLUDED."webhookId",
            "pathLength" = EXCLUDED."pathLength",
            "workflowId" = EXCLUDED."workflowId";
        `, [p, method, wn.name, wn.webhookId || null, pLen, id]);
        console.log(`  -> Registered Webhook: [${method}] /webhook/${p} (${wn.name})`);
      }
    }
    console.log(`Synced: ${id} -> ${name}`);
  }
  await client.end();
  console.log('Done! All 9 micro-workflows and webhooks are synced and active.');
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});

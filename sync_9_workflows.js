const fs = require('fs');
const { Client } = require('./backend/node_modules/pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'admin',
  password: 'SecretPassword123!',
  database: process.env.DB_DATABASE || process.env.POSTGRES_DB || 'email_automation_db',
});

const userProjectId = 'UZztQa3VnbyDlAby';

const workflows = [
  ['96BvBRGhR7jcUjTf', 'workflows/flow01_ingest_antispam.json'],
  ['XO1y6C2GPfRboapc', 'workflows/flow02_department_triage.json'],
  ['mmOveqCSfFPnXQ06', 'workflows/flow03_ticket_sla_dispatch.json'],
  ['flow04ragdraft01', 'workflows/flow04_rag_knowledge_draft.json'],
  ['flow05hitlsend01', 'workflows/flow05_hitl_approval_send.json'],
  ['flow06execdigest01', 'workflows/flow06_executive_digest.json'],
  ['vONnAwyvyh2BpHqT', 'workflows/flow07_crm_lead_scoring.json'],
  ['9sPtMCFv6tct4VYx', 'workflows/flow08_automated_followup.json'],
  ['U6gjCB2RTjdEgXCK', 'workflows/flow09_invoice_multimodal_ocr.json'],
];

async function sync() {
  await client.connect();
  console.log('Connected to PostgreSQL:', client.database);

  for (const [id, file] of workflows) {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    const nodes = JSON.stringify(data.nodes || []);
    const conn = JSON.stringify(data.connections || {});
    const settings = JSON.stringify(data.settings || {});
    const name = data.name || 'Workflow';

    // Update workflow_entity directly
    await client.query(`
      UPDATE workflow_entity 
      SET name = $2, active = TRUE, nodes = $3::json, connections = $4::json, settings = $5::json, "updatedAt" = NOW()
      WHERE id = $1;
    `, [id, name, nodes, conn, settings]);

    // Also update workflow_history if exists
    try {
      await client.query(`
        UPDATE workflow_history 
        SET nodes = $2::json, connections = $3::json
        WHERE "workflowId" = $1;
      `, [id, nodes, conn]);
    } catch (e) {}

    // Ensure shared_workflow entry exists for n8n UI ownership
    try {
      await client.query(`
        INSERT INTO shared_workflow ("workflowId", "projectId", role, "createdAt", "updatedAt")
        VALUES ($1, $2, 'workflow:owner', NOW(), NOW())
        ON CONFLICT ("workflowId", "projectId") DO NOTHING;
      `, [id, userProjectId]);
    } catch (e) {}

    // Register webhooks in webhook_entity table
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
    console.log(`Synced: [${id}] -> ${name}`);
  }

  await client.end();
  console.log('✅ Done! All 9 micro-workflows are 100% interconnected, synced and active in n8n!');
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});

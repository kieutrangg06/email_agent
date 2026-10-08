import json
import psycopg2

db_params = {
    'host': '127.0.0.1',
    'port': 5432,
    'user': 'admin',
    'password': 'password123',
    'database': 'email_automation_db'
}

workflows = [
    ('kF9PonvPPEg3hVEv', 'workflows/member-1/workflow-1-triage.json'),
    ('AcLvUy9HaJLqHdTN', 'workflows/member-1/workflow-2-tickets.json'),
    ('wf03replyrag0001', 'workflows/member-2/workflow-3-reply-rag.json'),
    ('wf04digest000001', 'workflows/member-2/workflow-4-digest.json'),
    ('wf05crmlead00001', 'workflows/member-3/workflow-5-crm-lead.json'),
    ('wf06invoic000001', 'workflows/member-3/workflow-6-invoice-ocr.json')
]

conn = psycopg2.connect(**db_params)
cur = conn.cursor()

for wf_id, file_path in workflows:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    nodes_json = json.dumps(data.get('nodes', []))
    conn_json = json.dumps(data.get('connections', {}))
    settings_json = json.dumps(data.get('settings', {}))
    name = data.get('name')
    
    cur.execute("""
        UPDATE workflow_entity 
        SET nodes = %s::json, 
            connections = %s::json, 
            settings = %s::json, 
            active = TRUE,
            "updatedAt" = NOW()
        WHERE id = %s;
    """, (nodes_json, conn_json, settings_json, wf_id))
    print(f"Updated workflow {wf_id} ({file_path}) -> {cur.rowcount} rows affected.")

conn.commit()
cur.close()
conn.close()
print("All workflows successfully synchronized to DB!")

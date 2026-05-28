import json, sys
sys.stdout.reconfigure(encoding='utf-8')

ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnF5amVsbnp3YWVzb2hpd3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDE2NzcsImV4cCI6MjA5NTM3NzY3N30.BhmBqgnbczJsVY8WoYq7pY3DVoTL297NB_PepjaclYA'
SUPABASE_URL = 'https://lpvqyjelnzwaesohiwwk.supabase.co'
SHEETS_CRED = {'googleSheetsOAuth2Api': {'id': 'FTpPj23iveMrq8Uw', 'name': 'Google Sheets '}}

with open('n8n/Proyecton8n.json', 'r', encoding='utf-8') as f:
    wf = json.load(f)

for n in wf['nodes']:
    # 1. Update first IF condition
    if n['id'] == 'b4d30b85-d6a6-4b88-ac70-e22a8c008dc0':
        n['name'] = '🎯 ¿Stock Crítico?'
        n['parameters']['conditions']['conditions'] = [{
            'id': 'cond-stock-critico',
            'leftValue': '={{ $json.Stock_Actual }}',
            'rightValue': 4,
            'operator': {'type': 'number', 'operation': 'lte'}
        }]
        print('OK IF condition: Stock_Actual <= 4')

    # 2. Update Cruzar node mensajeSlack logic
    elif n['name'] == '⚙️ Cruzar Lead + Inventario':
        code = n['parameters']['jsCode']
        code = code.replace(
            'generarOrden: stockBajo,',
            'generarOrden: stockUrgente || stockBajo,'
        )
        code = code.replace(
            'mensajeSlack: stockBajo ? msgCritico : msgOk,',
            'mensajeSlack: (stockUrgente || stockBajo) ? msgCritico : msgOk,'
        )
        code = code.replace(
            'mensajeFinal: stockBajo ? msgCritico : msgOk,',
            'mensajeFinal: (stockUrgente || stockBajo) ? msgCritico : msgOk,'
        )
        n['parameters']['jsCode'] = code
        print('OK Cruzar mensajeSlack fixed')

    # 3. Rename + update Respond: Sin accion (FALSE path)
    elif n['id'] == 'respond-ignored-001':
        n['name'] = '\U0001f501 Respond: Venta Normal'
        n['parameters']['responseBody'] = "={{ { status: 'ok', mensaje: 'Venta registrada — stock normal sin alerta critica', stock_post_venta: $json.Stock_Actual } }}"
        print('OK Respond: Venta Normal updated')

    # 4. Rename + update Respond: Orden Generada (TRUE/critical path)
    elif n['id'] == 'respond-critico-001':
        n['name'] = '\U0001f501 Respond: Alerta Crítica'
        n['parameters']['responseBody'] = "={{ { status: 'alerta', alerta: $json.estadoStock, orden_generada: $json.generarOrden, producto: $json.producto, stock_post_venta: $json.stockActual, mensaje: 'Alerta critica — Slack + Gemini enviado' } }}"
        print('OK Respond: Alerta Crítica updated')

# 5. Add new Sheets update for normal path
sheets_normal = {
    'parameters': {
        'operation': 'update',
        'documentId': {
            '__rl': True, 'value': '1mqKIJnD6fNjPokLzC-82BG4ufo0zgMpxEvsowmOWq9M',
            'mode': 'list', 'cachedResultName': 'NovaSync'
        },
        'sheetName': {
            '__rl': True, 'value': 544319994, 'mode': 'list',
            'cachedResultName': 'Inventario',
            'cachedResultUrl': 'https://docs.google.com/spreadsheets/d/1mqKIJnD6fNjPokLzC-82BG4ufo0zgMpxEvsowmOWq9M/edit#gid=544319994'
        },
        'columns': {
            'mappingMode': 'defineBelow',
            'value': {
                'Código': '={{ $json.Codigo }}',
                'Stock Actual': '={{ $json.Stock_Actual }}'
            },
            'matchingColumns': ['Código'],
            'schema': [
                {'id': 'Código', 'displayName': 'Código', 'required': False, 'defaultMatch': True, 'display': True, 'type': 'string', 'canBeUsedToMatch': True, 'removed': False},
                {'id': 'Stock Actual', 'displayName': 'Stock Actual', 'required': False, 'defaultMatch': False, 'display': True, 'type': 'string', 'canBeUsedToMatch': True, 'removed': False}
            ]
        },
        'options': {}
    },
    'id': 'sheets-normal-001',
    'name': '\U0001f504 Sheets — Venta Normal',
    'type': 'n8n-nodes-base.googleSheets',
    'typeVersion': 4,
    'position': [-100, 900],
    'credentials': SHEETS_CRED
}

# 6. Add Supabase REST update node
supabase_node = {
    'parameters': {
        'method': 'PATCH',
        'url': '=' + SUPABASE_URL + '/rest/v1/products?codigo=eq.{{ $json.Codigo }}',
        'sendHeaders': True,
        'headerParameters': {
            'parameters': [
                {'name': 'apikey', 'value': ANON_KEY},
                {'name': 'Authorization', 'value': 'Bearer ' + ANON_KEY},
                {'name': 'Content-Type', 'value': 'application/json'},
                {'name': 'Prefer', 'value': 'return=minimal'}
            ]
        },
        'sendBody': True,
        'contentType': 'json',
        'specifyBody': 'json',
        'jsonBody': '={{ JSON.stringify({ stock_actual: $json.Stock_Actual }) }}',
        'options': {'response': {'response': {'neverError': True}}}
    },
    'id': 'supabase-update-001',
    'name': '\U0001f310 Actualizar Supabase',
    'type': 'n8n-nodes-base.httpRequest',
    'typeVersion': 4.2,
    'position': [-100, 1040]
}

wf['nodes'].append(sheets_normal)
wf['nodes'].append(supabase_node)
print('OK 2 new nodes added')

# 7. Rebuild connections
old_if = '🎯 ¿Es una venta real?'
new_if = '🎯 ¿Stock Crítico?'

# Rename connection key
if old_if in wf['connections']:
    wf['connections'][new_if] = wf['connections'].pop(old_if)

# Fix any incoming refs to old name
for src, targets in wf['connections'].items():
    for port_list in targets.get('main', []):
        for t in port_list:
            if t.get('node') == old_if:
                t['node'] = new_if

# FALSE path: Sheets Normal + Supabase + Respond: Venta Normal
venta_normal_name = '\U0001f501 Respond: Venta Normal'
wf['connections'][new_if]['main'][1] = [
    {'node': '\U0001f504 Sheets — Venta Normal', 'type': 'main', 'index': 0},
    {'node': '\U0001f310 Actualizar Supabase', 'type': 'main', 'index': 0},
    {'node': venta_normal_name, 'type': 'main', 'index': 0},
]

# Cruzar fan-out: Preparar Prompt + Sheets + Ops_Alertas + Respond: Alerta Crítica
alerta_name = '\U0001f501 Respond: Alerta Crítica'
cruzar = '⚙️ Cruzar Lead + Inventario'
wf['connections'][cruzar]['main'][0] = [
    {'node': '⚙️ Preparar Prompt Alerta', 'type': 'main', 'index': 0},
    {'node': '🔄 Actualizar Stock en Sheets', 'type': 'main', 'index': 0},
    {'node': '📊 Registrar en Ops_Alertas', 'type': 'main', 'index': 0},
    {'node': alerta_name, 'type': 'main', 'index': 0},
]
print('OK connections rebuilt')

# Print final flow
print()
print('=== FINAL FLOW ===')
for src, targets in wf['connections'].items():
    for i, port in enumerate(targets.get('main', [])):
        label = 'TRUE' if i==0 else 'FALSE'
        for t in port:
            print(f'  [{label}] {src} -> {t["node"]}')

with open('n8n/Proyecton8n.json', 'w', encoding='utf-8') as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)
print()
print('Saved OK')

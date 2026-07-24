import os
import re
import requests
import json

def parse_env_file(filepath):
    env_vars = {}
    if not os.path.exists(filepath):
        return env_vars
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            match = re.match(r'^\s*([\w\.\-]+)\s*=\s*(.*)\s*$', line)
            if match:
                key = match.group(1)
                value = match.group(2).strip('\'"')
                env_vars[key] = value
    return env_vars

def main():
    env_path = r"c:\Users\Usuário\Downloads\Tecnologia e Projetos\reLead-plataforma\.env.local"
    env_vars = parse_env_file(env_path)
    
    supabase_url = env_vars.get('REACT_APP_SUPABASE_URL')
    supabase_key = env_vars.get('REACT_APP_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("[ERROR] Supabase URL or Anon Key not found in .env.local")
        return
        
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    # 1. Delete old test records from leads_reativacao to avoid "Already Sent" skip
    target_phones = ["41991156633", "5541991156633", "554188437336", "4188437336"]
    phone_filter = ",".join(target_phones)
    delete_url = f"{supabase_url}/rest/v1/leads_reativacao?telefone=in.({phone_filter})"
    
    print(f"Deleting existing records for phones: {target_phones}")
    del_res = requests.delete(delete_url, headers=headers)
    if del_res.status_code in (200, 204):
        print("[OK] Deleted old records successfully.")
    else:
        print(f"[WARNING] Could not delete old records: {del_res.status_code} - {del_res.text}")
        
    # 2. Insert fresh Pendente leads
    test_leads = [
        {
            "telefone": "41991156633",
            "nome_lead": "Luan Teste",
            "tipo_campanha": "reativacao",
            "status_reativacao": "Pendente",
            "mensagem_enviada": "constant_txt",
            "nome_campanha": "Teste Agente Antigravity"
        },
        {
            "telefone": "554188437336",
            "nome_lead": "Gabi Teste",
            "tipo_campanha": "reativacao",
            "status_reativacao": "Pendente",
            "mensagem_enviada": "constant_txt",
            "nome_campanha": "Teste Agente Antigravity"
        }
    ]
    
    insert_url = f"{supabase_url}/rest/v1/leads_reativacao"
    headers_insert = headers.copy()
    headers_insert["Prefer"] = "return=representation"
    
    print("Inserting fresh test leads...")
    ins_res = requests.post(insert_url, json=test_leads, headers=headers_insert)
    if ins_res.status_code not in (200, 201):
        print(f"[ERROR] Failed to insert leads. Status: {ins_res.status_code}")
        print(ins_res.text)
        return
        
    inserted_data = ins_res.json()
    print(f"[OK] Successfully inserted {len(inserted_data)} leads:")
    for lead in inserted_data:
        print(f"   - ID: {lead['id']} | Nome: {lead['nome_lead']} | Telefone: {lead['telefone']} | Status: {lead['status_reativacao']}")
        
    # 3. Trigger the n8n webhook
    n8n_webhook_url = "https://n8n.srv1214309.hstgr.cloud/webhook/disparo-manual-planilha"
    print(f"Triggering n8n webhook at: {n8n_webhook_url}")
    
    payload = {
        "status": "iniciar",
        "nome_campanha": "Teste Agente Antigravity",
        "tipo_campanha": "reativacao",
        "template_id": "constant_txt"
    }
    
    n8n_response = requests.post(n8n_webhook_url, json=payload)
    if n8n_response.status_code == 200:
        print("[OK] Webhook triggered successfully!")
        print("Response:", n8n_response.json())
    else:
        print(f"[ERROR] Failed to trigger webhook. Status: {n8n_response.status_code}")
        print(n8n_response.text)

if __name__ == '__main__':
    main()

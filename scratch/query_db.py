import os
import re
import requests

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
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    url = f"{supabase_url}/rest/v1/leads_reativacao?telefone=in.(41991156633,554188437336,5541991156633,4188437336)"
    res = requests.get(url, headers=headers)
    print("Leads in leads_reativacao:")
    if res.status_code == 200:
        data = res.json()
        for d in data:
            print(f"ID: {d['id']} | Nome: {d['nome_lead']} | Telefone: {d['telefone']} | Status: {d['status_reativacao']} | Envio: {d['data_envio']}")
    else:
        print(f"Error {res.status_code}: {res.text}")

if __name__ == '__main__':
    main()

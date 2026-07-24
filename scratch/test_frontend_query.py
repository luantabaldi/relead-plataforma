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
    
    # We simulate dataInicio and dataFim
    # In Javascript:
    # dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    # dataFim = new Date().toISOString()
    # Let's check with current time in UTC: 2026-06-05T14:12:46.000Z (simulated local time 11:12:46 UTC-3)
    data_inicio = "2026-05-06T14:12:46.000Z"
    data_fim = "2026-06-05T14:12:46.000Z"
    
    url = f"{supabase_url}/rest/v1/leads_reativacao?data_envio=gte.{data_inicio}&data_envio=lte.{data_fim}&order=data_envio.desc"
    
    print(f"Query URL: {url}")
    res = requests.get(url, headers=headers)
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Total returned: {len(data)}")
        for d in data[:10]:
            print(f"ID: {d['id']} | Nome: {d['nome_lead']} | Telefone: {d['telefone']} | Envio: {d['data_envio']}")
    else:
        print(res.text)

if __name__ == '__main__':
    main()

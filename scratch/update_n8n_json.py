import json
import os

filepath = r"c:\Users\Usuário\Downloads\Tecnologia e Projetos\reLead-plataforma\Salva Lead — 2. Atendimento IA.json"

print(f"Loading {filepath}...")
with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

def update_nodes(nodes_list):
    updated_count = 0
    for node in nodes_list:
        node_id = node.get("id")
        if node_id == "update-lead-status":
            url = node.get("parameters", {}).get("url", "")
            if "telefone=eq." in url:
                new_url = "=https://jwtbdrpgtotgkhdbckaj.supabase.co/rest/v1/leads_reativacao?or=(telefone.eq.{{ $('Roteador Meta').first().json.telefone }},telefone.eq.{{ $('Roteador Meta').first().json.telefone.length === 13 ? $('Roteador Meta').first().json.telefone.slice(0, 4) + $('Roteador Meta').first().json.telefone.slice(5) : $('Roteador Meta').first().json.telefone }})"
                node["parameters"]["url"] = new_url
                print("Updated update-lead-status node URL.")
                updated_count += 1
        elif node_id == "marcar-reativado":
            url = node.get("parameters", {}).get("url", "")
            if "telefone=eq." in url:
                new_url = "=https://jwtbdrpgtotgkhdbckaj.supabase.co/rest/v1/leads_reativacao?or=(telefone.eq.{{ $('Processar Resposta IA').first().json.telefone }},telefone.eq.{{ $('Processar Resposta IA').first().json.telefone.length === 13 ? $('Processar Resposta IA').first().json.telefone.slice(0, 4) + $('Processar Resposta IA').first().json.telefone.slice(5) : $('Processar Resposta IA').first().json.telefone }})"
                node["parameters"]["url"] = new_url
                print("Updated marcar-reativado node URL.")
                updated_count += 1
    return updated_count

# Update root nodes
count_root = update_nodes(data.get("nodes", []))

# Update activeVersion nodes if exists
count_active = 0
if "activeVersion" in data and "nodes" in data["activeVersion"]:
    count_active = update_nodes(data["activeVersion"]["nodes"])

print(f"Updated {count_root} root nodes and {count_active} activeVersion nodes.")

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Saved updated JSON successfully.")

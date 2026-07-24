import requests

def main():
    n8n_webhook_url = "https://n8n.srv1214309.hstgr.cloud/webhook/disparo-manual-planilha"
    print(f"Triggering n8n webhook at: {n8n_webhook_url}")
    
    payload = {
        "status": "iniciar",
        "nome_campanha": "Teste Agente Antigravity",
        "tipo_campanha": "reativacao",
        "template_id": "constant_txt"
    }
    
    n8n_response = requests.post(n8n_webhook_url, json=payload)
    print(f"Webhook Status Code: {n8n_response.status_code}")
    print("Response text:", n8n_response.text)

if __name__ == '__main__':
    main()

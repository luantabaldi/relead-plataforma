# 🔗 Setup: Webhook Vista → n8n (Real-time)

## 📋 Visão Geral

Configurar o Vista CRM para disparar um webhook quando um lead for vinculado a um corretor, enviando os dados em tempo real para o n8n processar e notificar via WhatsApp.

```
Lead vinculado no Vista
    ↓
Vista dispara POST webhook
    ↓
n8n recebe dados
    ↓
n8n envia WhatsApp ao corretor (tempo real ✅)
```

---

## 🎯 URL do Webhook do n8n

Você vai precisar da URL abaixo para configurar no Vista:

```
https://n8n.srv1214309.hstgr.cloud/webhook/vista-lead-corretor
```

**Chave de Autenticação (do Vista):**
```
11877796113964f4c1bef7b03f80b1b4
```

---

## ⚙️ Passo 1: Descobrir Estrutura do Webhook (Vista)

Primeiro, você precisa saber **qual é a estrutura dos dados** que o Vista envia no webhook.

### Opção A: Verificar Documentação Vista
- Acesse: https://cli43769-rest.vistahost.com.br/doc/
- Procure por: **"Webhook"** ou **"Integration Events"**
- Anote a estrutura do payload (exemplo abaixo)

### Opção B: Testar Manualmente
1. Configure o webhook no Vista para chamar um servidor de teste
2. Use **webhook.site** ou **RequestBin** para capturar o payload
3. Analise a estrutura

### Estrutura Esperada (Exemplo)

```json
{
  "event": "lead_assigned_to_agent",
  "timestamp": "2024-08-20T10:30:00Z",
  "data": {
    "lead_id": "456",
    "lead_name": "João Silva",
    "agent_id": "123",
    "agent_name": "Maria Silva",
    "agent_phone": "+5511999999999",
    "property_id": "789"
  }
}
```

**⚠️ A estrutura real do Vista pode ser diferente. Você precisa validar.**

---

## 🔧 Passo 2: Configurar Webhook no Vista

### 2.1: Acessar Integrações Vista
1. Abra o Vista CRM
2. Vá para: **Sistema** → **Integrações** → **Webhooks**
3. Clique em **"Configurar Webhook"** ou **"Novo Webhook"**

### 2.2: Preencher Dados do Webhook

| Campo | Valor |
|-------|-------|
| **URL** | `https://n8n.srv1214309.hstgr.cloud/webhook/vista-lead-corretor` |
| **Método** | `POST` |
| **Eventos** | `lead_assigned_to_agent` ou similar |
| **Autenticação** | `Header Auth` |
| **Header Name** | `Authorization` |
| **Header Value** | `Bearer 11877796113964f4c1bef7b03f80b1b4` |
| **Content-Type** | `application/json` |

### 2.3: Configurar Eventos
Selecione o evento: **Lead vinculado ao corretor** ou similar
- Pode estar em: "Lead Assigned", "Agent Assignment", "Broker Assignment"

### 2.4: Salvar e Testar
1. Clique em **"Salvar"**
2. Clique em **"Testar Webhook"** (se disponível)
3. Verifique se recebe resposta `200 OK`

---

## 🛠️ Passo 3: Atualizar Workflow n8n

Após você informar a estrutura do payload do Vista, vou:

1. Ajustar o webhook do n8n para aceitar os dados corretos
2. Mapear os campos (agent_id, agent_phone, lead_name, etc)
3. Enviar WhatsApp com as informações certas

---

## ✅ Checklist

- [ ] Descobrir estrutura do webhook Vista (formato JSON)
- [ ] Criar webhook no Vista com URL do n8n
- [ ] Configurar autenticação (header + chave)
- [ ] Testar webhook (gerar evento no Vista)
- [ ] Atualizar workflow n8n com estrutura correta
- [ ] Testar fluxo completo (Lead → Vista → n8n → WhatsApp)
- [ ] Ativar workflow n8n em produção

---

## 📝 Próximas Ações

1. **Responder:** Qual é a estrutura do payload que Vista envia?
2. **Atualizar:** Vou ajustar o workflow n8n
3. **Testar:** Vincular um lead no Vista e confirmar WhatsApp
4. **Ativar:** Colocar em produção

---

## 🆘 Troubleshooting

### "Webhook não é acionado"
- ✅ Verifique se configurou o evento correto no Vista
- ✅ Verifique se a URL está correta (copie exatamente)
- ✅ Teste vincular um lead manualmente no Vista

### "Erro 401/403"
- ✅ Verifique se o header `Authorization` está correto
- ✅ Verifique se usa `Bearer [chave]` (com "Bearer" no início)
- ✅ Copie a chave exatamente: `11877796113964f4c1bef7b03f80b1b4`

### "n8n não recebe dados"
- ✅ Abra o workflow e clique em **"Test Webhook"**
- ✅ Execute o evento no Vista
- ✅ Verifique os logs no n8n

---

**Status:** Aguardando estrutura do payload Vista  
**Data:** 2026-08-20

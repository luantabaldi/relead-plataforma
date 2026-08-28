# ⚙️ Configuração do Workflow n8n - Lead Corretor WhatsApp

**Workflow ID:** `bbBb8WW8SCW9KaAz`

---

## 🔧 1. Configurar Credenciais da API Vista

### Passo 1.1: Criar Credencial HTTP com Header Auth
1. No n8n, vá para **Credentials** (canto inferior esquerdo)
2. Clique em **New Credential**
3. Procure por `Header Auth` (ou `HTTP Header Auth`)
4. Preencha:
   - **Name:** `Vista API Key`
   - **Header Name:** `X-API-Key`
   - **Header Value:** `b3172f147b68819c392198f57f0c83cc` (sua chave)

### Passo 1.2: Atribuir ao Workflow
1. Abra o workflow `Lead Corretor - Notificação WhatsApp (Vista)`
2. Clique no node **"Buscar Corretor - Vista API"** (HTTP Request)
3. Na seção **Authentication**, selecione a credencial `Vista API Key`
4. Verifique se a URL está correta (veja passo 2.2)

---

## 🌐 2. Configurar Endpoint da API Vista

### Passo 2.1: Verificar Documentação da API
**Você precisa determinar o endpoint exato para buscar dados do corretor.**

De acordo com a documentação Vista, o endpoint deve ser um dos seguintes:

```
Option A (REST direto):
https://cli20043-rest.vistahost.com.br/api/v1/agents/{id}
https://cli20043-rest.vistahost.com.br/api/v2/agents/{id}

Option B (Método específico):
https://cli20043-rest.vistahost.com.br/v1/AgentInfo?agentId={id}

Option C (SOAP/XML):
https://cli20043-rest.vistahost.com.br/soap/agent
```

**⚠️ Ação necessária:**
- Acesse https://cli43769-rest.vistahost.com.br/doc/ 
- Procure pelo método de busca de corretor/agent
- Anote o **endpoint exato** e o **formato da resposta**

### Passo 2.2: Ajustar URL no Node HTTP Request

1. Abra o node **"Buscar Corretor - Vista API"**
2. Na seção **URL**, substitua:
   ```
   DE: https://cli20043-rest.vistahost.com.br/api/v1/agents/{{ $json.body.corretor_id }}
   PARA: [seu endpoint encontrado acima]
   ```

3. Clique em **Test** para validar a conexão

---

## 🔐 3. Configurar Credenciais do WhatsApp Business API

### Passo 3.1: Criar Credencial WhatsApp

1. No n8n, vá para **Credentials** 
2. Clique em **New Credential**
3. Procure por `WhatsApp Business Cloud API`
4. Preencha:
   - **Business Account ID:** (seu ID da conta Meta)
   - **Access Token:** (token de acesso da API WhatsApp)
   - **Recipient Verification:** (desabilitar se em fase de teste)

### Passo 3.2: Atribuir ao Workflow

1. Abra o node **"Enviar WhatsApp Template"**
2. Selecione a credencial do WhatsApp criada acima
3. Preencha o **Phone Number ID** (seu número de telefone vinculado)

---

## 🌍 4. Configurar Variáveis de Ambiente

### Passo 4.1: Definir Environment Variables

O workflow usa variáveis de ambiente. No n8n:

1. Vá para **Settings** → **Environment Variables**
2. Crie as seguintes variáveis:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VISTA_API_KEY` | `b3172f147b68819c392198f57f0c83cc` | Chave de API da Vista |
| `WHATSAPP_PHONE_NUMBER_ID` | `123456789123456` | ID do número de telefone WhatsApp |

---

## 📝 5. Estrutura de Dados Esperada

### Entrada do Webhook

Seu sistema deve fazer **POST** para:
```
https://[seu-n8n-instance]/webhook/lead-corretor-vinculado
```

**Payload esperado:**
```json
{
  "corretor_id": "123",
  "lead_id": "456",
  "lead_nome": "João Silva"
}
```

**Exemplo de curl para testar:**
```bash
curl -X POST https://[seu-n8n-instance]/webhook/lead-corretor-vinculado \
  -H "Content-Type: application/json" \
  -d '{
    "corretor_id": "123",
    "lead_id": "456",
    "lead_nome": "João Silva"
  }'
```

### Resposta da API Vista

A API Vista deve retornar algo assim:
```json
{
  "data": {
    "Nome": "Maria Silva",
    "Fone": "+5511999999999",
    "E_mail": "maria@example.com",
    "Creci": "123456"
  }
}
```

**⚠️ Se a estrutura for diferente:**
- Anote a estrutura real da resposta
- Edite o node **"Extrair Dados do Corretor"** para mapear corretamente

---

## 💬 6. Configurar Template WhatsApp

### Passo 6.1: Verificar Template no Meta

1. Acesse Meta Business Manager → WhatsApp → Mensagens → Templates
2. Verifique seu template `recebimento_lead_vista`
3. **Anote a estrutura exata:**
   - Quantas variáveis tem no corpo da mensagem?
   - Quantas variáveis tem na URL?

### Passo 6.2: Template Esperado

Seu template deve ter a seguinte estrutura (exemplo):

```
Olá {{1}},

Novo lead recebido: {{2}}

ID: {{3}}

Acesse o sistema para mais detalhes.

[Botão URL com parâmetro {{4}}]
```

Onde:
- `{{1}}` = Nome do corretor (Maria Silva)
- `{{2}}` = Nome do lead (João Silva)
- `{{3}}` = ID do lead (456)
- `{{4}}` = Parâmetro na URL (ID do lead)

### Passo 6.3: Ajustar se Necessário

Se o template tiver uma estrutura diferente:

1. Abra o node **"Enviar WhatsApp Template"**
2. Ajuste os **Body Parameters** (variáveis de texto)
3. Ajuste os **Button Parameters** (variáveis de URL)

---

## ✅ 7. Teste Completo

### Passo 7.1: Teste Unitário - Cada Node

1. Webhook: Clique em **Test webhook** e verifique se recebe dados
2. HTTP Request: Clique em **Execute** e confirme retorno da API Vista
3. Set: Verifique se extrai dados corretamente
4. WhatsApp: Execute e confirme envio da mensagem

### Passo 7.2: Teste Integrado - Workflow Completo

1. Copie a URL do webhook (será mostrada após salvar)
2. Use **Postman** ou **curl** para fazer teste:

```bash
curl -X POST [webhook-url] \
  -H "Content-Type: application/json" \
  -d '{
    "corretor_id": "123",
    "lead_id": "456",
    "lead_nome": "João Silva"
  }'
```

3. Verifique se a mensagem foi enviada para o WhatsApp

---

## 🚀 8. Ativar Workflow

Quando tudo estiver configurado e testado:

1. Abra o workflow
2. Clique em **Activate** (botão no canto superior direito)
3. O status mudará para **Active**

---

## 📊 Fluxo de Dados

```
1. WEBHOOK recebe evento
   └─> { corretor_id: "123", lead_id: "456", lead_nome: "João Silva" }

2. HTTP REQUEST busca dados na Vista
   └─> { data: { Nome: "Maria", Fone: "+55119999", ... } }

3. SET extrai e mapeia dados
   └─> { telefone_whatsapp: "+55119999", nome_corretor: "Maria", ... }

4. WHATSAPP envia template
   └─> ✅ Mensagem enviada com sucesso
```

---

## 🆘 Troubleshooting

### "Webhook não recebe dados"
- ✅ Verifique se a URL está correta
- ✅ Verifique se seu sistema está enviando POST (não GET)
- ✅ Verifique se content-type é `application/json`

### "Erro 401/403 na API Vista"
- ✅ Verifique se a chave de API `b3172f147b68819c392198f57f0c83cc` é válida
- ✅ Verifique se o header é `X-API-Key` (ou outro conforme documentação)
- ✅ Verifique se o IP está autorizado

### "Corretor não encontrado"
- ✅ Verifique se `corretor_id` é enviado corretamente
- ✅ Verifique se o ID existe na base Vista
- ✅ Verifique o endpoint (talvez o formato de URL esteja errado)

### "WhatsApp não envia"
- ✅ Verifique se Access Token é válido
- ✅ Verifique se Phone Number ID está correto
- ✅ Verifique se template está **APROVADO** no Meta
- ✅ Verifique se número tem country code (+55...)
- ✅ Verifique se a estrutura do template bate

### "Erro de Tipos de Parâmetro"
- ✅ Verifique se o número tem apenas dígitos (sem espaços, hífens)
- ✅ Verifique se as variáveis estão sendo preenchidas (não vazias)

---

## 📞 Próximas Etapas

1. ✅ Configurar credenciais Vista
2. ✅ Validar endpoint da API Vista
3. ✅ Configurar credenciais WhatsApp
4. ✅ Testar cada node individualmente
5. ✅ Testar workflow completo via webhook
6. ✅ Ativar workflow
7. ✅ Integrar no seu sistema de CRM/Lead

---

**Data de Criação:** 2026-08-20  
**Status:** Pronto para Configuração  
**Próxima Ação:** Validar endpoint da API Vista

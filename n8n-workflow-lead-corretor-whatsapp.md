# Workflow n8n: Notificação WhatsApp Corretor

## 📋 Visão Geral

Workflow que envia notificação via WhatsApp ao corretor quando um lead é vinculado na etapa de prospecção do pipeline de venda.

**Fluxo:**
```
Webhook (lead vinculado) → Buscar corretor no Supabase → Extrair dados → Enviar WhatsApp Template
```

---

## 🔧 Configuração Pré-Requisitos

Antes de criar o workflow, certifique-se que você tem:

### 1. **WhatsApp Business API (Meta)**
- ✅ Conta Meta Business
- ✅ Número de telefone vinculado
- ✅ **Business Phone Number ID** (ex: `123456789123456`)
- ✅ Template criado e aprovado no Meta
- ✅ **Template Name** (ex: `novo_lead_atribuido`)
- ✅ **Access Token** do WhatsApp Business API

### 2. **Supabase**
- ✅ Tabela `corretores` com campos:
  - `id` (Primary Key)
  - `nome`
  - `telefone_whatsapp` (formato: `+55XXXXXXXXXXXXX`)
  - Outros campos conforme necessário

### 3. **Sistema de CRM/Lead**
- ✅ Possibilidade de enviar webhook quando lead vincular corretor
- ✅ Incluir `corretor_id` no payload

---

## 📝 Estrutura do Webhook

Seu sistema deve fazer POST para:
```
https://your-n8n-instance.com/webhook/lead-corretor-vinculado
```

**Payload esperado:**
```json
{
  "corretor_id": "123",
  "lead_id": "456",
  "lead_nome": "João Silva",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🛠️ Estrutura do Workflow no n8n

### Node 1: Webhook Trigger
**Nome:** `Webhook - Lead Vinculado`

**Tipo:** Webhook  
**Versão:** 2.1

**Configuração:**
```
- Path: lead-corretor-vinculado
- HTTP Method: POST
- Response Mode: onReceived
- Authentication: none
```

---

### Node 2: Buscar Dados do Corretor
**Nome:** `Buscar Corretor no Supabase`

**Tipo:** Supabase  
**Versão:** 1  
**Resource:** row  
**Operation:** getAll

**Configuração:**
```
- Table: corretores (AJUSTE CONFORME SUA TABELA)
- Return All: false
- Limit: 1
- Filter Type: manual
- Match Type: allFilters

Condições do Filtro:
- Field: id (AJUSTE SE NECESSÁRIO)
- Condition: eq
- Value: ={{ $json.body.corretor_id }}
```

**Credencial:** Supabase (configure com sua URL e chave de API)

---

### Node 3: Extrair Dados (Transform)
**Nome:** `Extrair Dados`

**Tipo:** Set  
**Versão:** 3.4

**Configuração - Assignments:**

| Name | Value | Type |
|------|-------|------|
| `telefone` | `={{ $json[0].telefone_whatsapp }}` | string |
| `nome` | `={{ $json[0].nome }}` | string |
| `id_corretor` | `={{ $json[0].id }}` | string |

> ⚠️ **Ajuste os nomes dos campos conforme seus campos reais no Supabase**

---

### Node 4: Enviar WhatsApp Template
**Nome:** `Enviar WhatsApp`

**Tipo:** WhatsApp Business Cloud  
**Versão:** 1.1  
**Resource:** message  
**Operation:** sendTemplate

**Configuração:**
```
- Phone Number ID: YOUR_PHONE_NUMBER_ID (ex: 123456789123456)
- Recipient Phone Number: ={{ $json.telefone }}
- Template: seu_template_name (ex: novo_lead_atribuido)
- Components → Body Parameters:
  - Parameter Type: text
  - Text: ={{ $json.nome }}
```

**Credencial:** WhatsApp Business API (configure com seu Access Token)

---

## 🔗 Conexões do Workflow

```
Webhook → Buscar Corretor no Supabase
         ↓
      Extrair Dados
         ↓
      Enviar WhatsApp
```

Wiring:
- **Webhook → Supabase:** main[0] → main input
- **Supabase → Set:** main[0] → main input
- **Set → WhatsApp:** main[0] → main input

---

## 🎯 Variáveis do Template WhatsApp

O template deve ter a seguinte estrutura (exemplo):

**Template Name:** `novo_lead_atribuido`

**Conteúdo (exemplo):**
```
Olá {{1}},

Você tem um novo lead atribuído! 
Acesse o sistema para mais detalhes.

Abraços,
reLead
```

Onde `{{1}}` é substituído pelo nome do corretor.

---

## 🧪 Testando o Workflow

### Teste 1: Validar Webhook
1. Copie a URL do webhook (será gerada após criar o workflow)
2. Use Postman ou curl para testar:

```bash
curl -X POST https://your-n8n.com/webhook/lead-corretor-vinculado \
  -H "Content-Type: application/json" \
  -d '{
    "corretor_id": "123",
    "lead_id": "456",
    "lead_nome": "João Silva",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### Teste 2: Validar Credenciais
- ✅ Teste Supabase: Verifique se consegue buscar dados
- ✅ Teste WhatsApp: Envie uma mensagem de teste

### Teste 3: Execução Completa
1. Ative o workflow (status: ativo)
2. Dispare o webhook com dados de teste
3. Verifique se a mensagem foi enviada no WhatsApp

---

## 📊 Dados que Fluem pelo Workflow

### Após Webhook:
```json
{
  "body": {
    "corretor_id": "123",
    "lead_id": "456",
    "lead_nome": "João Silva",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "headers": { ... },
  "query": { ... },
  "params": { ... }
}
```

### Após Supabase:
```json
[
  {
    "id": "123",
    "nome": "Maria Silva",
    "telefone_whatsapp": "+5511999999999",
    "email": "maria@example.com",
    "created_at": "2024-01-10T..."
  }
]
```

### Após Set (Extrair Dados):
```json
{
  "telefone": "+5511999999999",
  "nome": "Maria Silva",
  "id_corretor": "123"
}
```

---

## ⚙️ Ajustes Necessários

Antes de ativar, substitua:

| Placeholder | Onde Encontrar | Exemplo |
|------------|----------------|---------|
| `YOUR_PHONE_NUMBER_ID` | Meta Business Manager | `123456789123456` |
| `seu_template_name` | Meta Business Manager → Templates | `novo_lead_atribuido` |
| `corretores` (tabela) | Seu Supabase | Pode ser `agents`, `brokers`, etc |
| `telefone_whatsapp` (campo) | Seu Supabase | Campo que armazena WhatsApp |
| `nome` (campo) | Seu Supabase | Campo do nome do corretor |

---

## 🔐 Segurança

### Boas Práticas:
- ✅ Use credenciais via n8n (não hardcode tokens)
- ✅ Adicione autenticação no webhook se necessário
- ✅ Registre logs de mensagens enviadas
- ✅ Implemente tratamento de erros
- ✅ Monitore falhas de envio

### Tratamento de Erros (Opcional):
Adicione um node "Error Trigger" após WhatsApp para capturar falhas:
- Falha na busca do corretor → Log ou notificação
- Falha no envio de WhatsApp → Retry ou alerta

---

## 📋 Checklist de Implementação

- [ ] Credencial Supabase configurada
- [ ] Credencial WhatsApp Business API configurada
- [ ] Tabela `corretores` existe e tem dados
- [ ] Template WhatsApp aprovado no Meta
- [ ] Webhook criado e URL anotada
- [ ] Sistema de CRM configurado para enviar webhook
- [ ] Teste com dados de desenvolvimento
- [ ] Workflow ativado
- [ ] Monitoramento configurado

---

## 🆘 Troubleshooting

### "Webhook não recebe dados"
- ✅ Verifique se a URL está correta
- ✅ Verifique se o sistema está enviando POST (não GET)
- ✅ Verifique content-type: application/json

### "Corretor não encontrado"
- ✅ Verifique se `corretor_id` é enviado no webhook
- ✅ Verifique se o ID existe na tabela Supabase
- ✅ Verifique o filtro (campo correto?)

### "WhatsApp não envia"
- ✅ Verifique se Access Token é válido
- ✅ Verifique se Phone Number ID está correto
- ✅ Verifique se template está aprovado
- ✅ Verifique se número tem formato correto (country code)
- ✅ Verifique se a conta tem limite de mensagens

### "Erro de autenticação"
- ✅ Regenere tokens/credentials
- ✅ Verifique permissões no Supabase
- ✅ Verifique permissões no WhatsApp Business

---

## 📞 Próximos Passos

1. **Criar o workflow** no n8n com as configurações acima
2. **Testar** com webhook POST de teste
3. **Configurar** integração no sistema de CRM/lead
4. **Ativar** workflow
5. **Monitorar** primeiras execuções
6. **Documentar** no Notion conforme padrão do projeto

---

## 📝 Notas Importantes

- Este workflow é **síncrono** (envia WhatsApp imediatamente)
- Se precisar de **tentativas de reenvio**, adicione Retry node
- Se precisar **registrar histórico**, adicione node Supabase para log
- Se precisar **multi-idioma**, ajuste template parameters
- Se precisar **valores dinâmicos** no template, use componentes body/header

---

**Criado em:** 2026-08-20  
**Status:** Pronto para Implementação

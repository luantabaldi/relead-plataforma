# TEMPLATE: Planilha de Disparo Manual — Sym Imóveis

## Estrutura da Aba "Leads" (exatamente nesta ordem)

| Coluna       | Nome Exato na Planilha | Obrigatório | Exemplo                      |
|--------------|------------------------|-------------|------------------------------|
| A            | nome                   | ✅ Sim      | João Silva                   |
| B            | telefone               | ✅ Sim      | 41991234567 ou 5541991234567 |
| C            | status                 | ✅ Sim      | Pendente                     |
| D            | data_envio             | ❌ Não      | (preenchido automaticamente) |
| E            | id_crm                 | ❌ Não      | 14285                        |
| F            | observacao             | ❌ Não      | Lead do Facebook Ads         |
| G            | row_number             | ✅ Sim      | 2 (número da linha)          |

---

## Regras de Preenchimento

### Coluna "status"
- `Pendente` → será disparado pelo bot
- `Enviado`  → ignorado (já foi enviado)
- `Erro`     → ignorado (falhou, verificar manualmente)

### Coluna "telefone"
Aceita vários formatos — o sistema normaliza automaticamente:
- `41991234567` (11 dígitos sem DDI) ✅
- `5541991234567` (13 dígitos com DDI 55) ✅
- `+55 41 99123-4567` (com máscara) ✅
- `(41) 9 9123-4567` (com parênteses e hífen) ✅

### Coluna "row_number" (IMPORTANTE)
Esta coluna precisa ter o número da linha da planilha (2, 3, 4...) para que o sistema consiga atualizar o status após o envio. 
Dica: use a fórmula `=ROW()` em cada linha para preencher automaticamente.

---

## Como Usar

1. Preencha as linhas com status = `Pendente`
2. No n8n, abra o WK3 e copie a URL do webhook de teste
3. Acesse a URL no navegador (ou Postman) para iniciar o disparo
4. Acompanhe a planilha: as linhas vão mudando de `Pendente` → `Enviado` automaticamente
5. O sistema espera **45 segundos** entre cada envio para evitar bloqueio

---

## Configuração no n8n (único passo manual)

No workflow "Salva Lead — 3. Disparo Manual Planilha":
1. Abra o nó **"Ler Planilha Leads"**
2. Em "Document ID", cole o ID da sua planilha do Google Sheets
   - O ID fica na URL: docs.google.com/spreadsheets/d/**ID_AQUI**/edit
3. Repita o mesmo ID no nó **"Atualizar Status na Planilha"**
4. Adicione a credencial do Google Sheets em ambos os nós
5. Ative o workflow

---

## Estimativa de Tempo por Lote

| Leads | Tempo Estimado       |
|-------|----------------------|
| 10    | ~8 minutos           |
| 50    | ~38 minutos          |
| 100   | ~75 minutos (1h15)   |
| 200   | ~2h30                |

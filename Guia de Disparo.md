# 🚀 Guia de Disparo: Salva Lead — Sym Imóveis

Este documento descreve como iniciar e gerenciar os disparos de mensagens para prospecção e reativação de leads.

---

## 1. Disparo Automático (Reativação de Descartados)

Este fluxo busca automaticamente leads que estão na situação **"Descartado" (ID: 3)** no CV CRM e envia a mensagem de NPS/Reativação.

* **Workflow no n8n:** `Salva Lead — 1. Prospecção Ativa`
* **Agendamento:** O disparo ocorre automaticamente todos os dias às **09:00**.
* **Como forçar um disparo agora:**
    1. Acesse o n8n e abra o workflow `Salva Lead — 1. Prospecção Ativa`.
    2. Clique no botão **"Test Workflow"** no topo da tela.
    3. Ele buscará os leads descartados no CV e iniciará o envio respeitando o delay de segurança.

---

## 2. Disparo Manual (Via Planilha)

Ideal para campanhas específicas com leads que não necessariamente estão descartados ou que vieram de bases externas.

* **Workflow no n8n:** `Salva Lead — 3. Disparo Manual Planilha`
* **Planilha de Controle:** [Link da Planilha Google Sheets](https://docs.google.com/spreadsheets/d/1j9u6hyY65ttSJ3HpUI8y90SHaw2hVoWmv4FBtVwu3nE/edit)
* **Passo a Passo:**
    1. **Prepare a Planilha:** Insira os dados dos leads (Nome e Telefone) na aba correspondente.
    2. **Verifique o Status:** Certifique-se de que a coluna de "Status" esteja vazia para os novos leads.
    3. **Inicie o Workflow:**
        * **Opção A (Manual):** No n8n, abra o workflow `Salva Lead — 3. Disparo Manual Planilha` e clique em **"Test Workflow"**.
        * **Opção B (Webhook):** Você pode iniciar o disparo enviando uma requisição POST para a URL abaixo (útil para automações externas):
            * `https://n8n.srv1214309.hstgr.cloud/webhook/disparo-manual-planilha`

    4. O sistema lerá as linhas, enviará as mensagens via WhatsApp e salvará o status de envio diretamente no banco de dados do Supabase.

---

## 3. Atendimento e Filtro de Interesse (IA)

Após o disparo, a **IA Ana Paula** assume as respostas no workflow `Salva Lead — 2. Atendimento IA`.

* **Como funciona:**
  * Se o lead clicar em **"Quero saber mais!"**: A IA qualifica o lead e o **reativa no CV CRM** automaticamente como "Em Atendimento".
  * Se o lead clicar em **"Não tenho interesse"**: A IA agradece, encerra a conversa e **garante que o lead permaneça descartado** no CRM, registrando a recusa.
* **Onde acompanhar:**
  * As conversas acontecem no número oficial da Sym Imóveis.
  * Leads interessados são salvos automaticamente na tabela **`conversas_ia`** do Supabase e podem ser acompanhados em tempo real diretamente pelo Dashboard integrado da plataforma.

---

## ⚠️ Lembretes Importantes

* **Modo de Teste:** O workflow de Prospecção Ativa possui uma trava de segurança (`MODO_TESTE = true`) no nó "Extrair JS Leads". Antes de rodar para a base real, certifique-se de que essa variável esteja como `false` dentro do código do nó.
* **Limites do WhatsApp:** O sistema possui um "Delay" (atraso) entre as mensagens para evitar bloqueios. Não interrompa o workflow enquanto ele estiver processando o lote.

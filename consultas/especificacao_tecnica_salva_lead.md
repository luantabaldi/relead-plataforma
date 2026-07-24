# Especificação Técnica: Workflow "Salva Lead" no N8N

Este documento detalha a implementação do workflow "Salva Lead" no N8N, direcionado a desenvolvedores. Ele abrange a arquitetura de dados no Supabase, os endpoints das APIs do CV CRM, Evolution API e Google Gemini, e a estrutura dos workflows no N8N.

## 1. Arquitetura de Dados no Supabase

O Supabase será utilizado como um banco de dados auxiliar para registrar logs de interações, histórico de mensagens e gerenciar o estado de leads durante o processo de reativação, complementando as informações do CV CRM. Isso permite um controle mais granular e resiliência ao fluxo.

### Tabelas Essenciais no Supabase

| Tabela | Colunas | Tipo de Dado | Descrição |
| :--- | :--- | :--- | :--- |
| `leads_reativacao` | `id` | `UUID` (PK) | ID único da interação de reativação. |
| | `lead_id_cvcrm` | `VARCHAR(255)` | ID do lead no CV CRM. |
| | `telefone` | `VARCHAR(20)` | Telefone do lead para contato via WhatsApp. |
| | `status_reativacao` | `VARCHAR(50)` | Status atual da reativação (ex: 'Enviado', 'Respondido', 'Reengajado', 'Nao_Interessado', 'Erro'). |
| | `data_envio` | `TIMESTAMP` | Data e hora do envio da mensagem inicial. |
| | `data_resposta` | `TIMESTAMP` | Data e hora da última resposta do lead. |
| | `mensagem_enviada` | `TEXT` | Conteúdo da mensagem enviada pela IA. |
| | `ultima_resposta_lead` | `TEXT` | Conteúdo da última resposta do lead. |
| | `classificacao_ia` | `VARCHAR(50)` | Classificação da IA para a resposta do lead. |
| | `corretor_id_cvcrm` | `VARCHAR(255)` | ID do corretor responsável no CV CRM. |
| | `historico_mensagens` | `JSONB` | Array de objetos JSON com histórico completo de mensagens (IA e Lead). |
| `logs_workflow` | `id` | `UUID` (PK) | ID único do log. |
| | `workflow_name` | `VARCHAR(255)` | Nome do workflow N8N. |
| | `node_name` | `VARCHAR(255)` | Nome do node que gerou o log. |
| | `timestamp` | `TIMESTAMP` | Data e hora do log. |
| | `level` | `VARCHAR(20)` | Nível do log (ex: 'INFO', 'WARN', 'ERROR'). |
| | `message` | `TEXT` | Mensagem do log. |
| | `data_payload` | `JSONB` | Dados relevantes do evento (opcional). |

## 2. Endpoints e Autenticação das APIs

### 2.1. CV CRM API

*   **Base URL:** `https://integracao.cvcrm.com.br/api/v1`
*   **Autenticação:** Via parâmetros de query `email` e `token` em cada requisição. O `token` é gerado no painel administrativo do CV CRM para um usuário com permissões adequadas.

| Operação | Método HTTP | Endpoint | Parâmetros Essenciais | Exemplo de Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Listar Leads** | `GET` | `/comercial/leads` | `email`, `token`, `idsituacao` (ex: 1, 2, 3 para inativos), `ativo=true`, `data_cad_ini`, `data_cad_fim` (para filtrar leads antigos). | `GET /comercial/leads?email=seu@email.com&token=SEU_TOKEN&idsituacao=1,2,3&ativo=true&data_cad_fim=2025-01-01` |
| **Atualizar Lead** | `PUT` | `/comercial/leads/{idlead}` | `email`, `token`, `idlead`, `idsituacao` (nova situação), `idcorretor` (opcional). | `PUT /comercial/leads/12345?email=seu@email.com&token=SEU_TOKEN` com body `{"idsituacao": 5}` |
| **Cadastrar Atendimento/Tarefa** | `POST` | `/relacionamento/atendimentos/cadastrar` | `email`, `token`, `idlead`, `idcorretor`, `idtipoatendimento`, `descricao`, `data_atendimento`. | `POST /relacionamento/atendimentos/cadastrar?email=seu@email.com&token=SEU_TOKEN` com body `{"idlead": 12345, "idcorretor": 678, "descricao": "Lead reativado pela IA", "data_atendimento": "2026-03-11"}` |

### 2.2. Evolution API (WhatsApp)

*   **Base URL:** `[URL da sua instância da Evolution API]` (ex: `https://sua-instancia.evolutionapi.com.br`)
*   **Autenticação:** Via `API Key` ou `Token` no cabeçalho `x-api-key` ou `Authorization: Bearer [TOKEN]`, dependendo da configuração da sua instância.

| Operação | Método HTTP | Endpoint | Parâmetros Essenciais | Exemplo de Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Enviar Mensagem** | `POST` | `/message/sendText/[instanceName]` | `number` (telefone do lead), `textMessage` (conteúdo da mensagem). | `POST /message/sendText/myInstance` com body `{"number": "5511999999999", "textMessage": {"text": "Olá!"}}` |
| **Webhook de Recebimento** | `POST` | `[URL do Webhook N8N]` | A Evolution API enviará um payload JSON com os dados da mensagem recebida. | O N8N exporá um endpoint `POST` que a Evolution API irá chamar. |

### 2.3. Google Gemini API

*   **Base URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY` (para `gemini-pro`, ajustar para `gemini-1.5-flash` ou `gemini-1.5-pro` conforme necessário).
*   **Autenticação:** Via `API Key` no parâmetro de query `key` da URL.

| Operação | Método HTTP | Endpoint | Parâmetros Essenciais | Exemplo de Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Gerar Conteúdo (Mensagem)** | `POST` | `/models/gemini-pro:generateContent` | `contents` (array de objetos com `parts` contendo o prompt). | `POST /models/gemini-pro:generateContent?key=YOUR_API_KEY` com body `{"contents": [{"parts": [{"text": "Seu prompt aqui"}]}]}` |
| **Classificar Conteúdo (Resposta)** | `POST` | `/models/gemini-pro:generateContent` | `contents` (array de objetos com `parts` contendo o prompt de classificação e a resposta do lead). | `POST /models/gemini-pro:generateContent?key=YOUR_API_KEY` com body `{"contents": [{"parts": [{"text": "Classifique a mensagem: [resposta do lead]"}]}]}` |

## 3. N8N Hospedagem (Hostinger)

O N8N será hospedado na Hostinger. É fundamental que o ambiente tenha recursos suficientes (CPU, RAM) para lidar com o volume de leads e as requisições às APIs. A configuração do N8N deve incluir a utilização de variáveis de ambiente para todas as chaves de API e tokens, garantindo a segurança e facilitando a manutenção. Recomenda-se o uso de um `reverse proxy` (como Nginx) para gerenciar o acesso ao N8N e configurar SSL/TLS. 

O desenvolvedor deve garantir que o N8N esteja acessível publicamente para que a Evolution API possa enviar os webhooks de resposta. A configuração de um domínio personalizado e SSL é crucial para a segurança e confiabilidade do webhook. 

## Próximos Passos

Com esta base, o próximo passo é detalhar os workflows no N8N, node a node, com exemplos de JSONs de entrada e saída, e os prompts exatos para a IA. Isso será abordado na próxima seção do documento.

## 4. Workflows Detalhados no N8N

### 4.1. Workflow: Prospecção Ativa de Leads Parados

Este workflow é responsável por identificar leads inativos no CV CRM, gerar mensagens personalizadas via IA e enviá-las via Evolution API, registrando todas as interações no Supabase e CV CRM.

#### Nodes e Configurações

1.  **`Cron` Node (Trigger)**
    *   **Função:** Inicia o workflow em intervalos programados.
    *   **Configuração:** `Mode: Every Day`, `Time: 09:00`. (Ajustar conforme a necessidade de frequência).

2.  **`HTTP Request` Node (CV CRM - Get Leads Parados)**
    *   **Função:** Busca leads no CV CRM que se enquadram nos critérios de inatividade.
    *   **Método:** `GET`
    *   **URL:** `https://integracao.cvcrm.com.br/api/v1/comercial/leads`
    *   **Query Parameters:**
        *   `email`: `{{ $env.CVCRM_EMAIL }}`
        *   `token`: `{{ $env.CVCRM_TOKEN }}`
        *   `idsituacao`: `1,2,3` (Exemplo: IDs das situações de "Aguardando Contato", "Sem Retorno", "Inativo").
        *   `ativo`: `true`
        *   `data_ult_interacao_fim`: `{{ new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0] }}` (Exemplo: Leads sem interação nos últimos 30 dias).
    *   **Headers:** `Content-Type: application/json`
    *   **Expected Response:** Array de objetos JSON, onde cada objeto representa um lead.
    *   **Exemplo de Retorno (JSON):**
        ```json
        [
          {
            "id": 12345,
            "nome": "João Silva",
            "telefone": "5511987654321",
            "email": "joao.silva@email.com",
            "idsituacao": 1,
            "situacao": "Aguardando Contato",
            "idcorretor": 678,
            "corretor": "Maria Souza",
            "ult_imovel_interesse": "Apartamento 3 quartos, Pinheiros"
          }
        ]
        ```

3.  **`Item Lists` Node (Split In Batches)**
    *   **Função:** Processa os leads um por um ou em pequenos lotes para evitar sobrecarga.
    *   **Configuração:** `Mode: Split In Batches`, `Batch Size: 1` (para processar individualmente, ideal para delays).

4.  **`Function` Node (Preparar Dados para IA e Supabase)**
    *   **Função:** Formata o prompt para o Google Gemini e prepara o payload para inserir o log inicial no Supabase.
    *   **Código (JavaScript):**
        ```javascript
        const lead = $json;
        const prompt = `Você é um assistente de reativação de leads para uma imobiliária. Seu objetivo é reengajar clientes que demonstraram interesse em imóveis, mas pararam de interagir. Seja amigável, empático e direto. Mencione o último imóvel de interesse do cliente para personalizar a mensagem. Ofereça ajuda e pergunte se há algo novo em que ele esteja interessado. Não faça uma oferta direta.

Informações do Lead:
Nome: ${lead.nome}
Último imóvel de interesse: ${lead.ult_imovel_interesse || 'um imóvel'}

Crie uma mensagem curta e amigável para o WhatsApp.`;

        const supabasePayload = {
            lead_id_cvcrm: lead.id,
            telefone: lead.telefone,
            status_reativacao: 'Enviado',
            data_envio: new Date().toISOString(),
            corretor_id_cvcrm: lead.idcorretor,
            historico_mensagens: []
        };

        return [{
            json: {
                lead: lead,
                prompt: prompt,
                supabasePayload: supabasePayload
            }
        }];
        ```

5.  **`HTTP Request` Node (Google Gemini - Gerar Mensagem)**
    *   **Função:** Envia o prompt para o Google Gemini para gerar a mensagem de reativação.
    *   **Método:** `POST`
    *   **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $env.GEMINI_API_KEY }}`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (JSON):**
        ```json
        {
          "contents": [
            {
              "parts": [
                {
                  "text": "{{ $json.prompt }}"
                }
              ]
            }
          ]
        }
        ```
    *   **Expected Response:** Objeto JSON com a mensagem gerada.
    *   **Exemplo de Retorno (JSON):**
        ```json
        {
          "candidates": [
            {
              "content": {
                "parts": [
                  {
                    "text": "Olá João! Tudo bem? Vi que você demonstrou interesse em um Apartamento 3 quartos, Pinheiros. Como está sua busca por um novo lar? Há algo novo que eu possa te ajudar a encontrar?"
                  }
                ]
              }
            }
          ]
        }
        ```

6.  **`Function` Node (Extrair Mensagem da IA e Atualizar Supabase Payload)**
    *   **Função:** Extrai a mensagem gerada pela IA e a adiciona ao payload do Supabase.
    *   **Código (JavaScript):**
        ```javascript
        const leadData = $json.lead;
        const iaResponse = $json.candidates[0].content.parts[0].text;
        const supabasePayload = $json.supabasePayload;

        supabasePayload.mensagem_enviada = iaResponse;
        supabasePayload.historico_mensagens.push({
            remetente: 'IA',
            mensagem: iaResponse,
            timestamp: new Date().toISOString()
        });

        return [{
            json: {
                lead: leadData,
                iaMessage: iaResponse,
                supabasePayload: supabasePayload
            }
        }];
        ```

7.  **`HTTP Request` Node (Supabase - Inserir Log de Reativação)**
    *   **Função:** Registra o início do processo de reativação no Supabase.
    *   **Método:** `POST`
    *   **URL:** `{{ $env.SUPABASE_URL }}/rest/v1/leads_reativacao`
    *   **Headers:**
        *   `apikey`: `{{ $env.SUPABASE_ANON_KEY }}`
        *   `Authorization`: `Bearer {{ $env.SUPABASE_ANON_KEY }}`
        *   `Content-Type`: `application/json`
        *   `Prefer`: `return=representation`
    *   **Body (JSON):** `{{ $json.supabasePayload }}`
    *   **Expected Response:** Objeto JSON do registro inserido.

8.  **`HTTP Request` Node (Evolution API - Enviar WhatsApp)**
    *   **Função:** Envia a mensagem gerada pela IA para o lead.
    *   **Método:** `POST`
    *   **URL:** `{{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE_NAME }}`
    *   **Headers:**
        *   `Content-Type`: `application/json`
        *   `x-api-key`: `{{ $env.EVOLUTION_API_KEY }}` (ou `Authorization: Bearer`)
    *   **Body (JSON):**
        ```json
        {
          "number": "{{ $json.lead.telefone }}",
          "textMessage": {
            "text": "{{ $json.iaMessage }}"
          }
        }
        ```
    *   **Delay:** Adicionar um `Wait` node com `Random Delay` (ex: 60-180 segundos) após este node para evitar bloqueios.

9.  **`HTTP Request` Node (CV CRM - Registrar Interação)**
    *   **Função:** Registra no CV CRM que uma mensagem de reativação foi enviada.
    *   **Método:** `POST`
    *   **URL:** `https://integracao.cvcrm.com.br/api/v1/relacionamento/atendimentos/cadastrar`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (JSON):**
        ```json
        {
          "email": "{{ $env.CVCRM_EMAIL }}",
          "token": "{{ $env.CVCRM_TOKEN }}",
          "idlead": "{{ $json.lead.id }}",
          "idcorretor": "{{ $json.lead.idcorretor }}",
          "idtipoatendimento": 1, // Exemplo: ID para 'Contato por WhatsApp'
          "descricao": "Mensagem de reativação enviada pela IA: {{ $json.iaMessage }}",
          "data_atendimento": "{{ new Date().toISOString().split('T')[0] }}"
        }
        ```

### 4.2. Workflow: Tratamento Reativo das Respostas

Este workflow é acionado por um webhook da Evolution API quando um lead responde. Ele classifica a resposta via IA, atualiza o Supabase e o CV CRM, e notifica o corretor se o lead for reengajado.

#### Nodes e Configurações

1.  **`Webhook` Node (Evolution API - Receber Resposta)**
    *   **Função:** Atua como o gatilho para este workflow, recebendo as mensagens de resposta da Evolution API.
    *   **Configuração:** `Webhook URL` será gerada pelo N8N. Esta URL deve ser configurada na Evolution API como o endpoint para `message_received`.
    *   **Expected Payload (JSON - Exemplo simplificado):**
        ```json
        {
          "event": "message_received",
          "data": {
            "id": "gBGJ_A_...",
            "from": "5511987654321@s.whatsapp.net",
            "to": "5511999999999@s.whatsapp.net",
            "type": "chat",
            "body": "Estou interessado! Pode me dar mais detalhes?",
            "timestamp": 1678886400
          }
        }
        ```

2.  **`Function` Node (Extrair Dados da Resposta e Buscar no Supabase)**
    *   **Função:** Extrai o número do remetente e a mensagem, e busca o registro correspondente no Supabase para obter o `id` da interação de reativação.
    *   **Código (JavaScript):**
        ```javascript
        const webhookData = $json.data;
        const senderNumber = webhookData.from.split('@')[0]; // Extrai apenas o número
        const messageBody = webhookData.body;

        // Busca no Supabase pelo registro mais recente para este telefone
        // (Isso será feito no próximo HTTP Request, aqui apenas preparamos os dados)
        return [{
            json: {
                senderNumber: senderNumber,
                messageBody: messageBody
            }
        }];
        ```

3.  **`HTTP Request` Node (Supabase - Buscar Registro de Reativação)**
    *   **Função:** Busca o registro de reativação correspondente ao número de telefone do lead no Supabase.
    *   **Método:** `GET`
    *   **URL:** `{{ $env.SUPABASE_URL }}/rest/v1/leads_reativacao?telefone=eq.{{ $json.senderNumber }}&order=data_envio.desc&limit=1`
    *   **Headers:**
        *   `apikey`: `{{ $env.SUPABASE_ANON_KEY }}`
        *   `Authorization`: `Bearer {{ $env.SUPABASE_ANON_KEY }}`
    *   **Expected Response:** Array com um objeto JSON do registro de reativação.

4.  **`Function` Node (Preparar Prompt para Classificação IA e Atualizar Supabase Payload)**
    *   **Função:** Prepara o prompt para o Google Gemini classificar a resposta do lead e atualiza o payload do Supabase.
    *   **Código (JavaScript):**
        ```javascript
        const supabaseRecord = $json.response_supabase[0]; // Assumindo que o Supabase retornou um array
        const leadMessage = $json.messageBody;

        const classificationPrompt = `Analise a seguinte mensagem de um lead e classifique sua intenção em uma das seguintes categorias: 'Interessado', 'Nao_Interessado', 'Precisa_Mais_Informacoes'. Responda apenas com a categoria.

Mensagem do Lead: ${leadMessage}

Classificação:`;

        // Atualiza o histórico de mensagens e a última resposta no payload do Supabase
        supabaseRecord.ultima_resposta_lead = leadMessage;
        supabaseRecord.data_resposta = new Date().toISOString();
        supabaseRecord.historico_mensagens.push({
            remetente: 'Lead',
            mensagem: leadMessage,
            timestamp: new Date().toISOString()
        });

        return [{
            json: {
                supabaseRecord: supabaseRecord,
                classificationPrompt: classificationPrompt,
                leadMessage: leadMessage
            }
        }];
        ```

5.  **`HTTP Request` Node (Google Gemini - Analisar Resposta)**
    *   **Função:** Envia a resposta do lead para o Google Gemini para classificação.
    *   **Método:** `POST`
    *   **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $env.GEMINI_API_KEY }}`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (JSON):**
        ```json
        {
          "contents": [
            {
              "parts": [
                {
                  "text": "{{ $json.classificationPrompt }}"
                }
              ]
            }
          ]
        }
        ```
    *   **Expected Response:** Objeto JSON com a classificação (ex: `{"candidates": [{"content": {"parts": [{"text": "Interessado"}]}}]}`).

6.  **`Function` Node (Extrair Classificação e Atualizar Supabase Payload)**
    *   **Função:** Extrai a classificação da IA e a adiciona ao payload do Supabase.
    *   **Código (JavaScript):**
        ```javascript
        const supabaseRecord = $json.supabaseRecord;
        const iaClassification = $json.candidates[0].content.parts[0].text.trim();

        supabaseRecord.classificacao_ia = iaClassification;
        supabaseRecord.status_reativacao = iaClassification === 'Interessado' ? 'Reengajado' : iaClassification;

        return [{
            json: {
                supabaseRecord: supabaseRecord,
                iaClassification: iaClassification
            }
        }];
        ```

7.  **`HTTP Request` Node (Supabase - Atualizar Log de Reativação)**
    *   **Função:** Atualiza o registro de reativação no Supabase com a resposta do lead e a classificação da IA.
    *   **Método:** `PATCH`
    *   **URL:** `{{ $env.SUPABASE_URL }}/rest/v1/leads_reativacao?id=eq.{{ $json.supabaseRecord.id }}`
    *   **Headers:**
        *   `apikey`: `{{ $env.SUPABASE_ANON_KEY }}`
        *   `Authorization`: `Bearer {{ $env.SUPABASE_ANON_KEY }}`
        *   `Content-Type`: `application/json`
        *   `Prefer`: `return=representation`
    *   **Body (JSON):** `{{ $json.supabaseRecord }}` (enviando o objeto completo atualizado).

8.  **`Switch` Node (Lógica de Reengajamento)**
    *   **Função:** Direciona o fluxo com base na classificação da IA.
    *   **Configuração:**
        *   **Case 1:** `{{ $json.iaClassification }} == 'Interessado'`
        *   **Case 2:** `{{ $json.iaClassification }} == 'Precisa_Mais_Informacoes'`
        *   **Case 3:** `{{ $json.iaClassification }} == 'Nao_Interessado'`

9.  **`HTTP Request` Node (CV CRM - Atualizar Lead - Caminho 'Interessado')**
    *   **Função:** Atualiza o status do lead no CV CRM para "Reativado" ou "Em Atendimento".
    *   **Método:** `PUT`
    *   **URL:** `https://integracao.cvcrm.com.br/api/v1/comercial/leads/{{ $json.supabaseRecord.lead_id_cvcrm }}?email={{ $env.CVCRM_EMAIL }}&token={{ $env.CVCRM_TOKEN }}`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (JSON):** `{"idsituacao": 5}` (Exemplo: ID para "Reativado").

10. **`HTTP Request` Node (CV CRM - Notificar Corretor - Caminho 'Interessado')**
    *   **Função:** Cria um atendimento/tarefa para o corretor responsável.
    *   **Método:** `POST`
    *   **URL:** `https://integracao.cvcrm.com.br/api/v1/relacionamento/atendimentos/cadastrar`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (JSON):**
        ```json
        {
          "email": "{{ $env.CVCRM_EMAIL }}",
          "token": "{{ $env.CVCRM_TOKEN }}",
          "idlead": "{{ $json.supabaseRecord.lead_id_cvcrm }}",
          "idcorretor": "{{ $json.supabaseRecord.corretor_id_cvcrm }}",
          "idtipoatendimento": 2, // Exemplo: ID para 'Atendimento Reativado'
          "descricao": "Lead reativado pela IA! Resposta: {{ $json.leadMessage }}. Classificação IA: {{ $json.iaClassification }}",
          "data_atendimento": "{{ new Date().toISOString().split('T')[0] }}"
        }
        ```

11. **`HTTP Request` Node (CV CRM - Registrar Interação - Caminho 'Precisa_Mais_Informacoes' / 'Nao_Interessado')**
    *   **Função:** Registra a interação no CV CRM sem alterar o status principal do lead, ou alterando para um status de nutrição.
    *   **Método:** `POST`
    *   **URL:** `https://integracao.cvcrm.com.br/api/v1/relacionamento/atendimentos/cadastrar`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (JSON):**
        ```json
        {
          "email": "{{ $env.CVCRM_EMAIL }}",
          "token": "{{ $env.CVCRM_TOKEN }}",
          "idlead": "{{ $json.supabaseRecord.lead_id_cvcrm }}",
          "idcorretor": "{{ $json.supabaseRecord.corretor_id_cvcrm }}",
          "idtipoatendimento": 3, // Exemplo: ID para 'Interação IA - Não Qualificado'
          "descricao": "Interação IA: Lead respondeu '{{ $json.leadMessage }}'. Classificação IA: {{ $json.iaClassification }}",
          "data_atendimento": "{{ new Date().toISOString().split('T')[0] }}"
        }
        ```

## 5. Boas Práticas e Segurança

*   **Variáveis de Ambiente:** Todas as chaves de API, tokens e URLs base devem ser armazenadas como variáveis de ambiente no N8N (Hostinger), nunca hardcoded nos nodes.
*   **Tratamento de Erros:** Implementar `Error Handling` nos workflows do N8N para capturar e logar falhas de API ou processamento. Isso pode incluir o envio de notificações (e-mail, Slack) para o desenvolvedor.
*   **Limites de Taxa (Rate Limits):** Respeitar os limites de requisição de cada API (CV CRM, Evolution, Gemini). O N8N pode usar `Wait` nodes ou configurações de `Concurrency` para gerenciar isso.
*   **Segurança do Webhook:** O webhook da Evolution API para o N8N deve ser protegido. A Evolution API geralmente permite configurar um `secret` para validar a origem das requisições.
*   **Monitoramento:** Utilizar os logs do N8N e do Supabase para monitorar a performance do workflow, a taxa de reativação e identificar possíveis problemas.
*   **Ajuste de Prompts:** Os prompts da IA devem ser continuamente ajustados e testados para melhorar a qualidade das mensagens e a precisão das classificações.
*   **Política Anti-Spam do WhatsApp:** Reforçar as boas práticas de `Delay` randômico, variação de mensagens e limites diários para evitar bloqueios do número de WhatsApp.

Este documento serve como um guia completo para o desenvolvedor implementar o "Salva Lead", garantindo uma integração robusta e eficiente entre as plataformas escolhidas.

# Guia de Implementação: Agente de Reativação de Leads com N8N, IA e CV CRM

Este guia apresenta uma análise detalhada e um plano de ação para implementar um sistema de reativação de leads automatizado, análogo ao produto "Salva Lead", com foco no ecossistema tecnológico da sua imobiliária, que inclui o CV CRM e a preferência pelo N8N como ferramenta de automação.

## 1. Implementação de um Sistema Equivalente ao Salva Lead

A criação de um agente de reativação de leads visa resolver o problema de abandono de clientes durante o processo de venda, reengajando contatos inativos de forma automática e inteligente. O processo otimiza o tempo do corretor, que passa a receber apenas os leads que demonstram novo interesse, focando seus esforços em negociação e fechamento.

### Etapas Práticas para a Construção do Fluxo

A implementação pode ser dividida em seis fases principais, desde a concepção até a otimização contínua. Primeiramente, é crucial **definir os critérios de inatividade** dos leads no CV CRM, estabelecendo os gatilhos que iniciarão a automação. Em seguida, realiza-se a **configuração da infraestrutura**, instalando o N8N em um ambiente de nuvem ou servidor local e estabelecendo a **conexão com a API do CV CRM** para leitura e escrita de dados.

A quarta etapa consiste no **desenvolvimento do fluxo de automação** no N8N, que irá orquestrar a extração dos leads, a personalização das mensagens via IA, o envio através do WhatsApp e o monitoramento das respostas. Posteriormente, é necessário realizar o **treinamento e ajuste do modelo de IA**, fornecendo exemplos de interações para garantir que a comunicação seja natural e alinhada à marca da imobiliária. Por fim, a fase de **testes e otimização** é indispensável, utilizando leads de teste e, gradualmente, leads reais para validar o fluxo, ajustar a lógica e monitorar a taxa de sucesso da reativação.

### Gatilhos para Identificação de Leads Inativos

A identificação precisa de um lead "parado" é o que dispara o processo de reativação. Os gatilhos devem ser configurados no N8N para consultar a base do CV CRM com base em uma combinação de fatores, conforme detalhado na tabela abaixo.

| Gatilho | Descrição | Exemplo de Aplicação no CV CRM |
| :--- | :--- | :--- |
| **Tempo sem Interação** | Período em que o lead não responde ou interage com o corretor. | Um lead que não abre e-mails ou responde mensagens há mais de 21 dias. |
| **Estagnação no Funil** | O lead permanece em uma mesma etapa do funil de vendas por tempo excessivo. | Um lead na etapa "Qualificação" por mais de 30 dias sem evolução. |
| **Status Específico** | Utilização de um campo de "Situação" no CRM para marcar o lead como inativo. | Leads com status "Aguardando Cliente", "Sem Retorno" ou "Congelado". |
| **Tarefas Vencidas** | Ausência de tarefas futuras agendadas ou existência de tarefas vencidas. | O sistema identifica que não há um próximo passo agendado para o lead. |

## 2. Seleção da Inteligência Artificial para o Agente

A escolha do modelo de IA é uma decisão estratégica que impacta diretamente o custo da operação e a qualidade da interação com o cliente. A IA será responsável por duas tarefas principais: gerar a mensagem inicial de reativação e analisar a resposta do lead para classificar sua intenção.

### Comparativo de Modelos de IA

Para o mercado brasileiro, considerando o equilíbrio entre custo, performance e facilidade de implementação, os seguintes modelos são os mais recomendados.

| Modelo/Plataforma | Custo (por 1 milhão de tokens) | Qualidade da Resposta | Facilidade de Implementação | Ideal Para |
| :--- | :--- | :--- | :--- | :--- |
| **GPT-4o mini** | Entrada: $0.15 / Saída: $0.60 | Alta | Fácil (API OpenAI) | Melhor custo-benefício geral para geração e classificação de texto. |
| **Gemini 1.5 Flash** | Entrada: $0.075 / Saída: $0.30 | Média-Alta | Fácil (API Google) | Respostas de baixa latência e processamento eficiente de contexto. |
| **Claude 3.5 Haiku** | Entrada: $0.25 / Saída: $1.25 | Altíssima | Média (API Anthropic) | Interações que exigem um tom mais humano, empático e natural. |

Para iniciar, o **GPT-4o mini** ou o **Gemini 1.5 Flash** representam as melhores opções devido ao baixo custo e à simplicidade de integração com o N8N. O **Claude 3.5 Haiku** pode ser um upgrade futuro caso a sofisticação da conversa se torne uma prioridade.

### Estratégia de Prompt para a IA

O prompt é a instrução que guia a IA. Ele deve ser bem estruturado para garantir que a mensagem gerada seja eficaz. Recomenda-se um prompt que defina o papel da IA, o objetivo da comunicação e forneça dados dinâmicos do lead para personalização.

> **Exemplo de Prompt:**
> "Você é um assistente de reativação de leads para a Imobiliária [Nome da Imobiliária]. Seu objetivo é reengajar um cliente que não interage há algum tempo. Seja amigável, profissional e utilize as informações fornecidas para personalizar a abordagem. Pergunte de forma sutil se ele ainda está buscando um imóvel e se há algo novo que ele gostaria de ver. Não faça uma oferta direta.
> 
> **Dados do Lead:**
> - **Nome:** {{lead_name}}
> - **Último imóvel de interesse:** {{last_property_viewed}}
> - **Data da última interação:** {{last_interaction_date}}"

## 3. Construção do Fluxo de Automação no N8N

O N8N será o cérebro da operação, conectando o CRM, a IA e o canal de comunicação. A arquitetura do fluxo é modular e pode ser construída visualmente utilizando os nodes da plataforma.

### Arquitetura Detalhada do Fluxo no N8N

O fluxo de trabalho no N8N seguirá uma sequência lógica de extração, processamento, ação e atualização. O processo começa com um gatilho agendado que busca os leads inativos no CV CRM. Para cada lead, a IA gera uma mensagem personalizada, que é enviada via WhatsApp. Um webhook aguarda a resposta do cliente, que é novamente processada pela IA para classificação. Com base nessa classificação, o N8N atualiza o status do lead no CRM e, se necessário, notifica o corretor para que ele assuma a conversa.

As integrações essenciais para este fluxo são a **API do CV CRM**, uma **API de WhatsApp** (como a Evolution API, que é flexível e popular no Brasil) e a **API do modelo de IA** escolhido.

## 4. Integração com o CV CRM

A comunicação entre o N8N e o CV CRM é o pilar da automação, permitindo que o fluxo de trabalho acesse dados e execute ações de forma programática.

### Capacidades da API do CV CRM

O CV CRM oferece uma API REST bem documentada e a funcionalidade de webhooks, que são perfeitos para este caso de uso. A API permite consultar leads com filtros avançados, como `idsituacao` e datas, o que é fundamental para identificar os leads parados. Além disso, é possível atualizar o status de um lead e criar novos registros, como atendimentos ou tarefas, para notificar os corretores.

### Conectando N8N e CV CRM

A conexão é estabelecida no N8N através do `HTTP Request` node. A autenticação é feita via `email` e `token`, que devem ser gerados no painel de administração do CV CRM. Para ler os leads, o N8N fará uma requisição `GET` ao endpoint `/api/v1/comercial/leads`, utilizando os filtros de inatividade. Para atualizar um lead reengajado, será feita uma requisição `PUT` ao mesmo endpoint, passando o `idlead` e a nova `idsituacao`. Por fim, para notificar o corretor, uma requisição `POST` para `/api/v1/relacionamento/atendimentos/cadastrar` criará um novo atendimento, transferindo o lead de volta para o fluxo humano.

### Alternativas ao N8N

Embora o N8N seja a ferramenta preferencial, plataformas como **Make** ou **Zapier** também podem ser utilizadas. Contudo, o N8N se destaca por ser de código aberto, o que oferece maior controle, flexibilidade de customização e um custo potencialmente menor para operações de maior volume e complexidade.

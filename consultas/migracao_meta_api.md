# Guia de Migração: Evolution API para Meta Cloud API (Oficial)

Este documento compara as tecnologias e descreve os passos para migrar a estrutura da Sym Imóveis para a API Oficial.

---

## 1. Comparação Técnica

### Evolution API (Não Oficial)
- **Tecnologia:** Baseada em Baileys/WhatsApp Web (emula um celular).
- **Vantagem:** Flexibilidade total no envio de mensagens; custo zero de mensagens.
- **Desvantagem:** Alto risco de bloqueio por spam; instabilidade na conexão "multi-device"; identificação baseada apenas no telefone.

### Meta Cloud API (Oficial)
- **Tecnologia:** Conexão direta via Graph API do Facebook.
- **Vantagem:** Estabilidade extrema; "blindagem" contra bloqueios de número (suspende-se o template, raramente o chip); selo de conta oficial possível.
- **Desvantagem:** Cobrança por conversa (Marketing, Utilidade, Autenticação, Serviço); aprovação prévia de templates obrigatória.

---

## 2. O que muda no Fluxo do n8n

### 2.1. Nó de Envio (Outbound)
- **Hoje (Evolution):** O nó `wk3-send-evo` faz um POST para o seu servidor Evolution.
- **Amanhã (Meta):** Usará o nó `WhatsApp Business` do n8n ou POST para `graph.facebook.com/v19.0/{phone-number-id}/messages`.
- **Payload:** No lugar de texto livre, você enviará o nome do `template` e os parâmetros das variáveis.

### 2.2. Nó de Recebimento (Inbound/Webhook)
- **Formato:** O JSON da Meta é mais "profundo" (aninhado).
- **Identificação:** Introduz o BUSID (Business-Scoped User ID), conforme detalhado no arquivo `mudancas_busid`.

---

## 3. Roteiro de Implementação

1.  **Business Manager:** Verificar a empresa no Gerenciador de Negócios da Meta.
2.  **App no Portal Developer:** Criar App do tipo "Business" e adicionar o produto WhatsApp.
3.  **Migração de Números:** 
    - Desconectar o número do celular/Evolution.
    - Registrar no painel da Meta (via SMS ou ligação).
4.  **Aprovação de Templates:** Criar no painel da Meta os templates de "Reativação" e "Oferta Ativa" com botões de Opt-out.
5.  **Ajuste de Variáveis no n8n:** Mudar a lógica para enviar apenas os valores que preenchem as lacunas do template.

---

## 4. Estratégia de Custos na Meta

A Meta cobra por "janelas de 24 horas" iniciadas pela empresa.

- **Marketing (Reativação):** Custo mais alto por conversa.
- **Serviço (Atendimento IA):** Se o cliente responder ao seu aviso, a janela de conversa iniciada pelo usuário é mais barata (ou tem uma cota gratuita mensal de 1.000 conversas).

### Recomendação Sym Imóveis:
Mantenha os **Avisos Internos e Notificações de Leads** na Meta Cloud API pela estabilidade, e avalie o custo de ROI para **Disparos em Massa** de Marketing, onde o Evolution pode ser mais barato, porém mais arriscado.

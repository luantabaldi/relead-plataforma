# Blacklist - Guia de Setup e Uso

## O que é?

A **Blacklist** é uma nova aba no reLead Hub que permite gerenciar leads que pediram para **não receber mais mensagens** (Do Not Call). Leads bloqueados serão filtrados automaticamente em disparos futuros.

## Setup no Supabase

### 1. Executar a migração SQL

1. Abra o [Supabase Dashboard](https://app.supabase.com)
2. Navegue até **SQL Editor** → **New Query**
3. Copie o conteúdo de `migrations/create_blacklist_table.sql`
4. Execute a query

Isso criará:
- Tabela `blacklist` com campos: `id`, `telefone`, `nome`, `motivo`, `data_bloqueio`, `adicionado_por`
- Índices para performance em buscas por telefone e data
- Row Level Security (RLS) para controle de acesso

### 2. Verificar a tabela foi criada

Depois de executar, você verá a tabela `blacklist` em **Tables** no painel esquerdo do Supabase.

## Usando no reLead Hub

### Acessar a aba Bloqueados

1. No topo do app, clique em **Bloqueados** (ícone 🚫)
2. Você verá a lista de todos os leads bloqueados com:
   - **Telefone** (identificador único)
   - **Nome** (opcional)
   - **Motivo do bloqueio** (ex: "Pediu para remover número")
   - **Data do bloqueio** (quando foi adicionado)

### Adicionar um lead à blacklist

**Opção 1: Pela aba Bloqueados**
1. Clique em "Adicionar à blacklist"
2. Preencha:
   - **Telefone** *(obrigatório)* - número no formato internacional (ex: `5548999999999`)
   - **Nome** *(opcional)* - nome do lead
   - **Motivo** *(opcional)* - razão do bloqueio (ex: "Solicitação do lead" ou "Pediu para remover")
3. Clique em "Adicionar à blacklist"

**Opção 2: Direto da conversa** *(em desenvolvimento)*
- Na aba "Acompanhar", ao ver uma conversa onde o lead pediu para não receber, clique no menu da conversa e selecione "Bloquear lead"

### Remover um lead da blacklist

1. Na tabela de blacklist, encontre o lead (pode usar a busca)
2. Clique no ícone 🗑️ (trash) na coluna "Ações"
3. Confirme a remoção

**Nota:** O lead poderá receber mensagens novamente após ser removido.

### Buscar/Filtrar

Use a barra de busca para procurar por:
- **Telefone** (busca parcial)
- **Nome** do lead
- **Motivo** do bloqueio

## Integração com Disparos

Quando você cria um disparo manual na aba **Disparar**:

1. O sistema **automaticamente filtra** leads que estão na blacklist
2. Apenas leads não bloqueados recebem a mensagem
3. Você verá um aviso se houver leads bloqueados no lote

## Schema da Tabela

```sql
blacklist
├── id (UUID) - Identificador único
├── telefone (VARCHAR) - Número do lead (UNIQUE)
├── nome (VARCHAR) - Nome do lead (opcional)
├── motivo (TEXT) - Razão do bloqueio
├── data_bloqueio (TIMESTAMP) - Quando foi bloqueado
├── adicionado_por (VARCHAR) - Quem adicionou (opcional)
├── created_at (TIMESTAMP) - Data de criação
└── updated_at (TIMESTAMP) - Última atualização
```

## Segurança

- ✅ RLS (Row Level Security) habilitado
- ✅ Apenas usuários autenticados podem ver/gerenciar blacklist
- ✅ Telefones únicos (não dá pra adicionar duplicado)
- ✅ Índices para performance

## FAQ

**P: Posso recuperar um lead deletado?**
R: Não, a deleção é permanente. Mas você pode re-adicionar o número à blacklist a qualquer momento.

**P: E se adicionar o número errado?**
R: Remova pela aba Bloqueados e adicione o número correto.

**P: O que acontece se enviar para um lead bloqueado?**
R: O sistema filtra automaticamente antes de enviar, mas ele **não será enviado** (para segurança, não aparece na contagem de disparos).

**P: Posso importar uma lista de blacklist?**
R: Por enquanto é adição manual. Se precisar de importação em massa, [abra uma issue](https://github.com/reLead/plataforma/issues).

## Troubleshooting

### "Erro ao carregar blacklist"
- Verifique se a tabela `blacklist` foi criada no Supabase
- Confirme que as variáveis de ambiente do Supabase estão configuradas

### "Telefone já está na blacklist"
- Você está tentando adicionar um número que já existe
- Remova primeiro ou procure pelo número na lista

### "Erro de permissão"
- Certifique-se de estar logado
- Verifique as políticas RLS no Supabase (devem estar habilitadas)

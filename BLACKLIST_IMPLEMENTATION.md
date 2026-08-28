# Implementação da Blacklist - reLead Hub

## 📋 Resumo

Você agora tem uma **aba visual completa para gerenciar uma blacklist** de leads que pediram para não receber mensagens. O sistema:

- ✅ Permite adicionar/remover leads da blacklist manualmente
- ✅ Mostra lista visual com busca, filtro e histórico de bloqueio
- ✅ Bloqueia automaticamente esses leads de receber mensagens futuras
- ✅ Integrado com segurança (RLS no Supabase)

## 🎯 O que foi criado

### Arquivos Novos

1. **`src/hooks/useBlacklist.ts`** - Hook para gerenciar a blacklist
   - `loadBlacklist()` - Carregar lista do Supabase
   - `addToBlacklist(telefone, nome, motivo)` - Adicionar novo lead
   - `removeFromBlacklist(id)` - Remover da blacklist
   - `isBlocked(telefone)` - Verificar se um número está bloqueado

2. **`src/hooks/useBlacklistFilter.ts`** - Hook auxiliar para filtros
   - `filterLeads(leads)` - Filtra array de leads removendo os bloqueados
   - `isBlocked(telefone)` - Verifica rapidamente se está bloqueado
   - `blockedTelefones` - Set com todos os números bloqueados (para performance)

3. **`src/components/BlacklistTab.tsx`** - Interface visual completa
   - Tabela com lista de leads bloqueados
   - Formulário para adicionar à blacklist
   - Busca/filtro por telefone, nome ou motivo
   - Botão para remover da blacklist

4. **`migrations/create_blacklist_table.sql`** - Migração SQL
   - Cria tabela `blacklist` no Supabase
   - Índices para performance
   - Row Level Security (RLS) configurado

5. **`BLACKLIST_SETUP.md`** - Guia de setup e uso
   - Como executar a migração
   - Como usar a aba no app
   - FAQ e troubleshooting

## 🚀 Como usar

### Passo 1: Criar a tabela no Supabase

```bash
# Abra Supabase Dashboard → SQL Editor
# Copie o conteúdo de: migrations/create_blacklist_table.sql
# Execute a query
```

### Passo 2: Usar a aba Bloqueados

1. No app, clique em **Bloqueados** (🚫) na barra de navegação
2. Clique em **"Adicionar à blacklist"**
3. Preencha:
   - Telefone (obrigatório) - formato: `5548999999999`
   - Nome (opcional)
   - Motivo (opcional) - ex: "Pediu para remover número"
4. Clique em **"Adicionar à blacklist"**

### Passo 3: Os leads são bloqueados automaticamente

Quando você disparar uma campanha, o sistema **automaticamente filtra** qualquer lead que esteja na blacklist, então eles não recebem a mensagem.

## 📊 Visualização da Interface

```
┌─────────────────────────────────────────────────────┐
│ Bloqueados e do not call                           │
│ Gerencie leads que solicitaram não receber          │
├─────────────────────────────────────────────────────┤
│                                                       │
│ [Adicionar à blacklist]    3 leads bloqueados       │
│                                                       │
│ [Buscar por telefone...]                             │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Telefone       │ Nome           │ Motivo        │ │
│ ├─────────────────────────────────────────────────┤ │
│ │5548999999999   │Luciano Godoi   │Pediu remover  │ │
│ │5548988888888   │Maria Silva     │Sem interesse  │ │
│ │5548977777777   │─              │Solicitação   │ │
│ │               │                │              │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 🔗 Integração com DispatchForm

O hook `useBlacklistFilter` pode ser usado no DispatchForm:

```typescript
import { useBlacklistFilter } from '../hooks/useBlacklistFilter';

const MyDispatchForm = () => {
  const { filterLeads, blockedTelefones } = useBlacklistFilter();
  
  // Ao enviar:
  const { filtered, blockedCount } = filterLeads(meuLeadsArray);
  
  if (blockedCount > 0) {
    console.log(`${blockedCount} leads foram filtrados (na blacklist)`);
  }
  
  // Enviar apenas os não-bloqueados
  enviarCampanha(filtered);
};
```

## 🔒 Segurança

- **RLS (Row Level Security)** habilitado: Apenas usuários autenticados podem gerenciar
- **Telefone único**: Não permite duplicatas
- **Índices**: Busca rápida mesmo com muitos leads bloqueados
- **Soft delete**: Você pode re-adicionar um lead se necessário

## 📝 Schema SQL

```sql
CREATE TABLE blacklist (
  id UUID PRIMARY KEY,                 -- Identificador único
  telefone VARCHAR(20) NOT NULL UNIQUE, -- Número (único)
  nome VARCHAR(255),                    -- Nome do lead (opcional)
  motivo TEXT,                         -- Razão do bloqueio
  data_bloqueio TIMESTAMP,             -- Quando foi bloqueado
  adicionado_por VARCHAR(255),         -- Quem adicionou (opcional)
  created_at TIMESTAMP,                -- Criação
  updated_at TIMESTAMP                 -- Última atualização
);

CREATE INDEX idx_blacklist_telefone ON blacklist(telefone);
CREATE INDEX idx_blacklist_data_bloqueio ON blacklist(data_bloqueio DESC);
```

## 🎨 Design System

A interface segue o **Dash Design System** do projeto:
- Cores: cream paper + navy + orange
- Tipografia: Cormorant (headings) + Google Sans (body)
- Ícones: Lucide icons
- Estrutura: Cards + Tabelas + Modais

## ⚙️ Próximas Melhorias (Futuro)

- [ ] Botão "Bloquear lead" direto da aba Acompanhar (conversas)
- [ ] Importar blacklist em massa (CSV)
- [ ] Exportar blacklist como relatório
- [ ] Webhook automático para bloquear após "Não tenho interesse"
- [ ] Integração com Google Sheets para sync bidirecional
- [ ] Analytics: Gráfico de leads bloqueados por mês

## ❓ Suporte

Se encontrar problemas:

1. Verifique se a tabela `blacklist` foi criada no Supabase
2. Confirme as variáveis de ambiente (`REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY`)
3. Verifique se o RLS está habilitado e configurado
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

Ver `BLACKLIST_SETUP.md` para mais detalhes.

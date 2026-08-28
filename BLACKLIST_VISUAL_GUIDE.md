# Guia Visual - Blacklist do reLead Hub

## 🎯 Flow do Usuário

### 1. Você recebe uma conversa onde o lead pede para não receber mais

```
┌─ Aba "Acompanhar" ─────────────────────────┐
│                                             │
│ Luciano Godoi (55 48 99999-2019)           │
│ ┌──────────────────────────────────────┐   │
│ │ Lead: Remover meu número             │   │
│ │                                      │   │
│ │ Lead: Já vamos remover sua número    │   │
│ │ da nossa lista. Obrigada e tenha     │   │
│ │ um bom dia!                          │   │
│ └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Você vai para a aba "Bloqueados"

```
┌─ TopNav ──────────────────────────────────────┐
│ Analisar  │ KPIs │ Histórico │ Leads │ >> BAN │
│ Acompanhar │ Disparar │ Gerenciar │    │
└────────────────────────────────────────────────┘
                      ↓ click
```

### 3. Aba Bloqueados abre (vazia se primeira vez)

```
┌─ Bloqueados e do not call ─────────────────────┐
│ Gerencie leads que solicitaram não receber    │
├────────────────────────────────────────────────┤
│                                                 │
│ [+ Adicionar à blacklist]  0 leads bloqueados │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │  🚫                                        │ │
│ │  Nenhum lead na blacklist ainda           │ │
│ │  Leads adicionados aqui não receberão     │ │
│ │  mensagens em disparos futuros.           │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
└────────────────────────────────────────────────┘
```

### 4. Você clica "Adicionar à blacklist"

```
┌─ Bloqueados e do not call ─────────────────────┐
├────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐  │
│ │ Adicionar lead à blacklist              │  │
│ │                                          │  │
│ │ Telefone *                              │  │
│ │ [5548999999999________________]          │  │
│ │ Número sem formatação                   │  │
│ │                                          │  │
│ │ Nome (opcional)                         │  │
│ │ [Luciano Godoi________________]          │  │
│ │                                          │  │
│ │ Motivo do bloqueio                      │  │
│ │ ┌──────────────────────────────────┐    │  │
│ │ │ Pediu para remover número da lista│   │  │
│ │ └──────────────────────────────────┘    │  │
│ │                                          │  │
│ │ [✓ Adicionar] [Cancelar]                │  │
│ └──────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

### 5. Lead adicionado com sucesso

```
┌─ Bloqueados e do not call ─────────────────────┐
│                                                │
│ [+ Adicionar à blacklist]  1 lead bloqueado  │
│                                                │
│ [🔍 Buscar por telefone...]                  │
│                                                │
│ ┌──────────────────────────────────────────┐ │
│ │ Telefone   │ Nome          │ Motivo      │ │
│ ├──────────────────────────────────────────┤ │
│ │5548999999 │Luciano Godoi  │Pediu remover│ │
│ │           │               │             │ │
│ │           │               │       [🗑]  │ │
│ └──────────────────────────────────────────┘ │
│                                                │
│ ✓ Lead adicionado à blacklist               │
│                                                │
└────────────────────────────────────────────────┘
```

## 🔄 O que acontece agora

### Disparo Normal (Lead NÃO está na blacklist)

```
┌─ Disparar ──────────────────────┐
│                                 │
│ Campanha: Reavaliar             │
│ Template: reativacao_v2         │
│ Empreendimento: Lee Dama        │
│                                 │
│ Leads: 1.230 contatos          │
│ [Enviar agora]                 │
│                                 │
│ ✓ Enviando para: 1.230 leads   │
│                                 │
└─────────────────────────────────┘
```

### Disparo com Lead BLOQUEADO

```
┌─ Disparar ──────────────────────┐
│                                 │
│ Campanha: Reavaliar             │
│ Template: reativacao_v2         │
│ Leads: 1.230 contatos          │
│                                 │
│ ⚠ 3 leads na blacklist serão    │
│   filtrados automaticamente      │
│                                 │
│ [Enviar agora]                 │
│                                 │
│ ✓ Enviando para: 1.227 leads   │
│ ✓ 3 filtrados (bloqueados)     │
│                                 │
└─────────────────────────────────┘
```

## 📊 Tabela de Blacklist com Múltiplos Leads

```
┌─ Bloqueados e do not call ─────────────────────────────────┐
│                                                             │
│ [+ Adicionar à blacklist]  3 leads bloqueados              │
│                                                             │
│ [🔍 Buscar por telefone, nome ou motivo...]               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │Telefone      │Nome           │Motivo       │Data      │ ││
│ ├─────────────────────────────────────────────────────────┤│
│ │5548999999999 │Luciano Godoi  │Pediu remover│18/08 15:30│ ││
│ │5548988888888 │Maria Silva    │Sem interesse│17/08 10:15│ ││
│ │5548977777777 │—              │Solicitação  │16/08 09:45│ ││
│ │              │               │             │           │ ││
│ │              │               │       [🗑] [🗑] [🗑]     │ ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Interface Components

### Chips (Tags de Status)
```
Telefone: [5548999999999]  Tipo mono
Nome:     [Luciano Godoi]  Tipo title
Motivo:   [Pediu remover]  Tipo caption
```

### Ícones Usados
- 🚫 ban - Icon para blacklist
- 🗑️ trash - Remover item
- 🔍 search - Busca
- ✓ check - Confirmação
- ⚠️ alert-triangle - Aviso

### Cores

| Elemento | Cor | Classe |
|----------|-----|--------|
| Header   | Navy 700 | var(--navy-700) |
| Text     | Ink 50 | var(--ink-50) |
| Fundo alt| Paper 50 | var(--paper-50) |
| Border   | Paper 200 | var(--paper-200) |
| Button X | Rose 500 | var(--rose-500) |

## 💬 Mensagens de Feedback

```
✓ Lead adicionado à blacklist
✓ Lead removido da blacklist
⚠ Este telefone já está na blacklist
❌ Telefone é obrigatório
❌ Não foi possível adicionar à blacklist
```

## 🔍 Busca & Filtro

A barra de busca funciona em 3 campos:

```
[🔍 Buscar por telefone, nome ou motivo...]

Exemplos de buscas que funcionam:
- "5548999" → encontra por telefone parcial
- "Luciano" → encontra por nome
- "Pediu" → encontra por motivo
- "" (vazio) → mostra todos
```

## 📱 Responsivo

A tabela é responsiva:

```
Desktop (1024px+):
┌─────────────────────────────────────────────┐
│ Telefone   │ Nome   │ Motivo   │ Data   │ 🗑 │
└─────────────────────────────────────────────┘

Tablet (600-1024px):
┌──────────────────────────────┐
│ 5548999999999                │
│ Luciano Godoli               │
│ Pediu remover  │ 18/08 [🗑]  │
└──────────────────────────────┘

Mobile (< 600px):
┌──────────────────────────┐
│ 5548999999999            │
│ Luciano Godoli           │
│ Pediu remover            │
│ 18/08 15:30   [🗑]       │
└──────────────────────────┘
```

## ⚡ Performance

Para blacklists com muitos leads:

- **Índice por telefone** → Busca O(1)
- **Set em memória** → Filtro rápido ao disparar
- **Lazy load** → Carrega conforme scroll
- **Debounce na busca** → Reduz requisições

## 🔐 Segurança

```
User                    Frontend                  Supabase
  │                        │                        │
  ├─────— Load Blacklist ──→                       │
  │                        ├─ SELECT (RLS) ───────→│
  │                        │ ← Apenas autenticados │
  │                        │                       │
  ├─── Add to Blacklist ──→                       │
  │                        ├─ INSERT (RLS) ───────→│
  │                        │ ← Verificado         │
  │                        │                       │
  └─── Remove ────────────→                       │
                          ├─ DELETE (RLS) ───────→│
                          │ ← Verificado         │
```

## 📈 Estatísticas (Futuro)

```
Blacklist Stats (será adicionado depois)

Total Bloqueados: 47
Este mês: +12
Taxa de blocagem: 0.38%

Motivos Top:
  - "Pediu remover" (28)
  - "Sem interesse" (12)
  - "Número inválido" (7)
```

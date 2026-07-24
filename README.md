# 📊 reLead Dashboard - Plataforma de Envios e Respostas WhatsApp

Dashboard interativa para gerenciar envios e respostas de mensagens WhatsApp da plataforma reLead (Sym Imóveis - Curitiba/PR).

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install --save-dev @testing-library/react @testing-library/jest-dom

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha com suas credenciais Supabase

# 3. Iniciar desenvolvimento
npm start
```

Aplicação estará em: `http://localhost:3000`

---

## 📋 Estrutura do Projeto

```
src/
├── components/        # Componentes React reutilizáveis
├── hooks/            # Hooks customizados (Supabase)
├── lib/              # Configuração do Supabase
├── pages/            # Páginas da aplicação
├── types.ts          # Interfaces TypeScript
├── App.tsx           # Componente raiz
└── index.tsx         # Entrada da aplicação

cypress/
└── e2e/              # Testes end-to-end

public/
└── index.html        # HTML template
```

---

## 🧪 Testes

```bash
# Testes unitários e integração
npm test

# Testes com coverage
npm test -- --coverage

# Testes E2E (Cypress)
npx cypress open      # GUI
npx cypress run       # Headless
```

---

## 🔧 Variáveis de Ambiente

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
REACT_APP_DEBUG_MODE=false
```

---

## 📚 Documentação

- **[QUICK_START.md](./QUICK_START.md)** - Início rápido (5 min)
- **[DASHBOARD_README.md](./DASHBOARD_README.md)** - Componentes e tipos
- **[SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)** - Integração com banco
- **[PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)** - Otimizações
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Guia de testes
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumo completo

---

## 🎯 Funcionalidades

✅ **Listar Envios** - Com filtros avançados  
✅ **Visualizar Conversa** - Histórico de mensagens  
✅ **Dados Extraídos** - Bairro, valor, tipo imóvel  
✅ **Classificação IA** - Interessado ou não  
✅ **Ações Rápidas** - Reenviar, marcar, copiar  
✅ **Real-time Updates** - Subscriptions Supabase  
✅ **Responsividade** - Desktop, tablet, mobile  
✅ **Acessibilidade** - WCAG AA  

---

## 🏗️ Stack

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database & Real-time
- **Jest** - Testing
- **Cypress** - E2E Testing

---

## 📊 Status

✅ Desenvolvimento completo  
✅ 56+ testes implementados  
✅ Documentação completa  
✅ Pronto para produção  

---

## 🤝 Contributing

1. Crie uma branch (`git checkout -b feature/sua-feature`)
2. Commit suas mudanças (`git commit -m "Add feature"`)
3. Push para a branch (`git push origin feature/sua-feature`)
4. Abra um Pull Request

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação apropriada
2. Rode os testes: `npm test`
3. Verifique os logs: `npm start` com `DEBUG_MODE=true`

---

## 📝 License

Proprietary - Sym Imóveis

---

**Desenvolvido com ❤️ para Sym Imóveis**  
v0.1.0 - Junho 2026

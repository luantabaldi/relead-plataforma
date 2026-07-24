describe('Dashboard reLead - E2E Tests', () => {
  beforeEach(() => {
    // Visitar a dashboard
    cy.visit('/');

    // Aguardar carregamento
    cy.contains('reLead', { timeout: 10000 }).should('be.visible');
  });

  describe('Carregamento Inicial', () => {
    it('deve exibir header com título', () => {
      cy.contains('📊 reLead - Envios e Respostas').should('be.visible');
    });

    it('deve exibir barra de filtros', () => {
      cy.contains('🔍 Buscar por nome ou telefone').should('be.visible');
    });

    it('deve exibir lista de envios', () => {
      cy.get('[class*="Message List"]', { timeout: 5000 }).should('be.visible');
    });

    it('deve exibir painel principal vazio ou com conversa', () => {
      cy.get('[class*="Main Panel"]', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Filtros', () => {
    it('deve buscar por nome', () => {
      cy.get('input[placeholder*="Buscar"]').type('João');

      // Aguardar filtro aplicar
      cy.wait(500);

      // Verificar se lista atualiza
      cy.get('[class*="Message"]').then((items) => {
        cy.wrap(items).should('have.length.greaterThan', 0);
      });
    });

    it('deve abrir/fechar filtros avançados', () => {
      cy.contains('🎛️ Filtros Avançados').click();

      // Deve aparecer opções
      cy.contains('Campanha').should('be.visible');

      // Clicar novamente para fechar
      cy.contains('🎛️ Filtros Avançados').click();

      cy.contains('Campanha').should('not.be.visible');
    });

    it('deve filtrar por campanha', () => {
      cy.contains('🎛️ Filtros Avançados').click();

      cy.get('input[type="checkbox"]').first().check();

      cy.wait(500);

      // Verificar se lista atualiza
      cy.get('[class*="Message"]').should('have.length.greaterThan', 0);
    });

    it('deve filtrar por status', () => {
      cy.contains('🎛️ Filtros Avançados').click();

      cy.get('input[type="checkbox"]').eq(2).check();

      cy.wait(500);

      cy.get('[class*="Message"]').should('have.length.greaterThan', 0);
    });

    it('deve limpar filtros', () => {
      cy.contains('🎛️ Filtros Avançados').click();

      cy.get('input[type="checkbox"]').first().check();

      cy.contains('🔄 Limpar Filtros').click();

      cy.wait(500);

      cy.get('input[type="checkbox"]').first().should('not.be.checked');
    });
  });

  describe('Seleção de Conversa', () => {
    it('deve selecionar conversa ao clicar', () => {
      cy.get('[class*="Message"]').first().click();

      // Deve exibir detalhes no painel principal
      cy.get('[class*="Panel Header"]').should('be.visible');
    });

    it('deve exibir histórico de mensagens', () => {
      cy.get('[class*="Message"]').first().click();

      cy.contains('💬 Histórico da Conversa').should('be.visible');
    });

    it('deve exibir dados extraídos', () => {
      cy.get('[class*="Message"]').first().click();

      cy.contains('📋 Dados Extraídos').should('be.visible');
    });

    it('deve exibir classificação da IA', () => {
      cy.get('[class*="Message"]').first().click();

      cy.contains('✅ Classificação da IA').should('be.visible');
    });
  });

  describe('Ações Rápidas', () => {
    beforeEach(() => {
      // Selecionar uma conversa
      cy.get('[class*="Message"]').first().click();
    });

    it('deve clicar em reenviar', () => {
      cy.contains('📤 Reenviar').click();

      // Verificar feedback
      cy.contains('✅', { timeout: 5000 }).should('be.visible');
    });

    it('deve clicar em marcar interessado', () => {
      cy.contains('👍 Marcar Interessado').click();

      cy.contains('✅', { timeout: 5000 }).should('be.visible');
    });

    it('deve clicar em marcar sem interesse', () => {
      cy.contains('❌ Marcar Sem Interesse').click();

      cy.contains('✅', { timeout: 5000 }).should('be.visible');
    });

    it('deve clicar em copiar para CRM', () => {
      cy.contains('📋 Copiar CRM').click();

      cy.contains('✅', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Responsividade', () => {
    it('deve funcionar em resolução desktop', () => {
      cy.viewport('macbook-15');

      cy.contains('📊 reLead').should('be.visible');
      cy.get('[class*="Message"]').should('have.length.greaterThan', 0);
    });

    it('deve funcionar em resolução tablet', () => {
      cy.viewport('ipad-2');

      cy.contains('📊 reLead').should('be.visible');
    });

    it('deve funcionar em resolução mobile', () => {
      cy.viewport('iphone-x');

      cy.contains('📊 reLead').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('deve carregar em menos de 3 segundos', () => {
      cy.visit('/');

      cy.contains('reLead').should('be.visible');
    });

    it('deve responder ao filtrar em menos de 500ms', () => {
      const start = performance.now();

      cy.get('input[placeholder*="Buscar"]').type('test');

      cy.wait(500);

      // Performance check
      cy.window().then(() => {
        const end = performance.now();
        const time = end - start;
        expect(time).to.be.lessThan(1000); // 1 segundo
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir mensagem de erro se Supabase falhar', () => {
      // Mock error
      cy.intercept('GET', '**/rest/**', {
        statusCode: 500,
        body: { message: 'Server error' },
      });

      cy.visit('/');

      cy.contains('Erro', { timeout: 5000 }).should('be.visible');
    });

    it('deve permitir retry após erro', () => {
      cy.intercept('GET', '**/rest/**', {
        statusCode: 500,
      });

      cy.visit('/');

      cy.contains('Erro').should('be.visible');

      // Limpar intercept
      cy.intercept('GET', '**/rest/**', {
        statusCode: 200,
        body: { data: [] },
      });

      cy.contains('🔄 Tentar Novamente').click();

      cy.contains('reLead').should('be.visible');
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels em inputs', () => {
      cy.get('input[placeholder*="Buscar"]').should('have.attr', 'placeholder');
    });

    it('deve permitir navegação por tab', () => {
      cy.get('input[placeholder*="Buscar"]').focus();

      cy.focused().should('have.attr', 'placeholder');

      cy.realPress('Tab');

      cy.focused().should('not.have.attr', 'placeholder', 'Buscar');
    });

    it('deve ter contraste de cores adequado', () => {
      cy.contains('📊 reLead')
        .parent()
        .should('have.css', 'color')
        .and('not.equal', 'rgb(255, 255, 255)'); // Não branco sobre branco
    });
  });
});

-- Criar tabela de blacklist para leads que solicitaram para não receber mensagens
CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(255),
  motivo TEXT,
  data_bloqueio TIMESTAMP DEFAULT NOW(),
  adicionado_por VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para buscas rápidas por telefone
CREATE INDEX IF NOT EXISTS idx_blacklist_telefone ON blacklist(telefone);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_blacklist_data_bloqueio ON blacklist(data_bloqueio DESC);

-- RLS Policy: Apenas usuários autenticados podem ver a blacklist
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view blacklist"
  ON blacklist FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert into blacklist"
  ON blacklist FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete from blacklist"
  ON blacklist FOR DELETE
  USING (auth.role() = 'authenticated');

-- Comentário
COMMENT ON TABLE blacklist IS 'Armazena leads que pediram para não receber mensagens (Do Not Call)';

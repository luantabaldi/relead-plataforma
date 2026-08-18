// Tipos e Interfaces para a Dashboard

export type CampaignType = 'reativacao' | 'prospeccao';
export type MessageStatus = 'enviado' | 'respondido' | 'interessado' | 'sem_interesse' | 'pausado' | 'erro' | 'pendente';
export type SenderType = 'user' | 'lead' | 'ia';

export interface Message {
  id: string;
  dispatch_id: string;
  telefone: string;
  texto: string;
  sender: SenderType;
  timestamp: Date;
  tipo_campanha: CampaignType;
}

export interface ConversationData {
  bairro?: string;
  valor_buscado?: string;
  tipo_imovel?: string;
}

export interface AIClassification {
  interesse: boolean;
  confianca: number;
  motivo: string;
  opt_out: boolean;
}

export interface Dispatch {
  id: string;
  telefone: string;
  nome: string;
  tipo_campanha: CampaignType;
  status: MessageStatus;
  template_nome: string;
  timestamp_envio: Date;
  timestamp_resposta?: Date;
  id_crm?: number;
  url_imagem?: string;
  observacao?: string;
}

export interface ConversationThread {
  dispatch: Dispatch;
  messages: Message[];
  extracted_data: ConversationData;
  ai_classification: AIClassification;
}

export interface FilterOptions {
  campanhas: CampaignType[];
  statuses: MessageStatus[];
  dataInicio: Date;
  dataFim: Date;
  busca?: string;
  nomeCampanha?: string | null;
}

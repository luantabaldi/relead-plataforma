export interface LeadReativacao {
  id: string
  lead_id_cvcrm: string
  telefone: string
  nome_lead: string
  status_reativacao: 'Enviado' | 'Respondido' | 'Reativado' | 'Erro no Disparo' | 'Pausado (Horário Excedido)'
  data_envio: string
  data_resposta: string | null
  mensagem_enviada: string
  ultima_resposta_lead: string | null
  historico_mensagens: object
  tipo_campanha: 'reativacao' | 'prospeccao'
  nome_campanha: string | null
}

export interface ConversaIA {
  id: string
  telefone: string
  status_conversa: 'ativa' | 'interesse_confirmado' | 'sem_interesse'
  interesse_detectado: boolean
  resumo_interesse: string | null
  imovel_interesse: string | null
}

export interface LeadDoCsv {
  nome: string
  telefone: string
  observacao: string
}

export interface PayloadDisparo {
  nome_campanha: string
  template_nome: string
  id_empreendimento: string
  tipo_campanha: string
  link_imagem: string | null
  leads: LeadDoCsv[]
}

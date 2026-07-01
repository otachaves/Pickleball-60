export interface Categoria {
  id: number
  nome: string
  ordem: number
  formato: 'grupos_apenas' | 'quartas' | 'semifinal'
  horario?: string | null
}

export interface ProgramacaoItem {
  quando: string
  o_que: string
  detalhe: string
}

// Dados do evento (tabela `evento`, uma linha) — tudo que muda a cada torneio
export interface Evento {
  id: number
  nome_curto: string // cabeçalho, ex: "Copa Imperial"
  titulo: string // tela Informações, ex: "🏆 Copa Imperial 60+"
  subtitulo: string // ex: "Torneio de Pickleball"
  formato_jogo: string | null // ex: "Game único até 15 pontos"
  programacao: ProgramacaoItem[]
  local_nome: string
  local_endereco: string
  local_cidade: string | null
  local_maps_url: string | null
  estacionamento: string | null
  contato_nome: string
  contato_whatsapp: string // só dígitos, para o link wa.me
  contato_whatsapp_label: string // exibição, ex: "+55 24 98805-0643"
}

export const EVENTO_FALLBACK: Evento = {
  id: 0,
  nome_curto: 'Torneio',
  titulo: '🏆 Torneio',
  subtitulo: 'Torneio de Pickleball',
  formato_jogo: null,
  programacao: [],
  local_nome: '',
  local_endereco: '',
  local_cidade: null,
  local_maps_url: null,
  estacionamento: null,
  contato_nome: '',
  contato_whatsapp: '',
  contato_whatsapp_label: '',
}

export interface Grupo {
  id: number
  nome: string
  categoria_id: number
}

export interface Time {
  id: number
  nome: string
  grupo_id: number
}

export type Rodada =
  | 'grupos'
  | 'quartas'
  | 'semifinal'
  | 'final'
  | 'terceiro_lugar'
  | 'wildcard'

export interface Jogo {
  id: number
  categoria_id: number
  grupo_id: number | null
  time_a_id: number
  time_b_id: number
  placar_a: number
  placar_b: number
  status: 'pendente' | 'em_andamento' | 'encerrado'
  horario_previsto: string | null
  rodada: Rodada
  bracket_slot: number | null
  time_a?: Time
  time_b?: Time
}

export interface ClassificacaoRow {
  time: Time
  jogos: number
  vitorias: number
  derrotas: number
  pontos_marcados: number
  pontos_sofridos: number
  saldo: number
  pontos: number
}

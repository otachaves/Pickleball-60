export interface Categoria {
  id: number
  nome: string
  ordem: number
  formato: 'grupos_apenas' | 'quartas' | 'semifinal'
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

import { calcularClassificacao } from './classificacao'
import { ClassificacaoRow, Grupo, Jogo, Time } from './types'

export type FormatoBracket = 'quartas' | 'semifinal'

export interface BracketConfig {
  formato: FormatoBracket
  classificadosDiretos: number
  wildcards: number
}

export interface WildcardStatus {
  diretos: ClassificacaoRow[]
  wildcardCandidatos: ClassificacaoRow[]
  wildcardResolvidos: ClassificacaoRow[]
  empate: null | { tipo: 'dois' | 'tres'; times: ClassificacaoRow[] }
}

// ── Config ───────────────────────────────────────────────────

export function getBracketConfig(grupos: Grupo[]): BracketConfig {
  const n = grupos.length
  // 3 grupos → 1º de cada grupo (3) + melhor 2º colocado (1) = 4 → Semifinal
  if (n === 3) return { formato: 'semifinal', classificadosDiretos: 3, wildcards: 1 }
  // 4+ grupos → top 2 de cada = quartas
  if (n >= 4) return { formato: 'quartas', classificadosDiretos: n * 2, wildcards: 0 }
  // 1-2 grupos → top 2 de cada = 4 → Semifinal
  return { formato: 'semifinal', classificadosDiretos: n * 2, wildcards: 0 }
}

// ── Classificação helpers ─────────────────────────────────────

function sortRows(rows: ClassificacaoRow[], jogos: Jogo[]): ClassificacaoRow[] {
  return [...rows].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos
    if (b.saldo !== a.saldo) return b.saldo - a.saldo
    const cd = confrontoDireto(a.time.id, b.time.id, jogos)
    if (cd !== 0) return cd
    return b.vitorias - a.vitorias
  })
}

function confrontoDireto(aId: number, bId: number, jogos: Jogo[]): number {
  const j = jogos.find(
    (j) =>
      j.status === 'encerrado' &&
      ((j.time_a_id === aId && j.time_b_id === bId) ||
        (j.time_a_id === bId && j.time_b_id === aId))
  )
  if (!j) return 0
  const aIsA = j.time_a_id === aId
  const aScore = aIsA ? j.placar_a : j.placar_b
  const bScore = aIsA ? j.placar_b : j.placar_a
  return aScore > bScore ? -1 : bScore > aScore ? 1 : 0
}

function isTied(a: ClassificacaoRow, b: ClassificacaoRow, jogos: Jogo[]): boolean {
  if (a.pontos !== b.pontos) return false
  if (a.saldo !== b.saldo) return false
  if (confrontoDireto(a.time.id, b.time.id, jogos) !== 0) return false
  return a.vitorias === b.vitorias
}

// ── Wildcard resolution ───────────────────────────────────────

export function resolverWildcards(
  grupos: Grupo[],
  times: Time[],
  jogosGrupos: Jogo[],
  jogosWildcard: Jogo[]
): WildcardStatus {
  const diretos: ClassificacaoRow[] = []    // 1º de cada grupo
  const candidatos: ClassificacaoRow[] = [] // 2º de cada grupo, disputando a(s) vaga(s)

  for (const grupo of grupos) {
    const t = times.filter((x) => x.grupo_id === grupo.id)
    const j = jogosGrupos.filter((x) => x.grupo_id === grupo.id)
    const rank = calcularClassificacao(t, j)
    if (rank[0]) diretos.push(rank[0])
    if (rank[1]) candidatos.push(rank[1])
  }

  // Vagas de wildcard = quantas faltam para completar 4 classificados
  const numWildcards = Math.max(0, 4 - grupos.length) // 3 grupos → 1

  // Vagas suficientes para todos os vice-líderes → todos passam
  if (candidatos.length <= numWildcards) {
    return { diretos, wildcardCandidatos: candidatos, wildcardResolvidos: candidatos, empate: null }
  }

  const todosJogos = [...jogosGrupos, ...jogosWildcard]
  const sorted = sortRows(candidatos, todosJogos)

  const ultimoDentro = sorted[numWildcards - 1]
  const primeiroFora = sorted[numWildcards]

  // Sem empate na linha de corte → resolvido direto
  if (!isTied(ultimoDentro, primeiroFora, todosJogos)) {
    return {
      diretos,
      wildcardCandidatos: sorted,
      wildcardResolvidos: sorted.slice(0, numWildcards),
      empate: null,
    }
  }

  // Empate na linha de corte: todos os empatados nesse nível disputam a(s) vaga(s)
  const empatados = sorted.filter((r) => isTied(r, ultimoDentro, todosJogos))
  const tipo: 'dois' | 'tres' = empatados.length >= 3 ? 'tres' : 'dois'

  const ids = empatados.map((e) => e.time.id)
  const jogosDesempate = jogosWildcard.filter(
    (j) => ids.includes(j.time_a_id) && ids.includes(j.time_b_id)
  )
  const esperados = tipo === 'tres' ? 3 : 1
  const desempateResolvido =
    jogosDesempate.length >= esperados && jogosDesempate.every((j) => j.status === 'encerrado')

  if (!desempateResolvido) {
    return {
      diretos,
      wildcardCandidatos: sorted,
      wildcardResolvidos: [],
      empate: { tipo, times: empatados },
    }
  }

  // Desempate jogado → reordena com os jogos extras e resolve
  const rerank = sortRows(candidatos, todosJogos)
  return {
    diretos,
    wildcardCandidatos: rerank,
    wildcardResolvidos: rerank.slice(0, numWildcards),
    empate: null,
  }
}

// ── Cross-group seeding (apenas primeira fase eliminatória) ──

// 8 teams: standard QF pairs are [1v8, 4v5, 2v7, 3v6]
// Upper seed indices in QF order: [0, 3, 1, 2]
// Preferred lower seed indices: [7, 4, 6, 5]
// Returns array of [upperIdx, lowerIdx] pairs per QF
function pairCrossGroup8(seeds: ClassificacaoRow[]): [number, number][] {
  const upperIdxs = [0, 3, 1, 2]
  const preferredLowerIdxs = [7, 4, 6, 5]
  const lowerPool = new Set([4, 5, 6, 7])
  const result: [number, number][] = []

  for (let qi = 0; qi < 4; qi++) {
    const upper = upperIdxs[qi]
    const preferred = preferredLowerIdxs[qi]

    // Sort: same-group last, then by distance from preferred
    const candidates = [...lowerPool].sort((a, b) => {
      const aConflict = seeds[a].time.grupo_id === seeds[upper].time.grupo_id
      const bConflict = seeds[b].time.grupo_id === seeds[upper].time.grupo_id
      if (aConflict !== bConflict) return aConflict ? 1 : -1
      return Math.abs(a - preferred) - Math.abs(b - preferred)
    })

    const chosen = candidates[0]
    lowerPool.delete(chosen)
    result.push([upper, chosen])
  }

  return result
}

// 4 teams: standard SF pairs are [1v4, 2v3]
function pairCrossGroup4(seeds: ClassificacaoRow[]): [number, number][] {
  const g = seeds.map((s) => s.time.grupo_id)
  // Try 1v4, 2v3
  if (g[0] !== g[3] && g[1] !== g[2]) return [[0, 3], [1, 2]]
  // Try 1v3, 2v4
  if (g[0] !== g[2] && g[1] !== g[3]) return [[0, 2], [1, 3]]
  // Try 1v2, 3v4 (last resort)
  if (g[0] !== g[1] && g[2] !== g[3]) return [[0, 1], [2, 3]]
  // Fallback
  return [[0, 3], [1, 2]]
}

// ── Jogo generation ───────────────────────────────────────────

interface JogoInsert {
  categoria_id: number
  grupo_id: null
  time_a_id: number
  time_b_id: number
  placar_a: number
  placar_b: number
  status: 'pendente'
  rodada: string
  bracket_slot: number
}

export function gerarJogosEliminatorios(
  categoriaId: number,
  classificados: ClassificacaoRow[]
): JogoInsert[] {
  const jogos: JogoInsert[] = []
  const placeholder = classificados[0]

  // 8 teams: Quartas com cruzamento anti-grupo
  if (classificados.length === 8) {
    const pairs = pairCrossGroup8(classificados)
    pairs.forEach(([upIdx, lowIdx], i) => {
      jogos.push({
        categoria_id: categoriaId,
        grupo_id: null,
        time_a_id: classificados[upIdx].time.id,
        time_b_id: classificados[lowIdx].time.id,
        placar_a: 0,
        placar_b: 0,
        status: 'pendente',
        rodada: 'quartas',
        bracket_slot: i + 1,
      })
    })

    // Semis e Final (placeholders)
    jogos.push({
      categoria_id: categoriaId, grupo_id: null,
      time_a_id: placeholder.time.id, time_b_id: placeholder.time.id,
      placar_a: 0, placar_b: 0, status: 'pendente', rodada: 'semifinal', bracket_slot: 1,
    })
    jogos.push({
      categoria_id: categoriaId, grupo_id: null,
      time_a_id: placeholder.time.id, time_b_id: placeholder.time.id,
      placar_a: 0, placar_b: 0, status: 'pendente', rodada: 'semifinal', bracket_slot: 2,
    })
    jogos.push({
      categoria_id: categoriaId, grupo_id: null,
      time_a_id: placeholder.time.id, time_b_id: placeholder.time.id,
      placar_a: 0, placar_b: 0, status: 'pendente', rodada: 'final', bracket_slot: 1,
    })
    jogos.push({
      categoria_id: categoriaId, grupo_id: null,
      time_a_id: placeholder.time.id, time_b_id: placeholder.time.id,
      placar_a: 0, placar_b: 0, status: 'pendente', rodada: 'terceiro_lugar', bracket_slot: 1,
    })
  }

  // 4 teams: Semi direto com cruzamento anti-grupo
  if (classificados.length === 4) {
    const pairs = pairCrossGroup4(classificados)
    pairs.forEach(([upIdx, lowIdx], i) => {
      jogos.push({
        categoria_id: categoriaId,
        grupo_id: null,
        time_a_id: classificados[upIdx].time.id,
        time_b_id: classificados[lowIdx].time.id,
        placar_a: 0,
        placar_b: 0,
        status: 'pendente',
        rodada: 'semifinal',
        bracket_slot: i + 1,
      })
    })
    jogos.push({
      categoria_id: categoriaId, grupo_id: null,
      time_a_id: placeholder.time.id, time_b_id: placeholder.time.id,
      placar_a: 0, placar_b: 0, status: 'pendente', rodada: 'final', bracket_slot: 1,
    })
    jogos.push({
      categoria_id: categoriaId, grupo_id: null,
      time_a_id: placeholder.time.id, time_b_id: placeholder.time.id,
      placar_a: 0, placar_b: 0, status: 'pendente', rodada: 'terceiro_lugar', bracket_slot: 1,
    })
  }

  return jogos
}

// ── Wildcard extra games ──────────────────────────────────────

export function gerarJogosWildcard(
  categoriaId: number,
  terceiros: ClassificacaoRow[],
  tipo: 'dois' | 'tres'
): JogoInsert[] {
  const make = (a: ClassificacaoRow, b: ClassificacaoRow, slot: number): JogoInsert => ({
    categoria_id: categoriaId,
    grupo_id: null,
    time_a_id: a.time.id,
    time_b_id: b.time.id,
    placar_a: 0,
    placar_b: 0,
    status: 'pendente',
    rodada: 'wildcard',
    bracket_slot: slot,
  })

  if (tipo === 'dois') {
    return [make(terceiros[0], terceiros[1], 1)]
  }

  return [
    make(terceiros[0], terceiros[1], 1),
    make(terceiros[0], terceiros[2], 2),
    make(terceiros[1], terceiros[2], 3),
  ]
}

// ── Winner helpers ────────────────────────────────────────────

export function getVencedor(jogo: Jogo): 'a' | 'b' | null {
  if (jogo.status !== 'encerrado') return null
  if (jogo.placar_a > jogo.placar_b) return 'a'
  if (jogo.placar_b > jogo.placar_a) return 'b'
  return null
}

export function getPerdedor(jogo: Jogo): 'a' | 'b' | null {
  const v = getVencedor(jogo)
  if (!v) return null
  return v === 'a' ? 'b' : 'a'
}

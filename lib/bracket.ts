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
  const wildcards = n === 3 ? 2 : 0
  return { formato: 'quartas', classificadosDiretos: n * 2, wildcards }
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
  const diretos: ClassificacaoRow[] = []
  const terceiros: ClassificacaoRow[] = []

  for (const grupo of grupos) {
    const t = times.filter((x) => x.grupo_id === grupo.id)
    const j = jogosGrupos.filter((x) => x.grupo_id === grupo.id)
    const rank = calcularClassificacao(t, j)
    if (rank[0]) diretos.push(rank[0])
    if (rank[1]) diretos.push(rank[1])
    if (rank[2]) terceiros.push(rank[2])
  }

  if (terceiros.length === 0) {
    return { diretos, wildcardCandidatos: [], wildcardResolvidos: [], empate: null }
  }

  const todosJogos = [...jogosGrupos, ...jogosWildcard]
  const sorted3 = sortRows(terceiros, todosJogos)

  if (sorted3.length < 2) {
    return { diretos, wildcardCandidatos: sorted3, wildcardResolvidos: sorted3, empate: null }
  }

  const wc1 = sorted3[0]
  const wc2 = sorted3[1]
  const wc3 = sorted3[2] as ClassificacaoRow | undefined

  if (wc3 && isTied(wc2, wc3, todosJogos)) {
    if (isTied(wc1, wc2, todosJogos)) {
      const wildcardGamesExist = jogosWildcard.some(
        (j) =>
          [wc1.time.id, wc2.time.id, wc3.time.id].includes(j.time_a_id) &&
          [wc1.time.id, wc2.time.id, wc3.time.id].includes(j.time_b_id)
      )
      if (!wildcardGamesExist || jogosWildcard.some((j) => j.status !== 'encerrado')) {
        return {
          diretos,
          wildcardCandidatos: [wc1, wc2, wc3],
          wildcardResolvidos: [],
          empate: { tipo: 'tres', times: [wc1, wc2, wc3] },
        }
      }
      const rerank = sortRows([wc1, wc2, wc3], todosJogos)
      if (isTied(rerank[1], rerank[2], todosJogos)) {
        return {
          diretos,
          wildcardCandidatos: rerank,
          wildcardResolvidos: rerank.slice(0, 2),
          empate: null,
        }
      }
      return {
        diretos,
        wildcardCandidatos: rerank,
        wildcardResolvidos: rerank.slice(0, 2),
        empate: null,
      }
    }

    const wcGame = jogosWildcard.find(
      (j) =>
        ((j.time_a_id === wc2.time.id && j.time_b_id === wc3.time.id) ||
          (j.time_a_id === wc3.time.id && j.time_b_id === wc2.time.id))
    )
    if (!wcGame || wcGame.status !== 'encerrado') {
      return {
        diretos,
        wildcardCandidatos: sorted3,
        wildcardResolvidos: [],
        empate: { tipo: 'dois', times: [wc2, wc3] },
      }
    }
    const rerank = sortRows([wc1, wc2, wc3], todosJogos)
    return {
      diretos,
      wildcardCandidatos: rerank,
      wildcardResolvidos: rerank.slice(0, 2),
      empate: null,
    }
  }

  return {
    diretos,
    wildcardCandidatos: sorted3,
    wildcardResolvidos: [wc1, wc2],
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

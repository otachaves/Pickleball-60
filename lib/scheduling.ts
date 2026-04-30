import { Jogo } from './types'

/**
 * Ordena os jogos de um grupo usando o método circular de rodízio
 * para minimizar partidas consecutivas com o mesmo time.
 *
 * Para n=4 times: ordem alternada por rounds.
 *   Antes: (1v2), (1v3), (1v4), (2v3), (2v4), (3v4)  ← time 1 joga 3 seguidos!
 *   Depois: (1v4), (2v3), (1v3), (2v4), (1v2), (3v4)  ← rounds alternados
 *
 * Para n=3 (ímpar): adiciona um "fantasma" que rotaciona; descarta seus pares.
 */
export function sortGamesRoundRobin(jogosGrupo: Jogo[]): Jogo[] {
  if (jogosGrupo.length === 0) return []

  // IDs únicos dos times participantes
  const teamSet = new Set<number>()
  for (const j of jogosGrupo) {
    teamSet.add(j.time_a_id)
    teamSet.add(j.time_b_id)
  }
  const teams = [...teamSet].sort((a, b) => a - b)
  const n = teams.length
  if (n < 2) return jogosGrupo

  // Sequência rotativa (com fantasma se ímpar)
  const seq: number[] = [...teams]
  if (n % 2 === 1) seq.push(-1)
  const m = seq.length

  const ordered: Jogo[] = []
  const used = new Set<number>()

  for (let round = 0; round < m - 1; round++) {
    for (let i = 0; i < m / 2; i++) {
      const a = seq[i]
      const b = seq[m - 1 - i]
      if (a === -1 || b === -1) continue
      const game = jogosGrupo.find(
        (j) =>
          !used.has(j.id) &&
          ((j.time_a_id === a && j.time_b_id === b) ||
            (j.time_a_id === b && j.time_b_id === a))
      )
      if (game) {
        ordered.push(game)
        used.add(game.id)
      }
    }

    // Rotaciona mantendo a posição 0 fixa
    const last = seq[m - 1]
    for (let i = m - 1; i > 1; i--) {
      seq[i] = seq[i - 1]
    }
    seq[1] = last
  }

  // Adiciona qualquer jogo não casado (fallback de segurança)
  for (const j of jogosGrupo) {
    if (!used.has(j.id)) ordered.push(j)
  }

  return ordered
}

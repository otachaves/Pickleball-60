import { ClassificacaoRow, Jogo, Time } from './types'

// Head-to-head result between two players in a given set of games
// Returns -1 if timeA won, +1 if timeB won, 0 if no result
function confrontoDireto(timeAId: number, timeBId: number, jogos: Jogo[]): number {
  const jogo = jogos.find(
    (j) =>
      j.status === 'encerrado' &&
      ((j.time_a_id === timeAId && j.time_b_id === timeBId) ||
        (j.time_a_id === timeBId && j.time_b_id === timeAId))
  )
  if (!jogo) return 0
  if (jogo.time_a_id === timeAId) {
    if (jogo.placar_a > jogo.placar_b) return -1 // A wins → A ranks higher
    if (jogo.placar_b > jogo.placar_a) return 1
  } else {
    if (jogo.placar_b > jogo.placar_a) return -1 // A was time_b and won
    if (jogo.placar_a > jogo.placar_b) return 1
  }
  return 0
}

export function calcularClassificacao(
  times: Time[],
  jogos: Jogo[]
): ClassificacaoRow[] {
  const map = new Map<number, ClassificacaoRow>()

  for (const time of times) {
    map.set(time.id, {
      time,
      jogos: 0,
      vitorias: 0,
      derrotas: 0,
      pontos_marcados: 0,
      pontos_sofridos: 0,
      saldo: 0,
      pontos: 0,
    })
  }

  for (const jogo of jogos) {
    if (jogo.status !== 'encerrado') continue
    const a = map.get(jogo.time_a_id)
    const b = map.get(jogo.time_b_id)
    if (!a || !b) continue

    a.jogos++
    b.jogos++
    a.pontos_marcados += jogo.placar_a
    a.pontos_sofridos += jogo.placar_b
    b.pontos_marcados += jogo.placar_b
    b.pontos_sofridos += jogo.placar_a

    // Pontuação: vitória = 3, derrota = 0 (não existe empate)
    if (jogo.placar_a > jogo.placar_b) {
      a.vitorias++; a.pontos += 3
      b.derrotas++
    } else if (jogo.placar_b > jogo.placar_a) {
      b.vitorias++; b.pontos += 3
      a.derrotas++
    }
  }

  for (const row of map.values()) {
    row.saldo = row.pontos_marcados - row.pontos_sofridos
  }

  // Critérios de desempate: pontos → saldo → confronto direto → vitórias
  return Array.from(map.values()).sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos
    if (b.saldo !== a.saldo) return b.saldo - a.saldo
    const cd = confrontoDireto(a.time.id, b.time.id, jogos)
    if (cd !== 0) return cd
    return b.vitorias - a.vitorias
  })
}

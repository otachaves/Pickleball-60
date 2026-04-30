import { Categoria, Grupo, Jogo } from './types'
import { sortGamesRoundRobin } from './scheduling'

const CATEGORIA_INITIALS: Record<string, string> = {
  'Single Masculino': 'SM',
  'Dupla Mista': 'DX',
  'Dupla Masculina': 'DM',
  'Dupla Feminina': 'DF',
  'Quarteto': 'QT',
}

function getInitials(nome: string): string {
  if (CATEGORIA_INITIALS[nome]) return CATEGORIA_INITIALS[nome]
  return nome
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .join('')
    .slice(0, 3)
}

export function getCodigoJogo(
  jogo: Jogo,
  categoria: Categoria | undefined,
  grupos: Grupo[],
  todosJogos: Jogo[]
): string {
  if (!categoria) return ''
  const initials = getInitials(categoria.nome)

  if (jogo.rodada === 'grupos') {
    const grupo = grupos.find((g) => g.id === jogo.grupo_id)
    if (!grupo) return ''
    const jogosNoGrupo = sortGamesRoundRobin(
      todosJogos.filter((j) => j.rodada === 'grupos' && j.grupo_id === jogo.grupo_id)
    )
    const idx = jogosNoGrupo.findIndex((j) => j.id === jogo.id) + 1
    // Extrair letra/número do grupo: "Grupo A" → "A", "Grupo Único" → "Ú"
    const grupoLetra =
      grupo.nome.replace(/^Grupo\s+/i, '').charAt(0).toUpperCase() ||
      grupo.nome.charAt(0).toUpperCase()
    return `Jogo${idx}g-${grupoLetra}-${initials}`
  }

  if (jogo.rodada === 'quartas') return `QF${jogo.bracket_slot}-${initials}`
  if (jogo.rodada === 'semifinal') return `Semi${jogo.bracket_slot}-${initials}`
  if (jogo.rodada === 'final') return `Final-${initials}`
  if (jogo.rodada === 'terceiro_lugar') return `3Lugar-${initials}`
  if (jogo.rodada === 'wildcard') return `WC${jogo.bracket_slot}-${initials}`

  return ''
}

import { Categoria } from './types'

export interface Regras {
  classificacao: string[]
  desempate: string[]
  fases: string[]
}

const DESEMPATE_PADRAO = [
  'Pontos (Vitória = 3, Derrota = 0)',
  'Saldo de pontos',
  'Confronto direto',
  'Número de vitórias',
]

export function getRegras(categoria: Categoria, numGrupos: number): Regras {
  // Categorias sem fase eliminatória (Dupla Feminina, Quarteto)
  if (categoria.formato === 'grupos_apenas') {
    return {
      classificacao: [
        'Todos jogam contra todos (rodízio)',
        'Sem fase eliminatória',
        'Classificação final definida pela tabela do grupo',
      ],
      desempate: DESEMPATE_PADRAO,
      fases: [
        '🥇 1° lugar: melhor da tabela',
        '🥈 2° lugar: 2° da tabela',
        '🥉 3° lugar: 3° da tabela',
      ],
    }
  }

  // 3 grupos → Semifinal direto: 1º de cada grupo + melhor 2º (sem quartas)
  if (numGrupos === 3) {
    return {
      classificacao: [
        '3 grupos — 1º de cada grupo se classifica (3 diretos)',
        '+ o melhor 2º colocado entre os grupos (1 vaga)',
        'Total: 4 classificados',
      ],
      desempate: [
        ...DESEMPATE_PADRAO,
        'Empate pela vaga de melhor 2º → jogo(s) extra de desempate',
      ],
      fases: [
        'Semifinal (sem reedições da fase de grupos)',
        'Final',
        'Disputa de 3° lugar (perdedores das semifinais)',
      ],
    }
  }

  // 2 grupos → Semifinal (top 2 de cada)
  if (numGrupos === 2) {
    return {
      classificacao: [
        '2 grupos — top 2 de cada grupo se classificam',
        'Total: 4 classificados',
      ],
      desempate: DESEMPATE_PADRAO,
      fases: [
        'Semifinal (sem reedições da fase de grupos)',
        'Final',
        'Disputa de 3° lugar (perdedores das semifinais)',
      ],
    }
  }

  // 4+ grupos → Quartas
  return {
    classificacao: [
      `${numGrupos} grupos — top 2 de cada grupo se classificam`,
      `Total: ${numGrupos * 2} classificados`,
    ],
    desempate: DESEMPATE_PADRAO,
    fases: [
      'Quartas de final (sem reedições da fase de grupos)',
      'Semifinal',
      'Final',
      'Disputa de 3° lugar (perdedores das semifinais)',
    ],
  }
}

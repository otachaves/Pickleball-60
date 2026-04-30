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

  // Dupla Masculina (semifinal)
  if (categoria.formato === 'semifinal') {
    return {
      classificacao: [
        `${numGrupos} grupos — top 2 de cada grupo se classificam`,
        'Total: 4 classificados',
      ],
      desempate: DESEMPATE_PADRAO,
      fases: [
        'Semifinal (sem reedição da fase de grupos)',
        'Final',
        'Disputa de 3° lugar (perdedores das semifinais)',
      ],
    }
  }

  // Quartas (Single Masculino, Dupla Mista)
  if (numGrupos === 3) {
    return {
      classificacao: [
        `${numGrupos} grupos — top 2 de cada grupo (6 classificados diretos)`,
        '+ 2 melhores 3° colocados (wildcards)',
        'Total: 8 classificados',
      ],
      desempate: [
        ...DESEMPATE_PADRAO,
        'Empate entre 3° colocados → jogo(s) extra de desempate',
      ],
      fases: [
        'Quartas de final (sem reedições da fase de grupos)',
        'Semifinal',
        'Final',
        'Disputa de 3° lugar (perdedores das semifinais)',
      ],
    }
  }

  // 4+ grupos
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

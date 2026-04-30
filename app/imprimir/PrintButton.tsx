'use client'
import { Categoria, Grupo, Jogo, Time } from '@/lib/types'
import { getCodigoJogo } from '@/lib/codigos'
import { getHorarioCategoria } from '@/lib/horarios'

interface Props {
  categorias?: Categoria[]
  grupos?: Grupo[]
  times?: Time[]
  jogos?: Jogo[]
}

function csvEscape(val: string | number): string {
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function gerarCSV(
  categorias: Categoria[],
  grupos: Grupo[],
  times: Time[],
  jogos: Jogo[]
): string {
  const linhas: string[] = []
  // Cabeçalho com BOM para Excel reconhecer UTF-8
  linhas.push('Categoria,Horario,Fase,Grupo,Codigo,Time A,Placar A,Placar B,Time B,Status')

  const ordenados = [...jogos].sort((a, b) => a.id - b.id)

  for (const j of ordenados) {
    const cat = categorias.find((c) => c.id === j.categoria_id)
    const grupo = grupos.find((g) => g.id === j.grupo_id)
    const ta = times.find((t) => t.id === j.time_a_id)
    const tb = times.find((t) => t.id === j.time_b_id)
    const codigo = getCodigoJogo(j, cat, grupos, jogos)
    const fase =
      j.rodada === 'grupos' ? 'Fase de Grupos'
      : j.rodada === 'quartas' ? 'Quartas de Final'
      : j.rodada === 'semifinal' ? 'Semifinal'
      : j.rodada === 'final' ? 'Final'
      : j.rodada === 'terceiro_lugar' ? '3° Lugar'
      : 'Wildcard'

    const placeholder = j.time_a_id === j.time_b_id && j.rodada !== 'grupos'

    const horario = cat ? getHorarioCategoria(cat.nome) ?? '' : ''
    const linha = [
      cat?.nome ?? '',
      horario,
      fase,
      grupo?.nome ?? '',
      codigo,
      placeholder ? '—' : ta?.nome ?? '',
      j.status === 'encerrado' ? j.placar_a : '',
      j.status === 'encerrado' ? j.placar_b : '',
      placeholder ? '—' : tb?.nome ?? '',
      j.status === 'encerrado' ? 'Encerrado' : 'Pendente',
    ]
      .map(csvEscape)
      .join(',')

    linhas.push(linha)
  }

  return '﻿' + linhas.join('\n') // BOM for Excel UTF-8
}

function baixarArquivo(conteudo: string, nome: string, mime: string) {
  const blob = new Blob([conteudo], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function PrintButton({ categorias, grupos, times, jogos }: Props) {
  const exportarCSV = () => {
    if (!categorias || !grupos || !times || !jogos) return
    const csv = gerarCSV(categorias, grupos, times, jogos)
    const data = new Date().toISOString().slice(0, 10)
    baixarArquivo(csv, `copa-imperial-${data}.csv`, 'text/csv;charset=utf-8')
  }

  return (
    <div className="flex gap-2">
      {categorias && (
        <button
          onClick={exportarCSV}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
          title="Baixa um arquivo CSV (abre no Excel ou Google Sheets)"
        >
          📊 Exportar CSV
        </button>
      )}
      <button
        onClick={() => window.print()}
        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
      >
        🖨️ Imprimir / PDF
      </button>
    </div>
  )
}

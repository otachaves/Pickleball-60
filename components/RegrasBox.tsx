'use client'
import { useState } from 'react'
import { Categoria } from '@/lib/types'
import { getRegras } from '@/lib/regras'

interface Props {
  categoria: Categoria
  numGrupos: number
}

export default function RegrasBox({ categoria, numGrupos }: Props) {
  const [aberto, setAberto] = useState(false)
  const regras = getRegras(categoria, numGrupos)

  return (
    <div className="rounded-xl border border-slate-300 bg-white mb-6 overflow-hidden">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
      >
        <span className="text-xs uppercase tracking-widest text-amber-600 font-bold">
          📋 Regras desta categoria
        </span>
        <span className="text-slate-600 text-sm">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-4 text-xs text-slate-700 border-t border-slate-300">
          <div className="pt-3">
            <p className="font-bold text-slate-800 mb-1.5 text-[11px] uppercase tracking-wide">
              Classificação
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {regras.classificacao.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 text-[11px] uppercase tracking-wide">
              Critérios de desempate (em ordem)
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              {regras.desempate.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 text-[11px] uppercase tracking-wide">
              {categoria.formato === 'grupos_apenas' ? 'Pódio' : 'Fase eliminatória'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {regras.fases.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

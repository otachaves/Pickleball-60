'use client'
import { Categoria } from '@/lib/types'

interface Props {
  categorias: Categoria[]
  ativa: number
  onChange: (id: number) => void
  showInfo?: boolean // se true, adiciona botão "Informações" com id=0
}

export default function CategoriaTabs({ categorias, ativa, onChange, showInfo }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {showInfo && (
        <button
          key="info"
          onClick={() => onChange(0)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            ativa === 0
              ? 'bg-amber-500 text-slate-900'
              : 'bg-white text-slate-700 hover:bg-slate-200'
          }`}
        >
          ℹ️ Informações
        </button>
      )}
      {categorias.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            ativa === c.id
              ? 'bg-amber-500 text-slate-900'
              : 'bg-white text-slate-700 hover:bg-slate-200'
          }`}
        >
          {c.nome}
        </button>
      ))}
    </div>
  )
}

'use client'
import { Categoria } from '@/lib/types'

interface Props {
  categorias: Categoria[]
  ativa: number
  onChange: (id: number) => void
}

export default function CategoriaTabs({ categorias, ativa, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

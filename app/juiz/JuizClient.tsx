'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Jogo } from '@/lib/types'

interface Props {
  jogo: Jogo
  token: string
  codigo?: string
}

export default function JuizClient({ jogo, token, codigo }: Props) {
  const router = useRouter()
  const [placarA, setPlacarA] = useState(jogo.placar_a ?? 0)
  const [placarB, setPlacarB] = useState(jogo.placar_b ?? 0)
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)

  const adj = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number) => {
    setter((v) => Math.max(0, v + delta))
  }

  const encerrar = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('jogos')
      .update({ placar_a: placarA, placar_b: placarB, status: 'encerrado' })
      .eq('id', jogo.id)

    if (error) {
      alert('Erro: ' + error.message)
      setLoading(false)
      setConfirmando(false)
    } else {
      router.push(`/admin?token=${token}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-300 px-4 py-3 flex items-center justify-between gap-2">
        <button
          onClick={() => router.push(`/admin?token=${token}`)}
          className="text-slate-600 hover:text-slate-900 text-sm"
        >
          ← Voltar
        </button>
        {codigo && (
          <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
            {codigo}
          </span>
        )}
        <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Em Andamento</span>
      </header>

      {/* Placar principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
        {/* Time A */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-slate-700 font-bold text-lg text-center">{jogo.time_a?.nome}</p>
          <div className="text-8xl font-black text-slate-900 tabular-nums">{placarA}</div>
          <div className="flex gap-4 w-full">
            <button
              onPointerDown={() => adj(setPlacarA, -1)}
              className="flex-1 py-5 rounded-2xl bg-slate-200 active:bg-slate-300 text-slate-700 text-2xl font-bold select-none touch-manipulation"
            >
              −1
            </button>
            <button
              onPointerDown={() => adj(setPlacarA, 1)}
              className="flex-[2] py-5 rounded-2xl bg-emerald-600 active:bg-emerald-500 text-white text-3xl font-black select-none touch-manipulation"
            >
              +1
            </button>
          </div>
        </div>

        {/* Divisor */}
        <div className="text-slate-400 text-3xl font-bold">×</div>

        {/* Time B */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-slate-700 font-bold text-lg text-center">{jogo.time_b?.nome}</p>
          <div className="text-8xl font-black text-slate-900 tabular-nums">{placarB}</div>
          <div className="flex gap-4 w-full">
            <button
              onPointerDown={() => adj(setPlacarB, -1)}
              className="flex-1 py-5 rounded-2xl bg-slate-200 active:bg-slate-300 text-slate-700 text-2xl font-bold select-none touch-manipulation"
            >
              −1
            </button>
            <button
              onPointerDown={() => adj(setPlacarB, 1)}
              className="flex-[2] py-5 rounded-2xl bg-emerald-600 active:bg-emerald-500 text-white text-3xl font-black select-none touch-manipulation"
            >
              +1
            </button>
          </div>
        </div>
      </div>

      {/* Encerrar */}
      <div className="px-4 pb-8">
        <button
          onClick={() => setConfirmando(true)}
          className="w-full py-5 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xl font-black transition-colors touch-manipulation"
        >
          Encerrar Partida
        </button>
      </div>

      {/* Modal de confirmação */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-300">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Encerrar partida?</h3>
            <p className="text-slate-600 text-sm mb-2">Placar final:</p>
            <div className="flex items-center justify-center gap-4 mb-5 bg-slate-50 rounded-xl py-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">{jogo.time_a?.nome}</p>
                <span className="text-4xl font-black text-slate-900">{placarA}</span>
              </div>
              <span className="text-slate-400 text-2xl font-bold">×</span>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">{jogo.time_b?.nome}</p>
                <span className="text-4xl font-black text-slate-900">{placarB}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmando(false)}
                disabled={loading}
                className="flex-1 py-4 rounded-xl bg-slate-200 text-slate-700 font-semibold"
              >
                Corrigir
              </button>
              <button
                onClick={encerrar}
                disabled={loading}
                className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-lg disabled:opacity-50"
              >
                {loading ? 'Salvando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

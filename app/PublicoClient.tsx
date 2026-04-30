'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularClassificacao } from '@/lib/classificacao'
import { getCodigoJogo } from '@/lib/codigos'
import { getHorarioCategoria } from '@/lib/horarios'
import { sortGamesRoundRobin } from '@/lib/scheduling'
import { Categoria, Grupo, Jogo, Time } from '@/lib/types'
import CategoriaTabs from '@/components/CategoriaTabs'
import TabelaClassificacao from '@/components/TabelaClassificacao'
import CardJogo from '@/components/CardJogo'
import BracketView from '@/components/BracketView'
import RegrasBox from '@/components/RegrasBox'

interface Props {
  categorias: Categoria[]
  grupos: Grupo[]
  times: Time[]
  jogosIniciais: Jogo[]
}

type Aba = 'grupos' | 'chaveamento'

export default function PublicoClient({ categorias, grupos, times, jogosIniciais }: Props) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0]?.id ?? 0)
  const [jogos, setJogos] = useState<Jogo[]>(jogosIniciais)
  const [abaAtiva, setAbaAtiva] = useState<Aba>('grupos')

  useEffect(() => {
    const channel = supabase
      .channel('jogos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogos' }, (payload) => {
        setJogos((prev) => {
          if (payload.eventType === 'UPDATE') {
            // Preserve joined time_a/time_b — Realtime only returns flat fields
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { time_a, time_b, ...flat } = payload.new as Jogo
            return prev.map((j) => j.id === flat.id ? { ...j, ...flat } : j)
          }
          if (payload.eventType === 'INSERT') {
            const novo = payload.new as Jogo
            if (prev.find((j) => j.id === novo.id)) return prev
            return [...prev, novo]
          }
          return prev
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const categoriaAtivaObj = categorias.find((c) => c.id === categoriaAtiva)
  const getCodigo = (j: Jogo) => {
    const cat = categorias.find((c) => c.id === j.categoria_id)
    return getCodigoJogo(j, cat, grupos, jogos)
  }
  const somenteGrupos = categoriaAtivaObj?.formato === 'grupos_apenas'
  const gruposDaCategoria = grupos.filter((g) => g.categoria_id === categoriaAtiva)
  const jogosGrupos = jogos.filter((j) => j.categoria_id === categoriaAtiva && j.rodada === 'grupos')
  const jogosElim = jogos.filter((j) => j.categoria_id === categoriaAtiva && j.rodada !== 'grupos')
  const chaveamentoGerado = !somenteGrupos && jogosElim.length > 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-300 px-4 py-4">
        <h1 className="text-xl font-bold text-amber-600 mb-3">🏆 Copa Imperial</h1>
        <CategoriaTabs categorias={categorias} ativa={categoriaAtiva} onChange={(id) => { setCategoriaAtiva(id); setAbaAtiva('grupos') }} />
        {categoriaAtivaObj && getHorarioCategoria(categoriaAtivaObj.nome) && (
          <p className="text-xs text-amber-700/80 mt-2 font-medium">
            🕗 {getHorarioCategoria(categoriaAtivaObj.nome)}
          </p>
        )}

        {chaveamentoGerado && (
          <div className="flex gap-1 mt-3">
            {(['grupos', 'chaveamento'] as Aba[]).map((aba) => (
              <button
                key={aba}
                onClick={() => setAbaAtiva(aba)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  abaAtiva === aba ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {aba === 'grupos' ? 'Fase de Grupos' : '🏆 Chaveamento'}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className={`px-4 py-6 mx-auto space-y-8 ${abaAtiva === 'chaveamento' ? 'max-w-6xl' : 'max-w-2xl'}`}>
        {abaAtiva === 'grupos' && categoriaAtivaObj && (
          <RegrasBox categoria={categoriaAtivaObj} numGrupos={gruposDaCategoria.length} />
        )}

        {abaAtiva === 'grupos' && gruposDaCategoria.map((grupo) => {
          const timesDo = times.filter((t) => t.grupo_id === grupo.id)
          const jogosDo = sortGamesRoundRobin(jogosGrupos.filter((j) => j.grupo_id === grupo.id))
          const classificacao = calcularClassificacao(timesDo, jogosDo)
          const temJogosEncerrados = jogosDo.some((j) => j.status === 'encerrado')
          return (
            <section key={grupo.id}>
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-3">{grupo.nome}</h2>
              <TabelaClassificacao rows={classificacao} classificados={2} podio={somenteGrupos && temJogosEncerrados} />
              <div className="mt-4 space-y-2">
                {jogosDo.map((jogo) => <CardJogo key={jogo.id} jogo={jogo} codigo={getCodigo(jogo)} />)}
              </div>
            </section>
          )
        })}

        {abaAtiva === 'chaveamento' && (
          <section>
            <BracketView jogos={jogosElim} times={times} getCodigo={getCodigo} />
          </section>
        )}
      </main>
    </div>
  )
}

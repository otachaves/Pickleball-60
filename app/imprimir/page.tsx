import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCodigoJogo } from '@/lib/codigos'
import { getHorarioCategoria } from '@/lib/horarios'
import { sortGamesRoundRobin } from '@/lib/scheduling'
import { getRegras } from '@/lib/regras'
import { calcularClassificacao } from '@/lib/classificacao'
import { Categoria, Grupo, Jogo, Time } from '@/lib/types'
import PrintButton from './PrintButton'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export const dynamic = 'force-dynamic'

export default async function ImprimirPage({ searchParams }: Props) {
  const { token } = await searchParams
  if (token !== process.env.ADMIN_TOKEN) redirect('/')

  const [{ data: categorias }, { data: grupos }, { data: times }, { data: jogos }] =
    await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('grupos').select('*'),
      supabase.from('times').select('*'),
      supabase.from('jogos').select('*'),
    ])

  return (
    <ImprimirView
      categorias={categorias ?? []}
      grupos={grupos ?? []}
      times={times ?? []}
      jogos={jogos ?? []}
    />
  )
}

interface ViewProps {
  categorias: Categoria[]
  grupos: Grupo[]
  times: Time[]
  jogos: Jogo[]
}

function ImprimirView({ categorias, grupos, times, jogos }: ViewProps) {
  return (
    <div className="bg-white text-black min-h-screen">
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          @page { size: A4; margin: 1.5cm; }
        }
        body { background: white; color: black; }
      `}</style>

      <div className="no-print bg-slate-100 border-b border-slate-300 p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">📋 Versão Imprimível — Copa Imperial</h1>
        <PrintButton categorias={categorias} grupos={grupos} times={times} jogos={jogos} />
      </div>

      <div className="max-w-4xl mx-auto p-6 print:p-0">
        <header className="mb-8 text-center print:mb-6">
          <h1 className="text-3xl font-black mb-1">🏆 COPA IMPERIAL</h1>
          <p className="text-sm text-slate-600">
            Tabela de Jogos · {new Date().toLocaleDateString('pt-BR')}
          </p>
        </header>

        {categorias.map((cat, catIdx) => {
          const gruposCat = grupos.filter((g) => g.categoria_id === cat.id)
          const jogosCat = jogos.filter((j) => j.categoria_id === cat.id)
          const jogosGrupos = jogosCat.filter((j) => j.rodada === 'grupos')
          const jogosElim = jogosCat.filter(
            (j) => !['grupos', 'wildcard'].includes(j.rodada)
          )

          return (
            <section
              key={cat.id}
              className={catIdx < categorias.length - 1 ? 'page-break mb-12' : 'mb-12'}
            >
              <h2 className="text-2xl font-black mb-1 pb-2 border-b-2 border-black uppercase">
                {cat.nome}
              </h2>
              {getHorarioCategoria(cat.nome) && (
                <p className="text-sm text-slate-700 mb-3 italic">
                  🕗 {getHorarioCategoria(cat.nome)}
                </p>
              )}

              {/* Regras */}
              {(() => {
                const regras = getRegras(cat, gruposCat.length)
                return (
                  <div className="border border-slate-400 bg-slate-50 p-3 mb-5 text-xs">
                    <p className="font-bold uppercase tracking-wide text-slate-700 mb-2">
                      📋 Regras
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="font-semibold mb-1">Classificação</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {regras.classificacao.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Desempate (em ordem)</p>
                        <ol className="list-decimal pl-4 space-y-0.5">
                          {regras.desempate.map((r, i) => <li key={i}>{r}</li>)}
                        </ol>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">
                          {cat.formato === 'grupos_apenas' ? 'Pódio' : 'Fases'}
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {regras.fases.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {gruposCat.map((grupo) => {
                const timesDo = times.filter((t) => t.grupo_id === grupo.id)
                const jogosDo = sortGamesRoundRobin(
                  jogosGrupos.filter((j) => j.grupo_id === grupo.id)
                )
                const classif = calcularClassificacao(timesDo, jogosDo)
                const temJogosEncerrados = jogosDo.some((j) => j.status === 'encerrado')
                const podio = cat.formato === 'grupos_apenas' && temJogosEncerrados

                return (
                  <div key={grupo.id} className="mb-8 break-inside-avoid">
                    <h3 className="text-lg font-bold mb-3 bg-slate-200 px-3 py-1.5 inline-block rounded">
                      {grupo.nome}
                    </h3>

                    {/* Classificação */}
                    <table className="w-full border-collapse border border-black mb-4 text-sm">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-black py-1 px-2 text-left w-8">#</th>
                          <th className="border border-black py-1 px-2 text-left">Time</th>
                          <th className="border border-black py-1 px-2 w-12">J</th>
                          <th className="border border-black py-1 px-2 w-12">V</th>
                          <th className="border border-black py-1 px-2 w-12">D</th>
                          <th className="border border-black py-1 px-2 w-16">Saldo</th>
                          <th className="border border-black py-1 px-2 w-12">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classif.map((row, i) => {
                          const medalha = podio && i < 3 ? ['🥇', '🥈', '🥉'][i] : null
                          const corLinha =
                            podio && i === 0 ? 'bg-yellow-100'
                            : podio && i === 1 ? 'bg-slate-100'
                            : podio && i === 2 ? 'bg-orange-100'
                            : ''
                          return (
                            <tr key={row.time.id} className={corLinha}>
                              <td className="border border-black py-1 px-2 font-bold text-center">
                                {medalha ?? i + 1}
                              </td>
                              <td className={`border border-black py-1 px-2 ${podio && i < 3 ? 'font-bold' : ''}`}>
                                {row.time.nome}
                              </td>
                              <td className="border border-black py-1 px-2 text-center">{row.jogos}</td>
                              <td className="border border-black py-1 px-2 text-center">{row.vitorias}</td>
                              <td className="border border-black py-1 px-2 text-center">{row.derrotas}</td>
                              <td className="border border-black py-1 px-2 text-center">{row.saldo}</td>
                              <td className="border border-black py-1 px-2 text-center font-bold">{row.pontos}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Jogos */}
                    <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-black py-1 px-2 text-left w-32">Código</th>
                          <th className="border border-black py-1 px-2 text-right">Time A</th>
                          <th className="border border-black py-1 px-2 text-center w-14">Placar</th>
                          <th className="border border-black py-1 px-1 text-center w-4">×</th>
                          <th className="border border-black py-1 px-2 text-center w-14">Placar</th>
                          <th className="border border-black py-1 px-2 text-left">Time B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jogosDo.map((jogo) => {
                          const ta = times.find((t) => t.id === jogo.time_a_id)
                          const tb = times.find((t) => t.id === jogo.time_b_id)
                          const codigo = getCodigoJogo(jogo, cat, grupos, jogos)
                          const enc = jogo.status === 'encerrado'
                          return (
                            <tr key={jogo.id}>
                              <td className="border border-black py-2 px-2 font-mono text-xs">
                                {codigo}
                              </td>
                              <td className="border border-black py-2 px-2 text-right font-medium">
                                {ta?.nome}
                              </td>
                              <td
                                className={`border border-black py-2 px-2 text-center font-bold text-base ${
                                  enc ? '' : 'h-10'
                                }`}
                              >
                                {enc ? jogo.placar_a : ''}
                              </td>
                              <td className="border border-black py-2 px-1 text-center">×</td>
                              <td
                                className={`border border-black py-2 px-2 text-center font-bold text-base ${
                                  enc ? '' : 'h-10'
                                }`}
                              >
                                {enc ? jogo.placar_b : ''}
                              </td>
                              <td className="border border-black py-2 px-2 text-left font-medium">
                                {tb?.nome}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })}

              {/* Fase Eliminatória */}
              {jogosElim.length > 0 && (
                <div className="mt-8 break-inside-avoid">
                  <h3 className="text-lg font-bold mb-3 bg-slate-200 px-3 py-1.5 inline-block rounded">
                    🏆 Fase Eliminatória
                  </h3>
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black py-1 px-2 text-left w-32">Código</th>
                        <th className="border border-black py-1 px-2 text-left w-20">Fase</th>
                        <th className="border border-black py-1 px-2 text-right">Time A</th>
                        <th className="border border-black py-1 px-2 text-center w-14">Placar</th>
                        <th className="border border-black py-1 px-1 text-center w-4">×</th>
                        <th className="border border-black py-1 px-2 text-center w-14">Placar</th>
                        <th className="border border-black py-1 px-2 text-left">Time B</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jogosElim.map((jogo) => {
                        const ta = times.find((t) => t.id === jogo.time_a_id)
                        const tb = times.find((t) => t.id === jogo.time_b_id)
                        const codigo = getCodigoJogo(jogo, cat, grupos, jogos)
                        const enc = jogo.status === 'encerrado'
                        const fase =
                          jogo.rodada === 'quartas' ? 'Quartas'
                          : jogo.rodada === 'semifinal' ? 'Semi'
                          : jogo.rodada === 'final' ? 'Final'
                          : '3° Lugar'
                        const placeholder = jogo.time_a_id === jogo.time_b_id
                        return (
                          <tr key={jogo.id}>
                            <td className="border border-black py-2 px-2 font-mono text-xs">{codigo}</td>
                            <td className="border border-black py-2 px-2">{fase}</td>
                            <td className="border border-black py-2 px-2 text-right font-medium">
                              {placeholder ? '—' : ta?.nome}
                            </td>
                            <td className={`border border-black py-2 px-2 text-center font-bold text-base ${enc ? '' : 'h-10'}`}>
                              {enc ? jogo.placar_a : ''}
                            </td>
                            <td className="border border-black py-2 px-1 text-center">×</td>
                            <td className={`border border-black py-2 px-2 text-center font-bold text-base ${enc ? '' : 'h-10'}`}>
                              {enc ? jogo.placar_b : ''}
                            </td>
                            <td className="border border-black py-2 px-2 text-left font-medium">
                              {placeholder ? '—' : tb?.nome}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )
        })}

        <footer className="mt-12 text-xs text-slate-500 text-center">
          Gerado em {new Date().toLocaleString('pt-BR')}
        </footer>
      </div>
    </div>
  )
}

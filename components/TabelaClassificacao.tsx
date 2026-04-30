import { ClassificacaoRow } from '@/lib/types'

interface Props {
  rows: ClassificacaoRow[]
  classificados?: number
  podio?: boolean // true = destaca 1°/2°/3° com medalhas (categorias sem eliminatória)
}

const MEDALHA = ['🥇', '🥈', '🥉']

export default function TabelaClassificacao({ rows, classificados = 2, podio = false }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-300">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white text-slate-600 uppercase text-xs tracking-wide">
            <th className="py-2 px-3 text-left w-10">#</th>
            <th className="py-2 px-3 text-left">Time</th>
            <th className="py-2 px-3 text-center">J</th>
            <th className="py-2 px-3 text-center">V</th>
            <th className="py-2 px-3 text-center">Saldo</th>
            <th className="py-2 px-3 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            // Modo pódio: top 3 ganham medalhas
            if (podio) {
              const isPodio = i < 3
              const cor =
                i === 0 ? 'bg-yellow-500/20 border-l-4 border-yellow-400'
                : i === 1 ? 'bg-slate-400/15 border-l-4 border-slate-300'
                : i === 2 ? 'bg-orange-700/20 border-l-4 border-orange-500'
                : ''
              return (
                <tr key={row.time.id} className={`border-t border-slate-300 ${cor}`}>
                  <td className="py-2 px-3">
                    <span className="text-lg">
                      {isPodio ? MEDALHA[i] : <span className="text-slate-500 text-xs">{i + 1}</span>}
                    </span>
                  </td>
                  <td className={`py-2 px-3 text-slate-900 ${isPodio ? 'font-bold' : 'font-medium'}`}>{row.time.nome}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{row.jogos}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{row.vitorias}</td>
                  <td className={`py-2 px-3 text-center font-mono ${row.saldo > 0 ? 'text-emerald-700' : row.saldo < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                    {row.saldo > 0 ? `+${row.saldo}` : row.saldo}
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-amber-600">{row.pontos}</td>
                </tr>
              )
            }

            // Modo classificação (padrão)
            const isClassificado = i < classificados
            const isWildcard = !isClassificado && i < classificados + 2
            return (
              <tr
                key={row.time.id}
                className={`border-t border-slate-300 ${
                  isClassificado
                    ? 'bg-emerald-50'
                    : isWildcard
                    ? 'bg-amber-100'
                    : ''
                }`}
              >
                <td className="py-2 px-3">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      isClassificado
                        ? 'bg-emerald-500 text-slate-900'
                        : isWildcard
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-2 px-3 font-medium text-slate-900">{row.time.nome}</td>
                <td className="py-2 px-3 text-center text-slate-600">{row.jogos}</td>
                <td className="py-2 px-3 text-center text-slate-600">{row.vitorias}</td>
                <td className={`py-2 px-3 text-center font-mono ${row.saldo > 0 ? 'text-emerald-700' : row.saldo < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                  {row.saldo > 0 ? `+${row.saldo}` : row.saldo}
                </td>
                <td className="py-2 px-3 text-center font-bold text-amber-600">{row.pontos}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

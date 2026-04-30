import { Jogo } from '@/lib/types'

interface Props {
  jogo: Jogo
  codigo?: string
  showEditBtn?: boolean
  onEdit?: (jogo: Jogo) => void
}

export default function CardJogo({ jogo, codigo, showEditBtn, onEdit }: Props) {
  const encerrado = jogo.status === 'encerrado'
  const emAndamento = jogo.status === 'em_andamento'

  return (
    <div
      className={`rounded-xl border transition-colors ${
        encerrado
          ? 'border-slate-300 bg-white'
          : emAndamento
          ? 'border-amber-500/50 bg-amber-50'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      {/* Codigo + Status */}
      {codigo && (
        <div className="px-3 pt-2 flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {codigo}
          </span>
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              encerrado ? 'bg-slate-500' : emAndamento ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'
            }`}
          />
        </div>
      )}

      <div className="p-3 flex items-center gap-3">
        {/* Status dot fallback (when no codigo) */}
        {!codigo && (
          <div className="flex-shrink-0">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                encerrado ? 'bg-slate-500' : emAndamento ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'
              }`}
            />
          </div>
        )}

        {/* Time A */}
        <div className="flex-1 text-right">
          <span className={`font-semibold text-sm ${encerrado && jogo.placar_a > jogo.placar_b ? 'text-emerald-700' : 'text-slate-900'}`}>
            {jogo.time_a?.nome ?? '–'}
          </span>
        </div>

        {/* Placar */}
        <div className="flex-shrink-0 flex items-center gap-1 font-mono font-bold text-lg min-w-[60px] justify-center">
          {encerrado ? (
            <>
              <span className={jogo.placar_a > jogo.placar_b ? 'text-emerald-700' : 'text-slate-700'}>{jogo.placar_a}</span>
              <span className="text-slate-500 text-sm">×</span>
              <span className={jogo.placar_b > jogo.placar_a ? 'text-emerald-700' : 'text-slate-700'}>{jogo.placar_b}</span>
            </>
          ) : (
            <span className="text-slate-500 text-sm">vs</span>
          )}
        </div>

        {/* Time B */}
        <div className="flex-1 text-left">
          <span className={`font-semibold text-sm ${encerrado && jogo.placar_b > jogo.placar_a ? 'text-emerald-700' : 'text-slate-900'}`}>
            {jogo.time_b?.nome ?? '–'}
          </span>
        </div>

        {/* Edit btn */}
        {showEditBtn && onEdit && (
          <button
            onClick={() => onEdit(jogo)}
            className="flex-shrink-0 p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 transition-colors text-xs"
          >
            ✏️
          </button>
        )}
      </div>
    </div>
  )
}

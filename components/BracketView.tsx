'use client'
import { Jogo, Time } from '@/lib/types'
import { getVencedor } from '@/lib/bracket'

export interface SwapTarget {
  jogoId: number
  pos: 'a' | 'b'
  timeId: number
  nome: string
}

interface Props {
  jogos: Jogo[]
  times: Time[]
  showEditBtn?: boolean
  onEdit?: (jogo: Jogo) => void
  onSwapRequest?: (target: SwapTarget) => void
  getCodigo?: (jogo: Jogo) => string
}

function getNome(jogo: Jogo, pos: 'a' | 'b', times: Time[]): string {
  const id = pos === 'a' ? jogo.time_a_id : jogo.time_b_id
  const fromJoin = pos === 'a' ? jogo.time_a?.nome : jogo.time_b?.nome
  if (fromJoin) return fromJoin
  return times.find((t) => t.id === id)?.nome ?? '?'
}

interface CardProps {
  jogo: Jogo | null
  times: Time[]
  showEditBtn?: boolean
  onEdit?: (j: Jogo) => void
  highlight?: boolean
  onSwapRequest?: (target: SwapTarget) => void
  codigo?: string
}

function BracketCard({ jogo, times, showEditBtn, onEdit, highlight, onSwapRequest, codigo }: CardProps) {
  if (!jogo) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 w-48 min-h-[64px] flex items-center justify-center">
        <span className="text-slate-400 text-xs italic">A definir</span>
      </div>
    )
  }

  // Placeholder state: both teams set to same id
  const isPlaceholder = jogo.time_a_id === jogo.time_b_id
  if (isPlaceholder) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 w-48 min-h-[64px] flex flex-col items-center justify-center gap-1">
        {codigo && (
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {codigo}
          </span>
        )}
        <span className="text-slate-400 text-xs italic">A definir</span>
      </div>
    )
  }

  const vencedor = getVencedor(jogo)
  const encerrado = jogo.status === 'encerrado'
  const canSwap = !!onSwapRequest && jogo.status === 'pendente'
  const nomeA = getNome(jogo, 'a', times)
  const nomeB = getNome(jogo, 'b', times)

  const TeamRow = ({ pos, nome, isWinner }: { pos: 'a' | 'b'; nome: string; isWinner: boolean }) => {
    const score = pos === 'a' ? jogo.placar_a : jogo.placar_b
    return (
      <div className={`flex items-center gap-1 py-1 px-1 rounded-lg ${isWinner ? 'bg-emerald-100' : ''}`}>
        <span className={`text-xs font-semibold truncate flex-1 ${
          isWinner ? 'text-emerald-700' : vencedor && !isWinner ? 'text-slate-500' : 'text-slate-800'
        }`}>
          {nome}
        </span>
        {canSwap && (
          <button
            onClick={() => onSwapRequest({ jogoId: jogo.id, pos, timeId: pos === 'a' ? jogo.time_a_id : jogo.time_b_id, nome })}
            className="flex-shrink-0 text-[10px] px-1 py-0.5 rounded bg-slate-200 hover:bg-amber-200 hover:text-amber-600 text-slate-500 transition-colors"
            title="Trocar este time"
          >
            ⇄
          </button>
        )}
        <span className={`text-sm font-bold font-mono ml-1 ${isWinner ? 'text-emerald-700' : 'text-slate-600'}`}>
          {encerrado ? score : '–'}
        </span>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-2 w-48 ${
      highlight ? 'border-amber-500 bg-amber-50'
      : encerrado ? 'border-slate-300 bg-slate-100'
      : 'border-slate-200 bg-slate-50'
    }`}>
      {codigo && (
        <div className="text-center mb-1">
          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            {codigo}
          </span>
        </div>
      )}
      <TeamRow pos="a" nome={nomeA} isWinner={vencedor === 'a'} />
      <div className="my-0.5 border-t border-slate-200" />
      <TeamRow pos="b" nome={nomeB} isWinner={vencedor === 'b'} />
      {showEditBtn && onEdit && (
        <button
          onClick={() => onEdit(jogo)}
          className="mt-1.5 w-full py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs transition-colors"
        >
          ✏️ Editar
        </button>
      )}
    </div>
  )
}

const StageLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 h-4">{children}</p>
)

export default function BracketView({ jogos, times, showEditBtn, onEdit, onSwapRequest, getCodigo }: Props) {
  const bySlot = (r: string, s: number) =>
    jogos.find((j) => j.rodada === r && j.bracket_slot === s) ?? null

  const quartas = jogos.filter((j) => j.rodada === 'quartas')
  const semis = jogos.filter((j) => j.rodada === 'semifinal')
  const final_ = bySlot('final', 1)
  const terceiro = bySlot('terceiro_lugar', 1)

  const card = (jogo: Jogo | null, highlight = false) => (
    <BracketCard
      jogo={jogo}
      times={times}
      showEditBtn={showEditBtn}
      onEdit={onEdit}
      highlight={highlight}
      onSwapRequest={onSwapRequest}
      codigo={jogo && getCodigo ? getCodigo(jogo) : undefined}
    />
  )

  // ── 8-team bracket ──
  if (quartas.length > 0) {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max items-stretch">
          {/* QF column */}
          <div className="flex flex-col">
            <StageLabel>Quartas</StageLabel>
            <div className="flex flex-col flex-1 gap-6">
              <div className="flex flex-col gap-3 flex-1">
                {card(bySlot('quartas', 1))}
                {card(bySlot('quartas', 2))}
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {card(bySlot('quartas', 3))}
                {card(bySlot('quartas', 4))}
              </div>
            </div>
          </div>

          {/* SF column */}
          <div className="flex flex-col">
            <StageLabel>Semi</StageLabel>
            <div className="flex flex-col flex-1 gap-6">
              <div className="flex-1 flex items-center justify-center">
                {card(bySlot('semifinal', 1))}
              </div>
              <div className="flex-1 flex items-center justify-center">
                {card(bySlot('semifinal', 2))}
              </div>
            </div>
          </div>

          {/* Final + 3rd column */}
          <div className="flex flex-col">
            <StageLabel>Final</StageLabel>
            <div className="flex-1 flex items-center justify-center">
              {card(final_, true)}
            </div>
            <div className="mt-6">
              <StageLabel>3° Lugar</StageLabel>
              {card(terceiro)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 4-team bracket (semi only) ──
  if (semis.length > 0) {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max items-stretch">
          {/* SF column */}
          <div className="flex flex-col">
            <StageLabel>Semifinal</StageLabel>
            <div className="flex flex-col gap-3">
              {card(bySlot('semifinal', 1))}
              {card(bySlot('semifinal', 2))}
            </div>
          </div>

          {/* Final + 3rd column */}
          <div className="flex flex-col">
            <StageLabel>Final</StageLabel>
            <div className="flex-1 flex items-center justify-center">
              {card(final_, true)}
            </div>
            <div className="mt-6">
              <StageLabel>3° Lugar</StageLabel>
              {card(terceiro)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Final only ──
  if (final_) {
    return (
      <div className="flex flex-col gap-3">
        <StageLabel>Final</StageLabel>
        {card(final_, true)}
        {terceiro && (
          <div className="mt-2">
            <StageLabel>3° Lugar</StageLabel>
            {card(terceiro)}
          </div>
        )}
      </div>
    )
  }

  return <p className="text-slate-500 text-sm">Chaveamento ainda não gerado.</p>
}

'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Categoria, ClassificacaoRow, Grupo, Jogo, Time } from '@/lib/types'
import { calcularClassificacao } from '@/lib/classificacao'
import { getCodigoJogo } from '@/lib/codigos'
import { getHorarioCategoria } from '@/lib/horarios'
import { sortGamesRoundRobin } from '@/lib/scheduling'
import {
  getBracketConfig,
  resolverWildcards,
  gerarJogosEliminatorios,
  gerarJogosWildcard,
} from '@/lib/bracket'
import CategoriaTabs from '@/components/CategoriaTabs'
import CardJogo from '@/components/CardJogo'
import TabelaClassificacao from '@/components/TabelaClassificacao'
import BracketView from '@/components/BracketView'
import RegrasBox from '@/components/RegrasBox'

interface Props {
  token: string
  categorias: Categoria[]
  grupos: Grupo[]
  times: Time[]
  jogosIniciais: Jogo[]
}

interface ModalState {
  jogo: Jogo
  placarA: string
  placarB: string
  loading: boolean
}

type Aba = 'jogos' | 'jogadores' | 'chaveamento'

export default function AdminClient({
  token,
  categorias,
  grupos,
  times: timesIniciais,
  jogosIniciais,
}: Props) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0]?.id ?? 0)
  const [abaAtiva, setAbaAtiva] = useState<Aba>('jogos')
  const [jogos, setJogos] = useState<Jogo[]>(jogosIniciais)
  const [times, setTimes] = useState<Time[]>(timesIniciais)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [editandoTime, setEditandoTime] = useState<{ id: number; nome: string } | null>(null)
  const [gerandoBracket, setGerandoBracket] = useState(false)
  const [gerandoWildcard, setGerandoWildcard] = useState(false)
  const [swapJogo, setSwapJogo] = useState<{ jogoId: number; pos: 'a' | 'b' } | null>(null)
  const [voltandoFase, setVoltandoFase] = useState(false)

  const categoriaAtivaObj = categorias.find((c) => c.id === categoriaAtiva)!
  const somenteGrupos = categoriaAtivaObj?.formato === 'grupos_apenas'

  const getCodigo = (j: Jogo) => {
    const cat = categorias.find((c) => c.id === j.categoria_id)
    return getCodigoJogo(j, cat, grupos, jogos)
  }

  // ── Resultado de jogo ──────────────────────────────────────
  const openModal = (jogo: Jogo) => {
    setModal({
      jogo,
      placarA: jogo.placar_a?.toString() ?? '0',
      placarB: jogo.placar_b?.toString() ?? '0',
      loading: false,
    })
  }

  const resetarPartida = async () => {
    if (!modal) return
    const confirma = window.confirm(
      `Resetar a partida ${getCodigo(modal.jogo)} para "não iniciada"?\n\nO placar voltará a 0×0 e nenhum ponto será computado para os times.`
    )
    if (!confirma) return

    setModal((m) => m && { ...m, loading: true })
    const { error } = await supabase
      .from('jogos')
      .update({ placar_a: 0, placar_b: 0, status: 'pendente' })
      .eq('id', modal.jogo.id)
    if (error) {
      alert('Erro: ' + error.message)
      setModal((m) => m && { ...m, loading: false })
      return
    }
    setJogos((prev) =>
      prev.map((j) =>
        j.id === modal.jogo.id
          ? { ...j, placar_a: 0, placar_b: 0, status: 'pendente' as const }
          : j
      )
    )
    setModal(null)
  }

  const saveResult = async () => {
    if (!modal) return
    setModal((m) => m && { ...m, loading: true })
    const pa = parseInt(modal.placarA) || 0
    const pb = parseInt(modal.placarB) || 0
    const { error } = await supabase
      .from('jogos')
      .update({ placar_a: pa, placar_b: pb, status: 'encerrado' })
      .eq('id', modal.jogo.id)
    if (!error) {
      setJogos((prev) =>
        prev.map((j) =>
          j.id === modal.jogo.id
            ? { ...j, placar_a: pa, placar_b: pb, status: 'encerrado' }
            : j
        )
      )
      setModal(null)
    } else {
      setModal((m) => m && { ...m, loading: false })
      alert('Erro: ' + error.message)
    }
  }

  // ── Edição de nome ─────────────────────────────────────────
  const saveNomeTime = async () => {
    if (!editandoTime) return
    const { error } = await supabase
      .from('times')
      .update({ nome: editandoTime.nome })
      .eq('id', editandoTime.id)
    if (!error) {
      setTimes((prev) =>
        prev.map((t) => (t.id === editandoTime.id ? { ...t, nome: editandoTime.nome } : t))
      )
      setJogos((prev) =>
        prev.map((j) => {
          const ta =
            j.time_a?.id === editandoTime.id
              ? { ...j.time_a!, nome: editandoTime.nome }
              : j.time_a
          const tb =
            j.time_b?.id === editandoTime.id
              ? { ...j.time_b!, nome: editandoTime.nome }
              : j.time_b
          return { ...j, time_a: ta, time_b: tb }
        })
      )
      setEditandoTime(null)
    } else {
      alert('Erro: ' + error.message)
    }
  }

  // ── Wildcard extra games ───────────────────────────────────
  const criarJogosWildcard = async (tipo: 'dois' | 'tres', terceiros: { time: Time }[]) => {
    setGerandoWildcard(true)
    const rows = terceiros.map((t) => ({
      time: t.time,
      jogos: 0, vitorias: 0, derrotas: 0,
      pontos_marcados: 0, pontos_sofridos: 0, saldo: 0, pontos: 0,
    }))
    const novosJogos = gerarJogosWildcard(categoriaAtiva, rows, tipo)
    const { data, error } = await supabase
      .from('jogos')
      .insert(novosJogos)
      .select('*, time_a:times!jogos_time_a_id_fkey(id,nome,grupo_id), time_b:times!jogos_time_b_id_fkey(id,nome,grupo_id)')
    if (!error && data) {
      setJogos((prev) => [...prev, ...data])
      setAbaAtiva('jogos')
    } else {
      alert('Erro: ' + error?.message)
    }
    setGerandoWildcard(false)
  }

  // ── Swap de times no bracket ──────────────────────────────
  const swapBracket = async (
    src: { jogoId: number; pos: 'a' | 'b'; timeId: number },
    dst: { jogoId: number; pos: 'a' | 'b'; timeId: number }
  ) => {
    const fieldSrc = src.pos === 'a' ? 'time_a_id' : 'time_b_id'
    const fieldDst = dst.pos === 'a' ? 'time_a_id' : 'time_b_id'
    const [r1, r2] = await Promise.all([
      supabase.from('jogos').update({ [fieldSrc]: dst.timeId }).eq('id', src.jogoId),
      supabase.from('jogos').update({ [fieldDst]: src.timeId }).eq('id', dst.jogoId),
    ])
    if (r1.error || r2.error) {
      alert('Erro ao trocar: ' + (r1.error?.message ?? r2.error?.message))
      return
    }
    // Update local state
    setJogos((prev) =>
      prev.map((j) => {
        if (j.id === src.jogoId) {
          const timeObj = times.find((t) => t.id === dst.timeId)
          return src.pos === 'a'
            ? { ...j, time_a_id: dst.timeId, time_a: timeObj }
            : { ...j, time_b_id: dst.timeId, time_b: timeObj }
        }
        if (j.id === dst.jogoId) {
          const timeObj = times.find((t) => t.id === src.timeId)
          return dst.pos === 'a'
            ? { ...j, time_a_id: src.timeId, time_a: timeObj }
            : { ...j, time_b_id: src.timeId, time_b: timeObj }
        }
        return j
      })
    )
  }

  // ── Avançar/Voltar fase eliminatória ──────────────────────
  const [avancando, setAvancando] = useState(false)
  const [confirmVoltarFase, setConfirmVoltarFase] = useState<'quartas' | 'semifinal' | null>(null)
  const [confirmResetBracket, setConfirmResetBracket] = useState(false)

  const avancarFase = async (de: 'quartas' | 'semifinal') => {
    setAvancando(true)
    const bySlot = (rodada: string, slot: number) =>
      jogosElim.find((j) => j.rodada === rodada && j.bracket_slot === slot)
    const getVenc = (j: Jogo | undefined) => {
      if (!j || j.status !== 'encerrado') return null
      return j.placar_a > j.placar_b ? j.time_a_id : j.time_b_id
    }
    const getPerd = (j: Jogo | undefined) => {
      if (!j || j.status !== 'encerrado') return null
      return j.placar_a > j.placar_b ? j.time_b_id : j.time_a_id
    }

    if (de === 'quartas') {
      const qf1 = bySlot('quartas', 1)
      const qf2 = bySlot('quartas', 2)
      const qf3 = bySlot('quartas', 3)
      const qf4 = bySlot('quartas', 4)
      const sf1 = bySlot('semifinal', 1)
      const sf2 = bySlot('semifinal', 2)

      const vQf1 = getVenc(qf1); const vQf2 = getVenc(qf2)
      const vQf3 = getVenc(qf3); const vQf4 = getVenc(qf4)

      if (!vQf1 || !vQf2 || !vQf3 || !vQf4 || !sf1 || !sf2) {
        alert('Nem todas as quartas estão encerradas')
        setAvancando(false)
        return
      }

      // SF1: vencedor QF1 vs vencedor QF2
      // SF2: vencedor QF3 vs vencedor QF4
      const [r1, r2] = await Promise.all([
        supabase.from('jogos').update({ time_a_id: vQf1, time_b_id: vQf2 }).eq('id', sf1.id),
        supabase.from('jogos').update({ time_a_id: vQf3, time_b_id: vQf4 }).eq('id', sf2.id),
      ])

      if (r1.error || r2.error) {
        alert('Erro: ' + (r1.error?.message ?? r2.error?.message))
        setAvancando(false)
        return
      }

      setJogos((prev) =>
        prev.map((j) => {
          if (j.id === sf1.id) {
            return {
              ...j,
              time_a_id: vQf1,
              time_a: times.find((t) => t.id === vQf1),
              time_b_id: vQf2,
              time_b: times.find((t) => t.id === vQf2),
            }
          }
          if (j.id === sf2.id) {
            return {
              ...j,
              time_a_id: vQf3,
              time_a: times.find((t) => t.id === vQf3),
              time_b_id: vQf4,
              time_b: times.find((t) => t.id === vQf4),
            }
          }
          return j
        })
      )
    }

    if (de === 'semifinal') {
      const sf1 = bySlot('semifinal', 1)
      const sf2 = bySlot('semifinal', 2)
      const fin = bySlot('final', 1)
      const ter = bySlot('terceiro_lugar', 1)

      const vSf1 = getVenc(sf1); const pSf1 = getPerd(sf1)
      const vSf2 = getVenc(sf2); const pSf2 = getPerd(sf2)

      if (!vSf1 || !pSf1 || !vSf2 || !pSf2 || !fin || !ter) {
        alert('Nem todas as semifinais estão encerradas')
        setAvancando(false)
        return
      }

      // Final: vencedor SF1 vs vencedor SF2
      // 3º lugar: perdedor SF1 vs perdedor SF2
      const [r1, r2] = await Promise.all([
        supabase.from('jogos').update({ time_a_id: vSf1, time_b_id: vSf2 }).eq('id', fin.id),
        supabase.from('jogos').update({ time_a_id: pSf1, time_b_id: pSf2 }).eq('id', ter.id),
      ])

      if (r1.error || r2.error) {
        alert('Erro: ' + (r1.error?.message ?? r2.error?.message))
        setAvancando(false)
        return
      }

      setJogos((prev) =>
        prev.map((j) => {
          if (j.id === fin.id) {
            return {
              ...j,
              time_a_id: vSf1,
              time_a: times.find((t) => t.id === vSf1),
              time_b_id: vSf2,
              time_b: times.find((t) => t.id === vSf2),
            }
          }
          if (j.id === ter.id) {
            return {
              ...j,
              time_a_id: pSf1,
              time_a: times.find((t) => t.id === pSf1),
              time_b_id: pSf2,
              time_b: times.find((t) => t.id === pSf2),
            }
          }
          return j
        })
      )
    }

    setAvancando(false)
  }

  // ── Voltar fase ────────────────────────────────────────────
  const voltarFase = async (fase: 'quartas' | 'semifinal') => {
    setAvancando(true)

    // Use any team from the category as placeholder (foreign keys can't be 0)
    const timesDaCategoria = times.filter((t) =>
      grupos.some((g) => g.id === t.grupo_id && g.categoria_id === categoriaAtiva)
    )
    const placeholderId = timesDaCategoria[0]?.id
    if (!placeholderId) {
      alert('Erro: nenhum time encontrado nessa categoria')
      setAvancando(false)
      return
    }

    if (fase === 'quartas') {
      // Voltar de semi para quartas: zera SF
      const semis = jogosElim.filter((j) => j.rodada === 'semifinal')
      const updates = semis.map((j) =>
        supabase
          .from('jogos')
          .update({
            time_a_id: placeholderId,
            time_b_id: placeholderId,
            placar_a: 0,
            placar_b: 0,
            status: 'pendente',
          })
          .eq('id', j.id)
      )
      const results = await Promise.all(updates)
      if (results.some((r) => r.error)) {
        alert('Erro ao voltar: ' + results.find((r) => r.error)?.error?.message)
        setAvancando(false)
        return
      }
      setJogos((prev) =>
        prev.map((j) => {
          if (j.rodada === 'semifinal') {
            return {
              ...j,
              time_a_id: placeholderId,
              time_a: undefined,
              time_b_id: placeholderId,
              time_b: undefined,
              placar_a: 0,
              placar_b: 0,
              status: 'pendente' as const,
            }
          }
          return j
        })
      )
    }

    if (fase === 'semifinal') {
      // Voltar de final para semi: zera Final + 3º lugar
      const fin = jogosElim.find((j) => j.rodada === 'final')
      const ter = jogosElim.find((j) => j.rodada === 'terceiro_lugar')
      const updates = [fin, ter]
        .filter((j): j is Jogo => Boolean(j))
        .map((j) =>
          supabase
            .from('jogos')
            .update({
              time_a_id: placeholderId,
              time_b_id: placeholderId,
              placar_a: 0,
              placar_b: 0,
              status: 'pendente',
            })
            .eq('id', j.id)
        )
      const results = await Promise.all(updates)
      if (results.some((r) => r.error)) {
        alert('Erro ao voltar: ' + results.find((r) => r.error)?.error?.message)
        setAvancando(false)
        return
      }
      setJogos((prev) =>
        prev.map((j) => {
          if (['final', 'terceiro_lugar'].includes(j.rodada)) {
            return {
              ...j,
              time_a_id: placeholderId,
              time_a: undefined,
              time_b_id: placeholderId,
              time_b: undefined,
              placar_a: 0,
              placar_b: 0,
              status: 'pendente' as const,
            }
          }
          return j
        })
      )
    }

    setConfirmVoltarFase(null)
    setAvancando(false)
  }

  // ── Resetar chaveamento (volta para fase de grupos) ───────
  const resetBracket = async () => {
    setAvancando(true)
    // Apaga TODOS os jogos da categoria que não são da fase de grupos
    const idsParaDeletar = jogos
      .filter((j) => j.categoria_id === categoriaAtiva && j.rodada !== 'grupos')
      .map((j) => j.id)

    if (idsParaDeletar.length === 0) {
      setConfirmResetBracket(false)
      setAvancando(false)
      return
    }

    const { error } = await supabase
      .from('jogos')
      .delete()
      .in('id', idsParaDeletar)

    if (error) {
      alert('Erro ao resetar: ' + error.message)
      setAvancando(false)
      return
    }

    setJogos((prev) => prev.filter((j) => !idsParaDeletar.includes(j.id)))
    setConfirmResetBracket(false)
    setAvancando(false)
  }

  // ── Swap de time no bracket (substituir por outro time) ───
  const executarSwap = async (newTimeId: number) => {
    if (!swapJogo) return
    const currentJogo = jogos.find((j) => j.id === swapJogo.jogoId)
    if (!currentJogo) return

    const oldTimeId =
      swapJogo.pos === 'a' ? currentJogo.time_a_id : currentJogo.time_b_id

    if (oldTimeId === newTimeId) {
      setSwapJogo(null)
      return
    }

    // Find if newTimeId is in another pending bracket slot (we'll swap)
    const otherJogo = jogosElim.find(
      (j) =>
        j.id !== swapJogo.jogoId &&
        j.status === 'pendente' &&
        (j.time_a_id === newTimeId || j.time_b_id === newTimeId)
    )

    const fieldOriginal = swapJogo.pos === 'a' ? 'time_a_id' : 'time_b_id'

    const r1 = await supabase
      .from('jogos')
      .update({ [fieldOriginal]: newTimeId })
      .eq('id', swapJogo.jogoId)

    if (r1.error) {
      alert('Erro ao trocar: ' + r1.error.message)
      return
    }

    let otherPos: 'a' | 'b' | null = null
    if (otherJogo) {
      otherPos = otherJogo.time_a_id === newTimeId ? 'a' : 'b'
      const fieldOther = otherPos === 'a' ? 'time_a_id' : 'time_b_id'
      const r2 = await supabase
        .from('jogos')
        .update({ [fieldOther]: oldTimeId })
        .eq('id', otherJogo.id)
      if (r2.error) {
        alert('Erro ao trocar (segunda parte): ' + r2.error.message)
        return
      }
    }

    setJogos((prev) =>
      prev.map((j) => {
        if (j.id === swapJogo.jogoId) {
          const newTime = times.find((t) => t.id === newTimeId)
          return swapJogo.pos === 'a'
            ? { ...j, time_a_id: newTimeId, time_a: newTime }
            : { ...j, time_b_id: newTimeId, time_b: newTime }
        }
        if (otherJogo && j.id === otherJogo.id && otherPos) {
          const oldTime = times.find((t) => t.id === oldTimeId)
          return otherPos === 'a'
            ? { ...j, time_a_id: oldTimeId, time_a: oldTime }
            : { ...j, time_b_id: oldTimeId, time_b: oldTime }
        }
        return j
      })
    )

    setSwapJogo(null)
  }

  // ── Geração do chaveamento ─────────────────────────────────
  const gerarChaveamento = async (classificados: ClassificacaoRow[]) => {
    setGerandoBracket(true)
    const novosJogos = gerarJogosEliminatorios(categoriaAtiva, classificados)

    const { data, error } = await supabase
      .from('jogos')
      .insert(novosJogos)
      .select('*, time_a:times!jogos_time_a_id_fkey(id,nome,grupo_id), time_b:times!jogos_time_b_id_fkey(id,nome,grupo_id)')
    if (!error && data) {
      setJogos((prev) => [...prev, ...data])
    } else {
      alert('Erro ao gerar chaveamento: ' + error?.message)
    }
    setGerandoBracket(false)
  }

  // ── Dados da categoria ativa ───────────────────────────────
  const gruposDaCategoria = grupos.filter((g) => g.categoria_id === categoriaAtiva)
  const jogosGrupos = jogos.filter(
    (j) => j.categoria_id === categoriaAtiva && j.rodada === 'grupos'
  )
  const jogosWildcard = jogos.filter(
    (j) => j.categoria_id === categoriaAtiva && j.rodada === 'wildcard'
  )
  const jogosElim = jogos.filter(
    (j) => j.categoria_id === categoriaAtiva && !['grupos', 'wildcard'].includes(j.rodada)
  )
  const todosGruposEncerrados =
    jogosGrupos.length > 0 && jogosGrupos.every((j) => j.status === 'encerrado')
  const chaveamentoGerado = jogosElim.length > 0

  // Wildcard status (for quartas categories with 3 groups)
  const config = somenteGrupos
    ? null
    : getBracketConfig(gruposDaCategoria)

  const wildcardStatus =
    config?.wildcards && todosGruposEncerrados
      ? resolverWildcards(
          gruposDaCategoria,
          times,
          jogosGrupos,
          jogosWildcard
        )
      : null

  const wildcardPendente = wildcardStatus
    ? wildcardStatus.empate !== null ||
      wildcardStatus.wildcardResolvidos.length < (config?.wildcards ?? 0)
    : false

  // Final classified list for bracket generation
  const classificadosFinais =
    wildcardStatus && !wildcardPendente
      ? [...wildcardStatus.diretos, ...wildcardStatus.wildcardResolvidos]
      : null

  // For no-wildcard categories
  const classificadosSemWildcard =
    config && !config.wildcards && todosGruposEncerrados
      ? gruposDaCategoria.flatMap((g) => {
          const t = times.filter((x) => x.grupo_id === g.id)
          const j = jogosGrupos.filter((x) => x.grupo_id === g.id)
          return calcularClassificacao(t, j).slice(0, 2)
        })
      : null

  const prontoParaGerar =
    !chaveamentoGerado &&
    todosGruposEncerrados &&
    !wildcardPendente &&
    (classificadosFinais !== null || classificadosSemWildcard !== null)

  const classificadosParaBracket = classificadosFinais ?? classificadosSemWildcard ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-300 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-amber-600">⚙️ Admin – Copa Imperial</h1>
          <div className="flex items-center gap-2">
            <a
              href={`/imprimir?token=${token}`}
              target="_blank"
              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1 rounded-full transition-colors"
              title="Versão imprimível para backup em papel"
            >
              📋 Backup
            </a>
            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
              Juiz
            </span>
          </div>
        </div>
        <CategoriaTabs
          categorias={categorias}
          ativa={categoriaAtiva}
          onChange={(id) => {
            setCategoriaAtiva(id)
            setAbaAtiva('jogos')
          }}
        />
        {categoriaAtivaObj && getHorarioCategoria(categoriaAtivaObj.nome) && (
          <p className="text-xs text-amber-700/80 mt-2 font-medium">
            🕗 {getHorarioCategoria(categoriaAtivaObj.nome)}
          </p>
        )}
        <div className="flex gap-1 mt-3">
          {(['jogos', 'jogadores', 'chaveamento'] as Aba[])
            .filter((a) => !(a === 'chaveamento' && somenteGrupos))
            .map((aba) => (
              <button
                key={aba}
                onClick={() => setAbaAtiva(aba)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  abaAtiva === aba
                    ? 'bg-slate-300 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {aba === 'jogos'
                  ? 'Jogos'
                  : aba === 'jogadores'
                  ? 'Jogadores'
                  : 'Chaveamento'}
              </button>
            ))}
        </div>
      </header>

      <main className={`px-4 py-6 mx-auto ${abaAtiva === 'chaveamento' ? 'max-w-6xl' : 'max-w-2xl'}`}>

        {/* ── ABA JOGOS ── */}
        {abaAtiva === 'jogos' && (
          <div className="space-y-8">
            <RegrasBox categoria={categoriaAtivaObj} numGrupos={gruposDaCategoria.length} />

            {/* Wildcard games */}
            {jogosWildcard.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-3">
                  🔀 Desempate Wildcard
                </h2>
                <div className="space-y-2">
                  {jogosWildcard.map((jogo) => (
                    <div key={jogo.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <CardJogo jogo={jogo} codigo={getCodigo(jogo)} showEditBtn onEdit={openModal} />
                      </div>
                      {jogo.status !== 'encerrado' && (
                        <a
                          href={`/juiz?token=${token}&jogo=${jogo.id}`}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold transition-colors"
                        >
                          ▶
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Group games */}
            {gruposDaCategoria.map((grupo) => {
              const jogosDo = sortGamesRoundRobin(jogosGrupos.filter((j) => j.grupo_id === grupo.id))
              const pendentes = jogosDo.filter((j) => j.status !== 'encerrado')
              const encerrados = jogosDo.filter((j) => j.status === 'encerrado')
              return (
                <section key={grupo.id}>
                  <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-3">
                    {grupo.nome}
                  </h2>
                  {pendentes.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs text-slate-500 mb-1">Pendentes</p>
                      {pendentes.map((jogo) => (
                        <div key={jogo.id} className="flex items-center gap-2">
                          <div className="flex-1">
                            <CardJogo jogo={jogo} codigo={getCodigo(jogo)} showEditBtn onEdit={openModal} />
                          </div>
                          <a
                            href={`/juiz?token=${token}&jogo=${jogo.id}`}
                            className="flex-shrink-0 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold transition-colors"
                          >
                            ▶
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  {encerrados.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 mb-1">Encerrados</p>
                      {encerrados.map((jogo) => (
                        <CardJogo key={jogo.id} jogo={jogo} codigo={getCodigo(jogo)} showEditBtn onEdit={openModal} />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}

            {/* Elimination games */}
            {jogosElim.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-3">
                  Fase Eliminatória
                </h2>
                <div className="space-y-2">
                  {jogosElim
                    .filter((j) => j.status !== 'encerrado')
                    .map((jogo) => (
                      <div key={jogo.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <CardJogo jogo={jogo} codigo={getCodigo(jogo)} showEditBtn onEdit={openModal} />
                        </div>
                        <a
                          href={`/juiz?token=${token}&jogo=${jogo.id}`}
                          className="flex-shrink-0 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold transition-colors"
                        >
                          ▶
                        </a>
                      </div>
                    ))}
                  {jogosElim
                    .filter((j) => j.status === 'encerrado')
                    .map((jogo) => (
                      <CardJogo key={jogo.id} jogo={jogo} codigo={getCodigo(jogo)} showEditBtn onEdit={openModal} />
                    ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── ABA JOGADORES ── */}
        {abaAtiva === 'jogadores' && (
          <div className="space-y-6">
            {gruposDaCategoria.map((grupo) => {
              const timesDo = times.filter((t) => t.grupo_id === grupo.id)
              return (
                <section key={grupo.id}>
                  <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-3">
                    {grupo.nome}
                  </h2>
                  <div className="space-y-2">
                    {timesDo.map((time) => (
                      <div
                        key={time.id}
                        className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-slate-300"
                      >
                        {editandoTime?.id === time.id ? (
                          <>
                            <input
                              autoFocus
                              className="flex-1 bg-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                              value={editandoTime.nome}
                              onChange={(e) =>
                                setEditandoTime((p) => p && { ...p, nome: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveNomeTime()
                                if (e.key === 'Escape') setEditandoTime(null)
                              }}
                            />
                            <button
                              onClick={saveNomeTime}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditandoTime(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-medium">{time.nome}</span>
                            <button
                              onClick={() =>
                                setEditandoTime({ id: time.id, nome: time.nome })
                              }
                              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs"
                            >
                              ✏️ Editar
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* ── ABA CHAVEAMENTO ── */}
        {abaAtiva === 'chaveamento' && !somenteGrupos && (
          <div className="space-y-8">
            {/* Classificação por grupo */}
            {gruposDaCategoria.map((grupo) => {
              const t = times.filter((x) => x.grupo_id === grupo.id)
              const j = jogosGrupos.filter((x) => x.grupo_id === grupo.id)
              return (
                <section key={grupo.id}>
                  <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-3">
                    {grupo.nome}
                  </h2>
                  <TabelaClassificacao rows={calcularClassificacao(t, j)} classificados={2} />
                </section>
              )
            })}

            {/* Wildcard alert */}
            {wildcardStatus?.empate && !chaveamentoGerado && (
              <div className="rounded-xl border border-amber-400 bg-amber-100 p-4">
                <p className="text-amber-600 font-semibold text-sm mb-1">
                  ⚠️ Empate nos wildcards
                </p>
                <p className="text-slate-600 text-xs mb-3">
                  {wildcardStatus.empate.tipo === 'tres'
                    ? '3 terceiros colocados empatados. Será criado um mini rodízio entre eles.'
                    : '2 terceiros colocados empatados. Será criado 1 jogo de desempate.'}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Times: {wildcardStatus.empate.times.map((t) => t.time.nome).join(' · ')}
                </p>
                {jogosWildcard.length === 0 && (
                  <button
                    onClick={() =>
                      criarJogosWildcard(
                        wildcardStatus.empate!.tipo,
                        wildcardStatus.empate!.times
                      )
                    }
                    disabled={gerandoWildcard}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold disabled:opacity-50"
                  >
                    {gerandoWildcard ? 'Criando…' : 'Criar jogo(s) de desempate'}
                  </button>
                )}
                {jogosWildcard.length > 0 &&
                  jogosWildcard.some((j) => j.status !== 'encerrado') && (
                    <p className="text-xs text-slate-600">
                      Jogo(s) criados — vá para a aba{' '}
                      <button
                        className="text-amber-600 underline"
                        onClick={() => setAbaAtiva('jogos')}
                      >
                        Jogos
                      </button>{' '}
                      para registrar o resultado.
                    </p>
                  )}
              </div>
            )}

            {/* Gerar chaveamento */}
            {!chaveamentoGerado && (
              <div className="rounded-xl border border-slate-300 bg-white p-5 text-center">
                {prontoParaGerar ? (
                  <>
                    <p className="text-slate-700 text-sm mb-4">
                      Fase de grupos encerrada. Pronto para gerar o chaveamento.
                    </p>
                    <button
                      onClick={() => gerarChaveamento(classificadosParaBracket)}
                      disabled={gerandoBracket}
                      className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-50"
                    >
                      {gerandoBracket ? 'Gerando…' : '🏆 Gerar Chaveamento'}
                    </button>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">
                    {!todosGruposEncerrados
                      ? 'Encerre todos os jogos da fase de grupos primeiro.'
                      : wildcardPendente
                      ? 'Resolva o empate dos wildcards para liberar o chaveamento.'
                      : 'Aguardando…'}
                  </p>
                )}
              </div>
            )}

            {/* Bracket + botões de avanço */}
            {chaveamentoGerado && (() => {
              const quartas = jogosElim.filter((j) => j.rodada === 'quartas')
              const semis   = jogosElim.filter((j) => j.rodada === 'semifinal')
              const fin     = jogosElim.find((j) => j.rodada === 'final')
              const ter     = jogosElim.find((j) => j.rodada === 'terceiro_lugar')

              const quartasOk = quartas.length > 0 && quartas.every((j) => j.status === 'encerrado')
              const semisOk   = semis.length > 0 && semis.every((j) => j.status === 'encerrado')

              // "Placeholder" = SF/Final ainda tem mesmo time nos dois lados
              const semiTemPlaceholder = semis.some((j) => j.time_a_id === j.time_b_id)
              const finalTemPlaceholder = fin && ter && fin.time_a_id === fin.time_b_id

              const showAvancarSemi  = quartasOk && semiTemPlaceholder
              const showAvancarFinal = semisOk && finalTemPlaceholder

              const semiPopulada = semis.length > 0 && !semiTemPlaceholder
              const finalPopulada = !!fin && !!ter && !finalTemPlaceholder

              return (
                <>
                  {/* Avançar para Semi */}
                  {showAvancarSemi && (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 flex items-center justify-between gap-3">
                      <p className="text-emerald-700 text-sm font-semibold flex-1">
                        ✅ Quartas encerradas — avançar para Semifinal
                      </p>
                      <button
                        onClick={() => avancarFase('quartas')}
                        disabled={avancando}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 transition-colors"
                      >
                        {avancando ? 'Avançando…' : 'Avançar →'}
                      </button>
                    </div>
                  )}

                  {/* Avançar para Final */}
                  {showAvancarFinal && (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 flex items-center justify-between gap-3">
                      <p className="text-emerald-700 text-sm font-semibold flex-1">
                        ✅ Semifinais encerradas — avançar para Final
                      </p>
                      <button
                        onClick={() => avancarFase('semifinal')}
                        disabled={avancando}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50 transition-colors"
                      >
                        {avancando ? 'Avançando…' : 'Avançar →'}
                      </button>
                    </div>
                  )}

                  {/* Voltar para Quartas (limpa Semi) */}
                  {semiPopulada && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3 flex items-center justify-between gap-3">
                      <p className="text-red-700 text-xs flex-1">
                        ↶ Resetar Semifinal e voltar para fase de Quartas
                      </p>
                      <button
                        onClick={() => setConfirmVoltarFase('quartas')}
                        disabled={avancando}
                        className="px-3 py-2 rounded-lg bg-red-200 hover:bg-red-300 text-red-700 text-xs font-bold disabled:opacity-50 transition-colors border border-red-400"
                      >
                        ↶ Voltar
                      </button>
                    </div>
                  )}

                  {/* Voltar para Semi (limpa Final) */}
                  {finalPopulada && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3 flex items-center justify-between gap-3">
                      <p className="text-red-700 text-xs flex-1">
                        ↶ Resetar Final + 3º lugar e voltar para Semifinais
                      </p>
                      <button
                        onClick={() => setConfirmVoltarFase('semifinal')}
                        disabled={avancando}
                        className="px-3 py-2 rounded-lg bg-red-200 hover:bg-red-300 text-red-700 text-xs font-bold disabled:opacity-50 transition-colors border border-red-400"
                      >
                        ↶ Voltar
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                      Chaveamento
                    </h2>
                    <button
                      onClick={() => setConfirmResetBracket(true)}
                      disabled={avancando}
                      className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-900/50 text-red-700 text-xs font-bold disabled:opacity-50 transition-colors border border-red-400"
                      title="Apaga todo o chaveamento e volta para a fase de grupos"
                    >
                      ⌫ Resetar Chaveamento
                    </button>
                  </div>
                  <BracketView
                    jogos={jogosElim}
                    times={times}
                    showEditBtn
                    onEdit={openModal}
                    onSwapRequest={(target) => setSwapJogo({ jogoId: target.jogoId, pos: target.pos })}
                    getCodigo={getCodigo}
                  />
                </>
              )
            })()}
          </div>
        )}
      </main>

      {/* Modal resetar chaveamento (volta para fase de grupos) */}
      {confirmResetBracket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-red-400">
            <h3 className="text-lg font-bold text-red-600 mb-2">⚠️ Resetar Chaveamento?</h3>
            <p className="text-slate-700 text-sm mb-2">
              Isto vai <strong>apagar todos os jogos do chaveamento</strong> (quartas, semi, final, 3º, wildcards) desta categoria.
            </p>
            <p className="text-slate-600 text-sm mb-4">
              A fase de grupos e seus resultados serão mantidos. Você poderá gerar o chaveamento novamente.
            </p>
            <p className="text-red-600 text-xs mb-4 font-semibold">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmResetBracket(false)}
                disabled={avancando}
                className="flex-1 py-3 rounded-xl bg-slate-200 text-slate-900 font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={resetBracket}
                disabled={avancando}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-50 transition-colors"
              >
                {avancando ? 'Resetando…' : 'Resetar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal voltar fase */}
      {confirmVoltarFase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-300">
            <h3 className="text-lg font-bold text-red-600 mb-2">⚠️ Voltar fase?</h3>
            <p className="text-slate-600 text-sm mb-4">
              {confirmVoltarFase === 'quartas'
                ? 'Isto vai limpar as Semifinais (times voltam em branco, placares zerados).'
                : 'Isto vai limpar a Final e 3º lugar (times voltam em branco, placares zerados).'}
            </p>
            <p className="text-slate-500 text-xs mb-4">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmVoltarFase(null)}
                disabled={avancando}
                className="flex-1 py-3 rounded-xl bg-slate-200 text-slate-900 font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => voltarFase(confirmVoltarFase)}
                disabled={avancando}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-50 transition-colors"
              >
                {avancando ? 'Voltando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal trocar time */}
      {swapJogo && (() => {
        const currentJogo = jogos.find((j) => j.id === swapJogo.jogoId)
        const currentTimeId = currentJogo
          ? swapJogo.pos === 'a'
            ? currentJogo.time_a_id
            : currentJogo.time_b_id
          : 0
        const currentTimeNome = times.find((t) => t.id === currentTimeId)?.nome ?? '?'

        const timesDaCategoria = times.filter((t) =>
          grupos.some((g) => g.id === t.grupo_id && g.categoria_id === categoriaAtiva)
        )
        // Excluir o time atual
        const opcoes = timesDaCategoria.filter((t) => t.id !== currentTimeId)

        // Indicar quais times estão na fase eliminatória
        const timesNaElim = new Set<number>()
        jogosElim.forEach((j) => {
          if (j.id !== swapJogo.jogoId) {
            timesNaElim.add(j.time_a_id)
            timesNaElim.add(j.time_b_id)
          }
        })

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-300 max-h-[80vh] flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-1">⇄ Trocar time</h3>
              <p className="text-slate-600 text-sm mb-4">
                Substituir <span className="text-amber-600 font-semibold">{currentTimeNome}</span> por:
              </p>
              <div className="space-y-2 overflow-y-auto flex-1">
                {opcoes.map((time) => {
                  const naElim = timesNaElim.has(time.id)
                  return (
                    <button
                      key={time.id}
                      onClick={() => executarSwap(time.id)}
                      className={`w-full text-left py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        naElim
                          ? 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100'
                          : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
                      }`}
                    >
                      {time.nome}
                      {naElim && (
                        <span className="ml-2 text-[10px] text-amber-600 font-semibold">
                          (já no chaveamento — vai trocar)
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setSwapJogo(null)}
                className="w-full mt-3 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )
      })()}

      {/* Modal resultado */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-300 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900">Resultado</h3>
              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {getCodigo(modal.jogo)}
              </span>
            </div>
            <p className="text-slate-600 text-sm mb-5">
              {modal.jogo.time_a?.nome} × {modal.jogo.time_b?.nome}
            </p>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-600 mb-1">{modal.jogo.time_a?.nome}</p>
                <input
                  type="number"
                  min={0}
                  value={modal.placarA}
                  onChange={(e) =>
                    setModal((m) => m && { ...m, placarA: e.target.value })
                  }
                  className="w-full text-center text-3xl font-bold bg-slate-200 rounded-xl py-3 text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-slate-500 text-2xl font-bold">×</span>
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-600 mb-1">{modal.jogo.time_b?.nome}</p>
                <input
                  type="number"
                  min={0}
                  value={modal.placarB}
                  onChange={(e) =>
                    setModal((m) => m && { ...m, placarB: e.target.value })
                  }
                  className="w-full text-center text-3xl font-bold bg-slate-200 rounded-xl py-3 text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={resetarPartida}
                disabled={modal.loading}
                className="flex-1 py-2 rounded-lg bg-red-100 hover:bg-red-900/50 text-red-700 text-xs font-semibold transition-colors border border-red-400 disabled:opacity-50"
                title="Volta a partida para 'não iniciada' (não computa pontos)"
              >
                ↺ Resetar partida (volta para pendente)
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl bg-slate-200 text-slate-700 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={saveResult}
                disabled={modal.loading}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-900 font-bold disabled:opacity-50"
              >
                {modal.loading ? 'Salvando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

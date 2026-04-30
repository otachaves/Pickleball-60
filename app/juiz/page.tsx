import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCodigoJogo } from '@/lib/codigos'
import JuizClient from './JuizClient'

interface Props {
  searchParams: Promise<{ token?: string; jogo?: string }>
}

export const dynamic = 'force-dynamic'

export default async function JuizPage({ searchParams }: Props) {
  const { token, jogo: jogoId } = await searchParams

  if (token !== process.env.ADMIN_TOKEN || !jogoId) {
    redirect('/')
  }

  const [{ data: jogo }, { data: categorias }, { data: grupos }, { data: todosJogos }] =
    await Promise.all([
      supabase
        .from('jogos')
        .select(
          '*, time_a:times!jogos_time_a_id_fkey(id,nome,grupo_id), time_b:times!jogos_time_b_id_fkey(id,nome,grupo_id)'
        )
        .eq('id', jogoId)
        .single(),
      supabase.from('categorias').select('*'),
      supabase.from('grupos').select('*'),
      supabase.from('jogos').select('*'),
    ])

  if (!jogo) redirect(`/admin?token=${token}`)

  const cat = (categorias ?? []).find((c) => c.id === jogo.categoria_id)
  const codigo = getCodigoJogo(jogo, cat, grupos ?? [], todosJogos ?? [])

  return <JuizClient jogo={jogo} token={token!} codigo={codigo} />
}

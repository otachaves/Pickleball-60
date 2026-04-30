import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminClient from './AdminClient'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export const dynamic = 'force-dynamic'

export default async function AdminPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (token !== process.env.ADMIN_TOKEN) {
    redirect('/')
  }

  const [{ data: categorias }, { data: grupos }, { data: times }, { data: jogos }] =
    await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('grupos').select('*'),
      supabase.from('times').select('*'),
      supabase
        .from('jogos')
        .select(
          '*, time_a:times!jogos_time_a_id_fkey(id,nome,grupo_id), time_b:times!jogos_time_b_id_fkey(id,nome,grupo_id)'
        )
        .order('id'),
    ])

  return (
    <AdminClient
      token={token!}
      categorias={categorias ?? []}
      grupos={grupos ?? []}
      times={times ?? []}
      jogosIniciais={jogos ?? []}
    />
  )
}

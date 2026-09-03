import { Evento, ProgramacaoItem } from '@/lib/types'

interface Props {
  evento: Evento
}

export default function InfoEvento({ evento }: Props) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-amber-600 mb-2">
          {evento.titulo}
        </h1>
        <p className="text-lg text-slate-700 font-medium">{evento.subtitulo}</p>
      </div>

      {evento.formato_jogo && (
        <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-3">
            🎾 Formato do jogo
          </h2>
          <p className="text-sm font-semibold text-slate-900">{evento.formato_jogo}</p>
        </section>
      )}

      {evento.programacao.length > 0 && (
        <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4">
            📅 Programação
          </h2>
          <div className="space-y-5 text-sm text-slate-700">
            {agruparPorDia(evento.programacao).map((dia, i) => (
              <div key={i}>
                {dia.titulo && (
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    {dia.titulo}
                  </p>
                )}
                <div className="space-y-2">
                  {dia.itens.map((item, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <span className="text-slate-500 font-mono text-xs uppercase mt-0.5 w-14 flex-shrink-0 whitespace-nowrap tabular-nums">
                        {item.hora}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{item.o_que}</p>
                        {item.detalhe && <p className="text-slate-600">{item.detalhe}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {evento.local_nome && (
        <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4">
            📍 Local
          </h2>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-900">{evento.local_nome}</p>
            {evento.local_endereco && <p className="text-slate-700">{evento.local_endereco}</p>}
            {evento.local_cidade && <p className="text-slate-700">{evento.local_cidade}</p>}
            {evento.estacionamento && (
              <p className="text-slate-600 text-xs italic mt-2">{evento.estacionamento}</p>
            )}
          </div>
          {evento.local_maps_url && (
            <a
              href={evento.local_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold transition-colors"
            >
              🗺️ Ver no mapa
            </a>
          )}
        </section>
      )}

      {evento.contato_nome && (
        <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4">
            📞 Contato
          </h2>
          <div className="text-sm">
            <p className="font-semibold text-slate-900">{evento.contato_nome}</p>
            {evento.contato_whatsapp && (
              <a
                href={`https://wa.me/${evento.contato_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 text-emerald-700 hover:text-emerald-600 font-medium"
              >
                💬 WhatsApp: {evento.contato_whatsapp_label}
              </a>
            )}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-slate-500 italic pt-4">
        Selecione uma categoria acima para ver jogos, classificação e chaveamento.
      </p>
    </div>
  )
}

// "Sáb 05/09 · 8h30" → dia "Sáb 05/09" + hora "8h30". Sem "·", tudo vira hora.
interface DiaProgramacao {
  titulo: string | null
  itens: { hora: string; o_que: string; detalhe: string }[]
}

function agruparPorDia(itens: ProgramacaoItem[]): DiaProgramacao[] {
  const dias: DiaProgramacao[] = []
  for (const item of itens) {
    const partes = item.quando.split('·').map((p) => p.trim())
    const titulo = partes.length > 1 ? partes[0] : null
    const hora = partes.length > 1 ? partes.slice(1).join(' · ') : item.quando
    const ultimo = dias[dias.length - 1]
    if (ultimo && ultimo.titulo === titulo) {
      ultimo.itens.push({ hora, o_que: item.o_que, detalhe: item.detalhe })
    } else {
      dias.push({ titulo, itens: [{ hora, o_que: item.o_que, detalhe: item.detalhe }] })
    }
  }
  return dias
}

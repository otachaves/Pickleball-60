export default function InfoEvento() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-amber-600 mb-2">
          🏆 Copa Imperial 60+
        </h1>
        <p className="text-lg text-slate-700 font-medium">Torneio de Pickleball</p>
      </div>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4">
          📅 Programação
        </h2>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <span className="text-slate-500 font-mono text-xs uppercase mt-0.5 w-20 flex-shrink-0">
              1 maio
            </span>
            <div>
              <p className="font-semibold text-slate-900">Open Play</p>
              <p className="text-slate-600">A partir das 15:00</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-slate-500 font-mono text-xs uppercase mt-0.5 w-20 flex-shrink-0">
              2-3 maio
            </span>
            <div>
              <p className="font-semibold text-slate-900">Torneio</p>
              <p className="text-slate-600">Veja horário de cada categoria nas abas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4">
          📍 Local
        </h2>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-900">Quadra Paróquia Santa Clara</p>
          <p className="text-slate-700">Tv. João Kneipp, 80 — Valparaíso</p>
          <p className="text-slate-700">Petrópolis, RJ — 25655-480</p>
          <p className="text-slate-600 text-xs italic mt-2">🅿️ Estacionamento no local</p>
        </div>
        <a
          href="https://maps.google.com/?q=Tv.+Jo%C3%A3o+Kneipp%2C+80+-+Valpara%C3%ADso%2C+Petr%C3%B3polis+-+RJ%2C+25655-480"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold transition-colors"
        >
          🗺️ Ver no mapa
        </a>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4">
          📞 Contato
        </h2>
        <div className="text-sm">
          <p className="font-semibold text-slate-900">Mauro</p>
          <a
            href="https://wa.me/5524988050643"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 text-emerald-700 hover:text-emerald-600 font-medium"
          >
            💬 WhatsApp: +55 24 98805-0643
          </a>
        </div>
      </section>

      <p className="text-center text-xs text-slate-500 italic pt-4">
        Selecione uma categoria acima para ver jogos, classificação e chaveamento.
      </p>
    </div>
  )
}

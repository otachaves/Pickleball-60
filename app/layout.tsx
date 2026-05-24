import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Copa Cidade Imperial – Dupla Mista',
  description: 'Tabela e resultados da Copa Cidade Imperial de Pickleball – Dupla Mista',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  )
}

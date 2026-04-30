// Horários iniciais da fase de grupos por categoria
// Identificado por nome da categoria (ou cair no default se não encontrar)

export const HORARIOS_CATEGORIA: Record<string, string> = {
  'Single Masculino': '2 de maio · a partir de 08:00',
  'Dupla Feminina': '2 de maio · a partir de 13:00',
  'Dupla Masculina': '2 de maio · a partir de 15:00',
  'Dupla Mista': '3 de maio · a partir de 09:00',
  'Quarteto': '3 de maio · a partir de 13:00',
}

export function getHorarioCategoria(nomeCategoria: string): string | null {
  return HORARIOS_CATEGORIA[nomeCategoria] ?? null
}

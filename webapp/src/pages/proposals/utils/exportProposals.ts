import type { Proposal } from '../model/proposalTypes'
import { generateProposalsPDF } from './generatePDF'

export function exportToCSV(proposals: Proposal[], fileName: string = 'propuestas.csv') {
  if (proposals.length === 0) return

  const headers = ['Título', 'Tipo', 'Estado', 'Creador', 'Publicado', 'Etiquetas', 'Interesados', 'Descripción']
  const rows = proposals.map((p) => [
    p.title,
    getTypeName(p.type),
    getStatusName(p.status),
    `${p.creatorName} ${p.creatorSurname}`,
    new Date(p.publicationDate).toLocaleDateString('es-ES'),
    (p.tags ?? []).join('; '),
    p.interestCount.toString(),
    p.description.replace(/\n/g, ' ').substring(0, 100),
  ])

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
}

export async function exportToPDF(proposals: Proposal[], fileName: string = 'propuestas.pdf') {
  await generateProposalsPDF(proposals, fileName)
}

function getTypeName(type: number): string {
  const types: Record<number, string> = {
    1: 'Investigación',
    2: 'Desarrollo HW/SW',
    3: 'Experiencia Profesional',
    4: 'Calidad y Seguridad',
    5: 'Implantación HW/SW',
    6: 'Otros Trabajos',
  }
  return types[type] || `Tipo ${type}`
}

function getStatusName(status: string): string {
  const statuses: Record<string, string> = {
    proposed: 'Abierta',
    in_progress: 'En curso',
    completed: 'Finalizada',
  }
  return statuses[status] || status
}

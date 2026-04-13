import type { Proposal } from '../model/proposalTypes'

type JsPDF = any

export async function generateProposalsPDF(
  proposals: Proposal[],
  fileName: string = 'propuestas.pdf'
) {
  if (proposals.length === 0) return

  try {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF() as JsPDF
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 15
    let yPosition = 20

    const primaryColor = [229, 56, 100]
    const accentColor = [255, 240, 250]
    const darkText = [0, 0, 0]
    const lightText = [255, 255, 255]

    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(0, 0, pageWidth, 28, 'F')

    pdf.setTextColor(lightText[0], lightText[1], lightText[2])
    pdf.setFontSize(18)
    pdf.setFont(undefined, 'bold')
    pdf.text('Propuestas de TFE - Match-TFE', margin, 15)

    pdf.setTextColor(225, 225, 225)
    pdf.setFontSize(8)
    pdf.setFont(undefined, 'normal')
    const now = new Date()
    pdf.text(
      `${now.toLocaleDateString('es-ES')} | ${proposals.length} propuesta${proposals.length !== 1 ? 's' : ''}`,
      margin,
      22
    )

    yPosition = 35
    const tableHeaders = ['Título', 'Tipo', 'Estado', 'Creador']
    const colWidths = [60, 25, 25, 40]
    const rowHeight = 6

    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(margin - 2, yPosition - 5, pageWidth - 2 * margin + 4, rowHeight + 2, 'F')

    pdf.setTextColor(lightText[0], lightText[1], lightText[2])
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(10)

    let xPosition = margin + 2
    tableHeaders.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition)
      xPosition += colWidths[index]
    })

    yPosition += rowHeight + 1
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.setLineWidth(1)
    pdf.line(margin - 2, yPosition, pageWidth - margin + 2, yPosition)

    pdf.setTextColor(darkText[0], darkText[1], darkText[2])
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(8)

    let alternateColor = true
    proposals.slice(0, 50).forEach((proposal) => {
      if (yPosition > pdf.internal.pageSize.getHeight() - 15) {
        pdf.addPage()
        yPosition = 15

        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.rect(margin - 2, yPosition - 5, pageWidth - 2 * margin + 4, rowHeight + 2, 'F')

        pdf.setTextColor(lightText[0], lightText[1], lightText[2])
        pdf.setFont(undefined, 'bold')
        pdf.setFontSize(10)

        let headerX = margin + 2
        tableHeaders.forEach((header, idx) => {
          pdf.text(header, headerX, yPosition)
          headerX += colWidths[idx]
        })

        yPosition += rowHeight + 1
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.setLineWidth(1)
        pdf.line(margin - 2, yPosition, pageWidth - margin + 2, yPosition)

        pdf.setTextColor(darkText[0], darkText[1], darkText[2])
        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(8)
      }

      if (alternateColor) {
        pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2])
        pdf.rect(margin - 2, yPosition - 5, pageWidth - 2 * margin + 4, rowHeight, 'F')
      }

      xPosition = margin + 2
      const cells = [
        proposal.title.substring(0, 40),
        getTypeName(proposal.type),
        getStatusName(proposal.status),
        `${proposal.creatorName} ${proposal.creatorSurname}`.substring(0, 30),
      ]

      cells.forEach((cell, idx) => {
        pdf.text(String(cell), xPosition, yPosition)
        xPosition += colWidths[idx]
      })

      yPosition += rowHeight
      alternateColor = !alternateColor
    })

    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
  }
}

function getTypeName(type: number): string {
  const types: Record<number, string> = {
    1: 'Investigación',
    2: 'Desarrollo HW/SW',
    3: 'Experiencia Prof.',
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

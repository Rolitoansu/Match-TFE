export function splitCSVLine(line: string) {
  return line.split(',').map(c => c.trim())
}

export function normalizeCSVText(text: string) {
  return text.replace(/^\uFEFF/, '')
}

export function validateCSVFile(file: File, maxSize = 2 * 1024 * 1024) {
  const isCsvByExtension = file.name.toLowerCase().endsWith('.csv')
  const isCsvByMime = file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.type === ''

  if (!isCsvByExtension && !isCsvByMime) {
    return 'El archivo debe ser un CSV (.csv)'
  }

  if (file.size === 0) {
    return 'El archivo esta vacio'
  }

  if (file.size > maxSize) {
    return 'El CSV supera el tamano maximo de 2 MB'
  }

  return null
}

export interface TagItem {
  id: number
  name: string
}

export interface User {
  id: number
  name: string
  surname: string
  email: string
  role: 'student' | 'professor'
  registrationDate: string
  biography: string | null
}

export interface UploadResult {
  success: boolean
  message: string
  created?: number
  skipped?: number
  errors?: string[]
}

import { useState, useRef } from 'react'
import { Users, Upload } from 'lucide-react'
import adminApi from '../../api/adminAxios'
import type { UploadResult } from '../../utils/adminHelpers'
import { validateCSVFile, splitCSVLine, normalizeCSVText } from '../../utils/adminHelpers'

interface CSVStudent {
  email: string
  name: string
  surname: string
}

export function AdminStudentsTab() {
  const [csvStudents, setCsvStudents] = useState<CSVStudent[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [isStudentDragActive, setIsStudentDragActive] = useState(false)
  const studentFileInputRef = useRef<HTMLInputElement>(null)

  async function processStudentCSV(file: File) {
    const fileError = validateCSVFile(file)
    if (fileError) {
      setUploadResult({ success: false, message: fileError })
      return
    }

    const text = normalizeCSVText(await file.text())
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l)

    if (lines.length < 2) {
      setUploadResult({ success: false, message: 'El CSV debe incluir cabecera y al menos una fila' })
      return
    }

    const students: CSVStudent[] = []
    const invalidRows: string[] = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i])
      const email = cols[0] ?? ''
      const name = cols[1] ?? ''
      const surname = cols[2] ?? ''

      if (cols.length < 3 || !email || !name || !surname) {
        invalidRows.push(`Fila ${i + 1}: faltan columnas`)
        continue
      }

      if (!emailRegex.test(email)) {
        invalidRows.push(`Fila ${i + 1}: correo invalido`)
        continue
      }

      students.push({ email, name, surname })
    }

    if (students.length === 0) {
      setUploadResult({ success: false, message: 'No hay filas validas' })
      return
    }

    if (invalidRows.length > 0) {
      setUploadResult({ success: false, message: `Hay ${invalidRows.length} filas invalidas`, errors: invalidRows.slice(0, 5) })
    }

    setCsvStudents(students)
  }

  async function uploadStudents() {
    if (csvStudents.length === 0) return
    setUploading(true)
    setUploadResult(null)

    try {
      const { data } = await adminApi.post('/admin/students/import', { students: csvStudents })
      setUploadResult({ success: true, message: 'Importación completada', created: data.created, skipped: data.skipped, errors: data.errors })
      setCsvStudents([])
    } catch {
      setUploadResult({ success: false, message: 'Error al importar' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <Users className="text-primary" size={20} />
        Importar Estudiantes
      </h2>

      <p className="mb-6 text-sm text-muted-foreground">
        Formato CSV: <strong>correo, nombre, apellido</strong>
      </p>

      <div
        onClick={() => studentFileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsStudentDragActive(true) }}
        onDragLeave={() => setIsStudentDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsStudentDragActive(false)
          const file = e.dataTransfer.files?.[0]
          if (file) processStudentCSV(file)
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isStudentDragActive ? 'border-primary bg-primary/8' : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={studentFileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processStudentCSV(e.target.files[0])}
        />
        <Upload className="mx-auto mb-3 text-muted-foreground" size={40} />
        <p className="font-semibold">Arrastra o haz clic para seleccionar</p>
        <p className="text-xs text-muted-foreground">Máximo 2 MB</p>
      </div>

      {csvStudents.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold">{csvStudents.length} estudiante{csvStudents.length !== 1 ? 's' : ''} a importar</p>
          <button
            onClick={uploadStudents}
            disabled={uploading}
            className="w-full rounded-2xl bg-primary px-6 py-3 font-bold text-white hover:opacity-90 disabled:opacity-50 transition-smooth"
          >
            {uploading ? 'Importando...' : 'Importar Estudiantes'}
          </button>
        </div>
      )}

      {uploadResult && (
        <div className={`mt-4 rounded-2xl border p-4 animate-slideInUp ${
          uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <p className="font-bold text-sm">{uploadResult.message}</p>
          {uploadResult.created && (
            <p className="text-xs mt-1">{uploadResult.created} creado{uploadResult.created !== 1 ? 's' : ''} · {uploadResult.skipped} omitido{uploadResult.skipped !== 1 ? 's' : ''}</p>
          )}
          {uploadResult.errors?.length && (
            <ul className="mt-2 text-xs space-y-1 ml-4">
              {uploadResult.errors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

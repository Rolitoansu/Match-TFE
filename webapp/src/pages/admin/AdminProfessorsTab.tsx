import { useState, useRef } from 'react'
import { BookOpen, Upload } from 'lucide-react'
import adminApi from '../../api/adminAxios'
import type { UploadResult } from '../../utils/adminHelpers'
import { validateCSVFile, splitCSVLine, normalizeCSVText } from '../../utils/adminHelpers'
import { useTranslation } from 'react-i18next'

interface CSVProfessor {
  email: string
  name: string
  surname: string
}

export function AdminProfessorsTab() {
  const { t } = useTranslation()
  const [csvProfessors, setCsvProfessors] = useState<CSVProfessor[]>([])
  const [uploadingProfessors, setUploadingProfessors] = useState(false)
  const [uploadProfResult, setUploadProfResult] = useState<UploadResult | null>(null)
  const [isProfessorDragActive, setIsProfessorDragActive] = useState(false)
  const professorFileInputRef = useRef<HTMLInputElement>(null)

  async function processProfessorCSV(file: File) {
    const fileError = validateCSVFile(file)
    if (fileError) {
      setUploadProfResult({ success: false, message: fileError })
      return
    }

    const text = normalizeCSVText(await file.text())
    const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l)

    if (lines.length < 2) {
      setUploadProfResult({ success: false, message: t('admin.professors.upload.csvNeedsRows') })
      return
    }

    const professors: CSVProfessor[] = []
    const invalidRows: string[] = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i])
      const email = cols[0] ?? ''
      const name = cols[1] ?? ''
      const surname = cols[2] ?? ''

      if (cols.length < 3 || !email || !name || !surname) {
        invalidRows.push(t('admin.professors.upload.missingColumns', { row: i + 1 }))
        continue
      }

      if (!emailRegex.test(email)) {
        invalidRows.push(t('admin.professors.upload.invalidEmail', { row: i + 1 }))
        continue
      }

      professors.push({ email, name, surname })
    }

    if (professors.length === 0) {
      setUploadProfResult({ success: false, message: t('admin.professors.upload.noValidRows') })
      return
    }

    if (invalidRows.length > 0) {
      setUploadProfResult({ success: false, message: t('admin.professors.upload.invalidRows', { count: invalidRows.length }), errors: invalidRows.slice(0, 5) })
    }

    setCsvProfessors(professors)
  }

  async function uploadProfessors() {
    if (csvProfessors.length === 0) return
    setUploadingProfessors(true)
    setUploadProfResult(null)

    try {
      const { data } = await adminApi.post('/admin/professors/import', { professors: csvProfessors })
      setUploadProfResult({ success: true, message: t('admin.professors.upload.completed'), created: data.created, skipped: data.skipped, errors: data.errors })
      setCsvProfessors([])
    } catch {
      setUploadProfResult({ success: false, message: t('admin.professors.upload.error') })
    } finally {
      setUploadingProfessors(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <BookOpen className="text-primary" size={20} />
        {t('admin.professors.title')}
      </h2>

      <p className="mb-6 text-sm text-muted-foreground">
        {t('admin.professors.upload.csvFormatLabel')} <strong>{t('admin.professors.upload.csvFormatValue')}</strong>
      </p>

      <div
        onClick={() => professorFileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsProfessorDragActive(true) }}
        onDragLeave={() => setIsProfessorDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsProfessorDragActive(false)
          const file = e.dataTransfer.files?.[0]
          if (file) processProfessorCSV(file)
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isProfessorDragActive ? 'border-primary bg-primary/8' : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={professorFileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processProfessorCSV(e.target.files[0])}
        />
        <Upload className="mx-auto mb-3 text-muted-foreground" size={40} />
        <p className="font-semibold">{t('admin.professors.upload.dragOrClick')}</p>
        <p className="text-xs text-muted-foreground">{t('admin.professors.upload.maxSize')}</p>
      </div>

      {csvProfessors.length > 0 && (
        <div className="mt-6 space-y-3 animate-slideInDown">
          <p className="text-sm font-semibold">{t('admin.professors.upload.toImport', { count: csvProfessors.length })}</p>
          <button
            onClick={uploadProfessors}
            disabled={uploadingProfessors}
            className="w-full rounded-2xl bg-primary px-6 py-3 font-bold text-white hover:opacity-90 disabled:opacity-50 transition-smooth"
          >
            {uploadingProfessors ? t('admin.professors.upload.importing') : t('admin.professors.upload.importButton')}
          </button>
        </div>
      )}

      {uploadProfResult && (
        <div className={`mt-4 rounded-2xl border p-4 animate-slideInUp ${
          uploadProfResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <p className="font-bold text-sm">{uploadProfResult.message}</p>
          {uploadProfResult.created && (
            <p className="text-xs mt-1">{t('admin.professors.upload.summary', { created: uploadProfResult.created, skipped: uploadProfResult.skipped })}</p>
          )}
          {uploadProfResult.errors?.length && (
            <ul className="mt-2 text-xs space-y-1 ml-4">
              {uploadProfResult.errors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

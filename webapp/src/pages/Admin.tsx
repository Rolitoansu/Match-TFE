import { useState, useEffect, useRef } from 'react'
import {
  Shield, Tag, Upload, Plus, X, Trash2,
  FileSpreadsheet, CheckCircle2, AlertCircle,
  Users, Loader2, Search
} from 'lucide-react'
import adminApi from '../api/adminAxios'

interface TagItem {
  id: number
  name: string
}

interface CSVStudent {
  email: string
  name: string
  surname: string
}

interface UploadResult {
  success: boolean
  message: string
  created?: number
  skipped?: number
  errors?: string[]
}

export default function Admin() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [newTag, setNewTag] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [tagLoading, setTagLoading] = useState(false)
  const [tagError, setTagError] = useState<string | null>(null)
  const [tagSuccess, setTagSuccess] = useState<string | null>(null)

  const [csvStudents, setCsvStudents] = useState<CSVStudent[]>([])
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    setTagLoading(true)
    try {
      const { data } = await adminApi.get('/admin/tags')
      setTags(data.tags ?? [])
    } catch {
      setTagError('Error al cargar las etiquetas')
    } finally {
      setTagLoading(false)
    }
  }

  async function addTag() {
    const trimmed = newTag.trim()
    if (!trimmed) return

    if (tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setTagError('Esta etiqueta ya existe')
      return
    }

    setTagError(null)
    setTagSuccess(null)

    try {
      const { data } = await adminApi.post('/admin/tags', { name: trimmed })
      setTags(prev => [...prev, data.tag])
      setNewTag('')
      setTagSuccess(`Etiqueta "${trimmed}" creada correctamente`)
      setTimeout(() => setTagSuccess(null), 3000)
    } catch {
      setTagError('Error al crear la etiqueta')
    }
  }

  async function deleteTag(id: number, name: string) {
    try {
      await adminApi.delete(`/admin/tags/${id}`)
      setTags(prev => prev.filter(t => t.id !== id))
      setTagSuccess(`Etiqueta "${name}" eliminada`)
      setTimeout(() => setTagSuccess(null), 3000)
    } catch {
      setTagError('Error al eliminar la etiqueta')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadResult(null)
    setCsvFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      const students: CSVStudent[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim())
        if (cols.length >= 3 && cols[0]) {
          students.push({ email: cols[0], name: cols[1], surname: cols[2] })
        }
      }
      setCsvStudents(students)
    }
    reader.readAsText(file)
  }

  function clearCSV() {
    setCsvStudents([])
    setCsvFileName(null)
    setUploadResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadStudents() {
    if (csvStudents.length === 0) return
    setUploading(true)
    setUploadResult(null)

    try {
      const { data } = await adminApi.post('/admin/students/import', { students: csvStudents })
      setUploadResult({
        success: true,
        message: 'Importación completada',
        created: data.created,
        skipped: data.skipped,
        errors: data.errors
      })
    } catch {
      setUploadResult({
        success: false,
        message: 'Error al importar los estudiantes'
      })
    } finally {
      setUploading(false)
    }
  }

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  return (
    <div className="max-w-350 mx-auto p-6 lg:p-10">
      <div className="flex justify-between items-end mb-10 px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Shield className="text-primary" size={28} />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona etiquetas y datos de alumnos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6">
              <Tag className="text-primary" size={20} />
              Gestión de Etiquetas
            </h2>

            <div className="space-y-2 mb-6">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Nueva Etiqueta
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Ej: Machine Learning, Docker, React..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm"
                    value={newTag}
                    onChange={(e) => { setNewTag(e.target.value); setTagError(null) }}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <button
                  onClick={addTag}
                  className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  <Plus size={20} />
                </button>
              </div>

              {tagError && (
                <div className="flex items-center gap-2 text-xs font-medium text-red-600 mt-1">
                  <AlertCircle size={14} /> {tagError}
                </div>
              )}
              {tagSuccess && (
                <div className="flex items-center gap-2 text-xs font-medium text-green-600 mt-1">
                  <CheckCircle2 size={14} /> {tagSuccess}
                </div>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Buscar etiquetas..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-transparent focus:border-primary/50 focus:bg-white outline-none transition-all text-sm"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
            </div>

            <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
              {tagLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="animate-spin mr-2" size={20} />
                  <span className="text-sm">Cargando etiquetas...</span>
                </div>
              ) : filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl group hover:bg-red-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span className="text-primary">#</span>
                      {tag.name}
                    </span>
                    <button
                      onClick={() => deleteTag(tag.id, tag.name)}
                      className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Tag size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">
                    {tagSearch ? 'No se encontraron etiquetas' : 'No hay etiquetas aún'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground text-center">
              {tags.length} etiqueta{tags.length !== 1 ? 's' : ''} en total
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6">
              <Users className="text-primary" size={20} />
              Importar Alumnos
            </h2>

            <p className="text-sm text-muted-foreground mb-6">
              Sube un fichero CSV con las columnas: <strong>correo, nombre, apellidos</strong>
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload
                size={40}
                className="mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors"
              />
              <p className="text-sm font-semibold text-foreground">
                {csvFileName ? csvFileName : 'Haz clic o arrastra un archivo CSV'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formato: correo,nombre,apellidos
              </p>
            </div>

            {csvStudents.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-primary" />
                    {csvStudents.length} alumno{csvStudents.length !== 1 ? 's' : ''} detectado{csvStudents.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={clearCSV}
                    className="text-xs font-medium text-muted-foreground hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <X size={14} /> Limpiar
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Correo
                        </th>
                        <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Nombre
                        </th>
                        <th className="text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Apellidos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvStudents.slice(0, 50).map((s, i) => (
                        <tr key={i} className="border-t border-border/50 hover:bg-slate-50/50">
                          <td className="px-4 py-2 text-foreground/80">{s.email}</td>
                          <td className="px-4 py-2 text-foreground/80">{s.name}</td>
                          <td className="px-4 py-2 text-foreground/80">{s.surname}</td>
                        </tr>
                      ))}
                      {csvStudents.length > 50 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-center text-xs text-muted-foreground">
                            ... y {csvStudents.length - 50} más
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={uploadStudents}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Importar Alumnos
                    </>
                  )}
                </button>
              </div>
            )}

            {uploadResult && (
              <div className={`mt-4 p-4 rounded-2xl border ${
                uploadResult.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {uploadResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {uploadResult.message}
                </div>
                {uploadResult.success && (
                  <p className="text-xs ml-6">
                    {uploadResult.created} creado{uploadResult.created !== 1 ? 's' : ''} · {uploadResult.skipped} omitido{uploadResult.skipped !== 1 ? 's' : ''}
                  </p>
                )}
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <ul className="text-xs ml-6 mt-1 space-y-0.5">
                    {uploadResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
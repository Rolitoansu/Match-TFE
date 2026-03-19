import { useState, useRef, useEffect } from 'react'
import { Tag, Plus, Trash2, Edit2, FileSpreadsheet, Save, Upload, Loader2 } from 'lucide-react'
import adminApi from '../../api/adminAxios'
import type { TagItem, UploadResult } from '../../utils/adminHelpers'
import { validateCSVFile, splitCSVLine, normalizeCSVText } from '../../utils/adminHelpers'

export function AdminTagsTab() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [newTag, setNewTag] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [tagLoading, setTagLoading] = useState(false)
  const [editingTagId, setEditingTagId] = useState<number | null>(null)
  const [editingTagName, setEditingTagName] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set())
  const [csvTags, setCsvTags] = useState<{ name: string }[]>([])
  const [uploadingTags, setUploadingTags] = useState(false)
  const [uploadTagsResult, setUploadTagsResult] = useState<UploadResult | null>(null)
  const tagFileInputRef = useRef<HTMLInputElement>(null)
  const [isTagDragActive, setIsTagDragActive] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    setTagLoading(true)
    try {
      const { data } = await adminApi.get('/admin/tags')
      setTags(data.tags ?? [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setTagLoading(false)
    }
  }

  async function addTag() {
    const trimmed = newTag.trim()
    if (!trimmed) return

    if (tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta etiqueta ya existe')
      return
    }

    try {
      const { data } = await adminApi.post('/admin/tags', { name: trimmed })
      setTags(prev => [...prev, data.tag])
      setNewTag('')
    } catch {
      alert('Error al crear la etiqueta')
    }
  }

  async function saveEditTag(id: number) {
    const trimmed = editingTagName.trim()
    if (!trimmed) return

    try {
      const { data } = await adminApi.patch(`/admin/tags/${id}`, { name: trimmed })
      setTags(prev => prev.map(t => t.id === id ? data.tag : t))
      setEditingTagId(null)
      setEditingTagName('')
    } catch {
      alert('Error al actualizar la etiqueta')
    }
  }

  async function deleteTag(id: number, name: string) {
    if (!confirm(`¿Eliminar la etiqueta "${name}"?`)) return
    try {
      await adminApi.delete(`/admin/tags/${id}`)
      setTags(prev => prev.filter(t => t.id !== id))
      setSelectedTags(prev => {
        const updated = new Set(prev)
        updated.delete(id)
        return updated
      })
    } catch {
      alert('Error al eliminar la etiqueta')
    }
  }

  async function deleteSelectedTags() {
    if (selectedTags.size === 0) return
    if (!confirm(`¿Eliminar ${selectedTags.size} etiqueta${selectedTags.size !== 1 ? 's' : ''}?`)) return

    try {
      for (const id of selectedTags) {
        await adminApi.delete(`/admin/tags/${id}`)
      }
      setTags(prev => prev.filter(t => !selectedTags.has(t.id)))
      setSelectedTags(new Set())
    } catch {
      alert('Error al eliminar etiquetas')
    }
  }

  async function processTagsCSV(file: File) {
    const fileError = validateCSVFile(file)
    if (fileError) {
      setUploadTagsResult({ success: false, message: fileError })
      return
    }

    const text = normalizeCSVText(await file.text())
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l)

    if (lines.length < 2) {
      setUploadTagsResult({ success: false, message: 'El CSV debe incluir cabecera y al menos una fila' })
      return
    }

    const parsedTags: { name: string }[] = []
    const invalidRows: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i])
      const name = cols[0]

      if (!name || name.length > 100) {
        invalidRows.push(`Fila ${i + 1}: nombre invalido`)
        continue
      }

      parsedTags.push({ name })
    }

    if (parsedTags.length === 0) {
      setUploadTagsResult({ success: false, message: 'No hay filas validas' })
      return
    }

    if (invalidRows.length > 0) {
      setUploadTagsResult({ success: false, message: `Hay ${invalidRows.length} filas invalidas`, errors: invalidRows.slice(0, 5) })
    }

    setCsvTags(parsedTags)
  }

  async function uploadTags() {
    if (csvTags.length === 0) return
    setUploadingTags(true)
    setUploadTagsResult(null)

    try {
      const { data } = await adminApi.post('/admin/tags/import', { tags: csvTags })
      setUploadTagsResult({ success: true, message: 'Importación completada', created: data.created, skipped: data.skipped, errors: data.errors })
      setCsvTags([])
      await fetchTags()
    } catch {
      setUploadTagsResult({ success: false, message: 'Error al importar' })
    } finally {
      setUploadingTags(false)
    }
  }

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Plus className="text-primary" size={20} />
          Crear Etiqueta
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nombre de la etiqueta"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
          />
          <button
            onClick={addTag}
            className="rounded-xl bg-primary px-6 py-2 font-semibold text-white hover:opacity-90 transition-smooth"
          >
            Crear
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Tag className="text-primary" size={20} />
            Etiquetas ({filteredTags.length})
          </h2>
          <input
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Buscar..."
            className="max-w-xs rounded-xl border border-input bg-background px-3 py-2 text-sm transition-smooth"
          />
        </div>

        {tagLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : filteredTags.length > 0 ? (
          <>
            {selectedTags.size > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 p-3 border border-red-200 animate-slideInDown">
                <span className="text-sm font-semibold text-red-700">{selectedTags.size} etiqueta{selectedTags.size !== 1 ? 's' : ''} seleccionada{selectedTags.size !== 1 ? 's' : ''}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTags(new Set())}
                    className="rounded px-3 py-1 bg-red-200 text-red-800 text-xs hover:bg-red-300 transition-smooth"
                  >
                    Deseleccionar
                  </button>
                  <button
                    onClick={deleteSelectedTags}
                    className="rounded px-3 py-1 bg-red-500 text-white text-xs hover:opacity-90 transition-smooth"
                  >
                    Eliminar seleccionadas
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {filteredTags.map(tag => (
                <div key={tag.id} className={`flex items-center justify-between rounded-lg p-3 transition-smooth ${
                  selectedTags.has(tag.id) ? 'bg-red-50 border border-red-200' : 'bg-muted'
                }`}>
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedTags.has(tag.id)}
                      onChange={(e) => {
                        const updated = new Set(selectedTags)
                        if (e.target.checked) {
                          updated.add(tag.id)
                        } else {
                          updated.delete(tag.id)
                        }
                        setSelectedTags(updated)
                      }}
                      className="w-4 h-4 cursor-pointer accent-red-500 transition-smooth"
                    />
                    {editingTagId === tag.id ? (
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        className="flex-1 rounded border border-input bg-background px-3 py-1 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{tag.name}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingTagId === tag.id ? (
                      <button
                        onClick={() => saveEditTag(tag.id)}
                        className="rounded px-3 py-1 bg-green-500 text-white text-sm hover:opacity-90 transition-smooth"
                      >
                        <Save size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingTagId(tag.id)
                          setEditingTagName(tag.name)
                        }}
                        className="rounded px-3 py-1 bg-blue-500 text-white text-sm hover:opacity-90 transition-smooth"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteTag(tag.id, tag.name)}
                      className="rounded px-3 py-1 bg-red-500 text-white text-sm hover:opacity-90"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">No hay etiquetas</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <FileSpreadsheet className="text-primary" size={20} />
          Importar Etiquetas (CSV)
        </h2>

        <div
          onClick={() => tagFileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsTagDragActive(true) }}
          onDragLeave={() => setIsTagDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsTagDragActive(false)
            const file = e.dataTransfer.files?.[0]
            if (file) processTagsCSV(file)
          }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isTagDragActive ? 'border-primary bg-primary/8' : 'border-border hover:border-primary/50'
          }`}
        >
          <input
            ref={tagFileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processTagsCSV(e.target.files[0])}
          />
          <Upload className="mx-auto mb-2 text-muted-foreground" size={32} />
          <p className="font-semibold">Arrastra o haz clic para seleccionar</p>
          <p className="text-xs text-muted-foreground">Formato: nombre</p>
        </div>

        {csvTags.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold">{csvTags.length} etiqueta{csvTags.length !== 1 ? 's' : ''} a importar</p>
            <button
              onClick={uploadTags}
              disabled={uploadingTags}
              className="w-full rounded-2xl bg-primary px-6 py-3 font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {uploadingTags ? 'Importando...' : 'Importar Etiquetas'}
            </button>
          </div>
        )}

        {uploadTagsResult && (
          <div className={`mt-4 rounded-2xl border p-4 animate-slideInUp ${
            uploadTagsResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <p className="font-bold text-sm">{uploadTagsResult.message}</p>
            {uploadTagsResult.errors?.length && (
              <ul className="mt-2 text-xs space-y-1 ml-4">
                {uploadTagsResult.errors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

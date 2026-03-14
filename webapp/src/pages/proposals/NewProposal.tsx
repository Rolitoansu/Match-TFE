import { 
  ArrowLeft, 
  Send, 
  X, 
  Hash, 
  BookOpen, 
  Settings,
  ChevronDown
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'

interface TFEProposalInfo {
  title: string
  description: string
  type: number
  tags?: string[]
}

interface TFEErrors {
  titleError: string | null
  descriptionError: string | null
  typeError: string | null
}

export default function NewProposal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposalInfo, setProposalInfo] = useState<TFEProposalInfo>({ title: '', description: '', type: 0 })
  const [errors, setErrors] = useState<TFEErrors>({ titleError: null, descriptionError: null, typeError: null })
  const [allowedTags, setAllowedTags] = useState<string[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tagInputFocused, setTagInputFocused] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const targetRolePluralLabel = user?.role === 'student' ? 'profesores' : 'estudiantes'

  useEffect(() => {
    api.get('/project/tags')
      .then(({ data }) => setAllowedTags(data.tags.map((t: { name: string }) => t.name)))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(tagSearch), 300)
    return () => clearTimeout(timer)
  }, [tagSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        tagInputRef.current && !tagInputRef.current.contains(e.target as Node) &&
        suggestionRef.current && !suggestionRef.current.contains(e.target as Node)
      ) {
        setTagInputFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function highlightMatch(text: string, query: string) {
    if (!query.trim()) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
      <span>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-primary rounded px-0.5">{text.slice(idx, idx + query.trim().length)}</mark>
        {text.slice(idx + query.trim().length)}
      </span>
    )
  }

  function toggleTag(tag: string) {
    const current = proposalInfo.tags ?? []
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    setProposalInfo({ ...proposalInfo, tags: updated })
  }

  function updateTitle(title: string) {
    setErrors(prev => ({ ...prev, titleError: title ? null : 'blank' }))
    setProposalInfo({ ...proposalInfo, title })
  }

  function updateDescription(description: string) {
    setErrors(prev => ({ ...prev, descriptionError: description ? null : 'blank' }))
    setProposalInfo({ ...proposalInfo, description })
  }

  function updateType(type: number) {
    setErrors(prev => ({ ...prev, typeError: type ? null : 'blank' }))
    setProposalInfo({ ...proposalInfo, type })
  }

  async function submitProposal() {
    const newErrors = {
      titleError: proposalInfo.title?.trim() ? null : 'blank',
      descriptionError: proposalInfo.description?.trim() ? null : 'blank',
      typeError: proposalInfo.type ? null : 'blank'
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    
    if (Object.values(newErrors).some(error => error !== null)) return

    try {
      const data = {
        ...proposalInfo,
        title: proposalInfo.title.trim(),
        description: proposalInfo.description.trim()
      }

      await api.post('/project/proposals', data)     
      navigate(-1)
    } catch (error) {
      console.error('Error al enviar:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <button 
        onClick={() => navigate('/proposals')}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Volver a propuestas</span>
      </button>
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Crear Nueva Propuesta</h1>
        <p className="text-muted-foreground mt-2">
          Define tu idea de TFG para que los {targetRolePluralLabel} interesados puedan encontrarte.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-3xl p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Título del Proyecto
              </label>
              <input
                type="text" 
                placeholder="Ej: Desarrollo de una herramienta de análisis para..."
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all text-lg font-semibold"
                value={proposalInfo.title} 
                onChange={(e) => updateTitle(e.target.value)} 
                required
              />
              <div className="text-xs font-medium text-red-600 mt-1">
                {errors.titleError === 'blank' && 'El título es obligatorio.'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Descripción y Objetivos
              </label>
              <textarea
                rows={6}
                placeholder="Explica brevemente de qué trata el proyecto, las tecnologías a usar y qué esperas del alumno..."
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm leading-relaxed"
                value={proposalInfo.description}
                onChange={(e) => updateDescription(e.target.value)}
              ></textarea>
              <div className="text-xs font-medium text-red-600 mt-1">
                {errors.descriptionError === 'blank' && 'La descripción es obligatoria.'}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                <Hash size={12} /> Tecnologías e Intereses vinculados
              </label>
              {(proposalInfo.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(proposalInfo.tags ?? []).map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-bold border border-primary/20 animate-in fade-in slide-in-from-top-1 duration-150">
                      {tag}
                      <button type="button" onClick={() => toggleTag(tag)} className="p-0.5 hover:bg-primary/20 rounded-md transition-colors">
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={15} />
                <input
                  ref={tagInputRef}
                  type="text"
                  placeholder="Buscar y añadir tecnologías..."
                  className={`w-full pl-10 pr-9 py-3 rounded-xl bg-slate-50 border transition-all text-sm outline-none ${
                    tagInputFocused
                      ? 'border-primary/50 bg-white ring-4 ring-primary/5'
                      : 'border-transparent hover:border-border'
                  }`}
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  onFocus={() => setTagInputFocused(true)}
                  autoComplete="off"
                />
                <ChevronDown
                  size={15}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform duration-200 ${
                    tagInputFocused ? 'rotate-180' : ''
                  }`}
                />
                {tagInputFocused && (() => {
                  const selectedSet = new Set(proposalInfo.tags ?? [])
                  const filtered = allowedTags.filter(
                    tag => !selectedSet.has(tag) &&
                      (!debouncedSearch.trim() || tag.toLowerCase().includes(debouncedSearch.trim().toLowerCase()))
                  )
                  const searching = debouncedSearch.trim().length > 0

                  return (
                    <div
                      ref={suggestionRef}
                      className="absolute z-60 bottom-full left-0 right-0 mb-1.5 bg-white border border-border rounded-2xl shadow-xl shadow-slate-200/70 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {searching ? 'Resultados' : 'Disponibles'}
                        </span>
                        {filtered.length > 0 && (
                          <span className="text-[10px] font-semibold text-muted-foreground bg-slate-100 rounded-full px-2 py-0.5">
                            {filtered.length}
                          </span>
                        )}
                      </div>
                      {filtered.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto">
                          {filtered.map((tag, i) => (
                            <button
                              key={tag}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { toggleTag(tag); setTagSearch('') }}
                              className={`w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-colors ${
                                i !== filtered.length - 1 ? 'border-b border-border/40' : ''
                              }`}
                            >
                              {highlightMatch(tag, debouncedSearch)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            {searching
                              ? `No hay tecnologías que coincidan con «${debouncedSearch}».`
                              : 'Ya has añadido todas las tecnologías disponibles.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
              onClick={submitProposal}
            >
              Publicar Propuesta
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-slate-50 border border-border rounded-3xl p-6 space-y-6">
            <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
              <Settings size={18} className="text-primary" />
              Configuración
            </h3>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <BookOpen size={12} /> Tipo de Trabajo
              </label>
              <select className="w-full p-3 rounded-xl border border-border bg-white text-sm font-medium outline-none focus:border-primary"
                value={proposalInfo.type}
                onChange={(e) => updateType(Number(e.target.value))}
              >
                <option value="0">-- Seleccionar tipo --</option>
                <option value="1">Desarrollo de Software</option>
                <option value="2">Investigación</option>
              </select>
              <div className="text-xs font-medium text-red-600 mt-1">
                {errors.typeError === 'blank' && 'El tipo de trabajo es obligatorio.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
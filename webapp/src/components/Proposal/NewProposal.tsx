import { 
  ArrowLeft, 
  Send, 
  Plus, 
  X, 
  Info, 
  Hash, 
  BookOpen, 
  Users,
  AlertCircle,
  Settings
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const NewProposal = () => {
  const navigate = useNavigate()
  const [tags, setTags] = useState<string[]>(['DLP', 'React'])
  const [inputValue, setInputValue] = useState('')

  const addTag = () => {
    if (inputValue && !tags.includes(inputValue)) {
      setTags([...tags, inputValue])
      setInputValue('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Volver al perfil</span>
      </button>

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Crear Nueva Propuesta</h1>
        <p className="text-muted-foreground mt-2">
          Define tu idea de TFG para que los estudiantes interesados puedan encontrarte.
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
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Descripción y Objetivos
              </label>
              <textarea 
                rows={6}
                placeholder="Explica brevemente de qué trata el proyecto, las tecnologías a usar y qué esperas del alumno..."
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm leading-relaxed"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Tecnologías e Intereses vinculados
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-bold border border-primary/10">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="p-0.5 hover:bg-primary/20 rounded-md transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Añadir tecnología (ej: Python, Docker...)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:border-primary/50 focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
                <button 
                  onClick={addTag}
                  className="p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button className="px-6 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              Descartar
            </button>
            <button className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all">
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
                <Users size={12} /> Capacidad de Alumnos
              </label>
              <select className="w-full p-3 rounded-xl border border-border bg-white text-sm font-medium outline-none focus:border-primary">
                <option>1 Estudiante (Individual)</option>
                <option>2 Estudiantes (Pareja)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <BookOpen size={12} /> Tipo de Trabajo
              </label>
              <select className="w-full p-3 rounded-xl border border-border bg-white text-sm font-medium outline-none focus:border-primary">
                <option>Desarrollo de Software</option>
                <option>Investigación Teórica</option>
                <option>Análisis de Datos / IA</option>
                <option>Ciberseguridad</option>
              </select>
            </div>

            <hr className="border-border/60" />

            <div className="flex gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <Info size={20} className="text-blue-500 shrink-0" />
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Esta propuesta será visible para todos los alumnos en la sección <b>Explorar</b>. Podrás filtrar candidatos por sus intereses.
              </p>
            </div>
          </div>

          <div className="p-4 flex items-start gap-3 text-orange-600 bg-orange-50 rounded-2xl border border-orange-100">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium">
              Recuerda que los títulos definitivos deben ser validados por la comisión académica de la EPI Gijón.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
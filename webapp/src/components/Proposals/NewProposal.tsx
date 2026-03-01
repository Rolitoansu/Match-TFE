import { 
  ArrowLeft, 
  Send, 
  Plus, 
  X, 
  Hash, 
  BookOpen, 
  Settings
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

interface TFEProposalInfo {
  title: string
  description: string
  tags?: string[]
}

export default function NewProposal() {
  const navigate = useNavigate()
  const [proposalInfo, setProposalInfo] = useState<TFEProposalInfo>({ title: '', description: '' })

  const removeTag = (tagToRemove: string) => {
    setProposalInfo({
      ...proposalInfo,
      tags: proposalInfo.tags?.filter(tag => tag !== tagToRemove)
    })
  }

  const submitProposal = async () => {
    await api.post('/project/proposals', proposalInfo)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <button 
        onClick={() => navigate('/proposals')}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-semibold">Volver</span>
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
                value={proposalInfo.title} 
                onChange={(e) => setProposalInfo({ ...proposalInfo, title: e.target.value })} 
                required
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
                value={proposalInfo.description}
                onChange={(e) => setProposalInfo({ ...proposalInfo, description: e.target.value })}
              ></textarea>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Tecnologías e Intereses vinculados
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {proposalInfo.tags?.map(tag => (
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
                    placeholder="Añadir tecnología (ej: Python, Docker...)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:border-primary/50 focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
                <button 
                  className="p-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  <Plus size={20} />
                </button>
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
              <select className="w-full p-3 rounded-xl border border-border bg-white text-sm font-medium outline-none focus:border-primary">
                <option>-- Seleccionar tipo --</option>
                <option>Desarrollo de Software</option>
                <option>Investigación</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
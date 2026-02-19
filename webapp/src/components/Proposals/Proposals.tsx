import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  MoreVertical, 
  Users, 
  ArrowUpRight,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ALL_PROPOSALS = [
  {
    id: 1,
    title: "Análisis de sentimientos en asturiano usando Transformers",
    status: "Abierto",
    applicants: 3,
    lastActivity: "Hace 2 horas",
    type: "Investigación"
  },
  {
    id: 2,
    title: "Optimización de hiperparámetros en modelos LLM",
    status: "En curso",
    applicants: 1,
    lastActivity: "Ayer",
    type: "Software"
  },
  {
    id: 3,
    title: "Detección de sesgos cognitivos mediante IA",
    status: "Abierto",
    applicants: 5,
    lastActivity: "Hace 3 días",
    type: "Análisis"
  }
]

export const Proposals = () => {
  const navigate = useNavigate()

  return (
    <div className="max-w-300 mx-auto p-6 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Propuestas</h1>
          <p className="text-muted-foreground mt-1">Administra tus temas de TFG y revisa las solicitudes de los alumnos.</p>
        </div>
        
        <button 
          onClick={() => navigate('/proposals/new')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          Nueva Propuesta
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título o tecnología..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-border rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            Filtros
          </button>
        </div>
      </div>

      <div className="flex gap-8 border-b border-border mb-8 overflow-x-auto">
        {['Todas', 'Abiertas', 'En curso', 'Finalizadas'].map((tab, index) => (
          <button 
            key={tab}
            className={`pb-4 text-sm font-bold transition-all relative ${
              index === 0 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {index === 0 && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ALL_PROPOSALS.map((tfg) => (
          <div 
            key={tfg.id} 
            className="group bg-white border border-border rounded-3xl p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  tfg.status === 'Abierto' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <FileText size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {tfg.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Clock size={14} /> {tfg.lastActivity}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <CheckCircle2 size={14} /> {tfg.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-50">
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5 justify-center">
                      <Users size={16} className="text-primary" />
                      {tfg.applicants}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Interesados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">{tfg.status}</p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Estado</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
                    onClick={() => navigate(`/proposals/mock`)}>
                    Ver Detalles
                    <ArrowUpRight size={14} />
                  </button>
                  <button className="p-2 text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
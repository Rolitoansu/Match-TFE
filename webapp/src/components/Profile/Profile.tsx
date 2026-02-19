import { 
  User, Settings, Mail, Hash, PencilLine,
  FileText, Plus, Calendar, ChevronRight,
  Users
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const USER_DATA = {
  name: "Mario Farpón",
  role: "Profesor",
  department: "Ciencias de la Computación",
  email: "farponmario@uniovi.es",
  bio: "Investigador en procesamiento de lenguaje natural y aprendizaje automático. Busco estudiantes motivados para explorar nuevas fronteras en DLP.",
  interests: ["DLP", "Deep Learning", "Transformers", "Python"],
  stats: { matches: 12, proposals: 3, messages: 8 }
}

const MY_PROPOSALS = [
  {
    id: 1,
    title: "Análisis de sentimientos en asturiano usando Transformers",
    status: "Abierto",
    date: "Publicado hace 2 días",
    applicants: 3,
    tags: ["DLP", "Python"]
  },
  {
    id: 2,
    title: "Optimización de hiperparámetros en modelos LLM",
    status: "En curso",
    date: "Publicado hace 1 semana",
    applicants: 1,
    tags: ["Deep Learning"]
  },
  {
    id: 3,
    title: "Detección de sesgos cognitivos mediante IA",
    status: "Abierto",
    date: "Publicado hace 2 semanas",
    applicants: 5,
    tags: ["Transformers", "Research"]
  }
]

export const Profile = () => {
    const navigate = useNavigate()
    
    return (
        <div className="max-w-350 mx-auto p-6 lg:p-10">
        <div className="flex justify-between items-end mb-10 px-2">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mi Panel de Control</h1>
            <p className="text-muted-foreground mt-1 text-sm">Gestiona tu perfil y tus propuestas de TFG</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                onClick={() => navigate('/proposals/new')}>
            <Plus size={18} />
            Nueva Propuesta
            </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-4 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <div className="h-28 w-28 rounded-3xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <User size={56} strokeWidth={1.5} />
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white border border-border rounded-xl shadow-sm text-primary hover:bg-primary hover:text-white transition-colors">
                    <PencilLine size={16} />
                    </button>
                </div>
                
                <h2 className="text-2xl font-bold">{USER_DATA.name}</h2>
                <p className="text-primary font-semibold text-sm mb-1">{USER_DATA.role}</p>
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">{USER_DATA.department}</p>
                
                <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-secondary/50 rounded-full text-xs text-muted-foreground">
                    <Mail size={12} />
                    <span>{USER_DATA.email}</span>
                </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-2 border-y border-border/50 py-6 text-center">
                <div>
                    <p className="text-lg font-bold">{USER_DATA.stats.matches}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Matches</p>
                </div>
                <div className="border-x border-border/50">
                    <p className="text-lg font-bold">{USER_DATA.stats.proposals}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">TFGs</p>
                </div>
                <div>
                    <p className="text-lg font-bold">{USER_DATA.stats.messages}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Chats</p>
                </div>
                </div>

                <div className="mt-8 space-y-6">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
                    Sobre mí <PencilLine size={12} className="cursor-pointer" />
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground/80 italic">
                    "{USER_DATA.bio}"
                    </p>
                </div>

                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Intereses</h3>
                    <div className="flex flex-wrap gap-2">
                    {USER_DATA.interests.map((tag) => (
                        <span key={tag} className="flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-[11px] font-bold text-foreground border border-border">
                        <Hash size={10} className="text-primary" />
                        {tag}
                        </span>
                    ))}
                    </div>
                </div>
                </div>
            </div>
            </div>
            <div className="xl:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="text-primary" size={20} />
                Mis TFGs Publicados
                </h3>
                <div className="flex gap-2">
                <button className="p-2 text-muted-foreground hover:text-primary transition-colors"><Settings size={18}/></button>
                </div>
            </div>

            <div className="grid gap-4">
                {MY_PROPOSALS.map((tfg) => (
                <div key={tfg.id} className="group bg-card border border-border rounded-3xl p-6 hover:border-primary/40 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tfg.status === 'Abierto' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {tfg.status}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Calendar size={12} /> {tfg.date}
                        </span>
                        </div>
                        
                        <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {tfg.title}
                        </h4>

                        <div className="flex flex-wrap gap-2">
                        {tfg.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-secondary rounded text-muted-foreground">
                            #{tag}
                            </span>
                        ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-8">
                        <div className="text-center">
                        <div className="flex items-center gap-1.5 text-primary mb-1 justify-center">
                            <Users size={16} />
                            <span className="text-lg font-black">{tfg.applicants}</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Candidatos</p>
                        </div>
                        <button className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                        </button>
                    </div>
                    </div>
                </div>
                ))}
            </div>

            {MY_PROPOSALS.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-border">
                <FileText size={48} className="text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">Aún no has publicado ninguna propuesta</p>
                <button className="mt-4 text-primary font-bold text-sm hover:underline">Crear mi primera propuesta</button>
                </div>
            )}
            </div>
        </div>
        </div>
    )
}
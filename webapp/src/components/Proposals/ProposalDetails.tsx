import { 
  ArrowLeft, BookOpen, MessageSquare, 
  Hash, GraduationCap, UserCheck 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PROPOSAL_DATA = {
  id: 1,
  title: "Sistema de monitorización de calidad del aire con LoRaWAN",
  author: {
    name: "Lucía García",
    role: "ALUMNO",
    avatar: null,
  },
  description: "Tengo una idea para desplegar una red de sensores de bajo coste por el campus de Gijón. Busco un tutor que me oriente en la parte de protocolos de red y almacenamiento en bases de datos de series temporales.",
  requirements: ["Electrónica básica", "C++ / Arduino", "Interés en Smart Cities"],
  status: "Buscando Tutor",
  capacity: "Propuesta de Alumno",
  publishedAt: "18 Feb 2026",
  tags: ["IoT", "LoRaWAN", "Hardware", "Smart Cities"]
}

export default function ProposalDetails() {
  const navigate = useNavigate()
  const isAlumno = PROPOSAL_DATA.author.role === "ALUMNO"

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 pb-32">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-semibold">
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                isAlumno ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isAlumno ? '💡 Idea de Alumno' : '🎓 Proyecto de Profesor'}
              </span>
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{PROPOSAL_DATA.publishedAt}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
              {PROPOSAL_DATA.title}
            </h1>
          </div>

          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <BookOpen size={16} /> {isAlumno ? '¿En qué consiste mi idea?' : 'Descripción del Proyecto'}
            </h3>
            <p className="text-foreground/80 leading-relaxed text-lg">
              {PROPOSAL_DATA.description}
            </p>
          </section>

          <div className="flex flex-wrap gap-2">
            {PROPOSAL_DATA.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-border rounded-xl text-xs font-bold text-foreground">
                <Hash size={14} className="text-primary" /> {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-border rounded-3xl p-8 shadow-sm space-y-6 sticky top-8">
            
            <div className="space-y-4 text-center">
              <div className="mx-auto h-20 w-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                {isAlumno ? <GraduationCap size={40} /> : <UserCheck size={40} />}
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Publicado por</p>
                <h4 className="text-xl font-bold">{PROPOSAL_DATA.author.name}</h4>
                <p className="text-sm text-primary font-medium">{isAlumno ? 'Estudiante de Ingeniería' : 'Departamento de C.C.'}</p>
              </div>
            </div>

            <hr className="border-border/60" />

            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                <MessageSquare size={20} />
                {isAlumno ? 'Contactar con Alumno' : 'Solicitar este TFG'}
              </button>
              
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase text-center">
                  {isAlumno 
                    ? "Si eres profesor, puedes ofrecerte como tutor para esta idea."
                    : "Si eres alumno, puedes enviar tu perfil para que el profesor te acepte."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
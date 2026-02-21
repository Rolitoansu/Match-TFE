import { 
  GraduationCap, 
  ChevronDown, 
  BookOpen 
} from 'lucide-react'

const MOCK_PROFILE = {
  name: "Mario Farpón",
  department: "Ciencias de la Computacion",
  bio: "Investigador en procesamiento de lenguaje natural y aprendizaje automatico. Busco estudiantes motivados para explorar nuevas fronteras en DLP.",
  interests: ["DLP", "Deep Learning", "Transformers", "Python"],
  profileCount: 6
}

export default function Explore() {
    return (
        <main className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md overflow-hidden rounded-4xl border border-border bg-card shadow-2xl shadow-gray-200/50">
          
          <div className="flex aspect-square flex-col items-center justify-end bg-primary/5 pb-8 relative">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap size={64} strokeWidth={1.5} />
            </div>
            
            <div className="mt-6 text-center">
              <h2 className="text-3xl font-bold text-foreground">{MOCK_PROFILE.name}</h2>
              <p className="text-muted-foreground">{MOCK_PROFILE.department}</p>
            </div>
          </div>

          <div className="p-8">
            <p className="text-sm leading-relaxed text-foreground/80">
              {MOCK_PROFILE.bio}
            </p>

            <div className="mt-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Intereses
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {MOCK_PROFILE.interests.map((tag) => (
                  <span 
                    key={tag} 
                    className="rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-foreground border border-border/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button className="mt-8 flex items-center gap-2 font-bold text-primary transition-opacity hover:opacity-80">
              <BookOpen size={18} />
              <span className="text-xs uppercase tracking-wider">Propuestas de TFG</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </main>
    )
}
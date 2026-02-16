import { Flame, MessageCircle, User } from 'lucide-react'

export const Navbar = () => {
    return (
        <nav className="fixed bottom-0 flex w-full border-t border-border bg-card/80 px-6 py-4 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-md justify-between items-center">
                <button className="flex flex-col items-center gap-1 text-primary">
                    <Flame size={24} fill="currentColor" className="opacity-20" />
                    <Flame size={24} className="absolute" />
                    <span className="text-[10px] font-bold uppercase">Explorar</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle size={24} />
                    <span className="text-[10px] font-bold uppercase">Matches</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <User size={24} />
                    <span className="text-[10px] font-bold uppercase">Perfil</span>
                </button>
            </div>
        </nav>
    )
}
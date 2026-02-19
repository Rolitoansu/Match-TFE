import { 
  Flame, 
  MessageCircle, 
  User, 
  FileText 
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavbarItem {
    name: string
    route: string
    icon: React.ElementType
}

export const Navbar = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const items: NavbarItem[] = [
        {
            name: "Explorar",
            route: "/home",
            icon: Flame,
        },
        {
            name: "Propuestas",
            route: "/proposals",
            icon: FileText,
        },
        {
            name: "Chat",
            route: "/chat",
            icon: MessageCircle,
        },
        {
            name: "Perfil",
            route: "/profile",
            icon: User,
        }
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 flex w-full border-t bg-white/80 px-6 py-3 pb-3 backdrop-blur-lg z-100">
            <div className="mx-auto flex w-full max-w-md justify-between items-center">
                {items.map((item) => {
                    const isActive = location.pathname === item.route || location.pathname.startsWith(item.route + '/')
                    const Icon = item.icon

                    return (
                        <button 
                            key={item.name} 
                            className="flex flex-col items-center gap-1 group transition-all active:scale-90"
                            onClick={() => navigate(item.route)}>

                            <div className={`
                                px-5 py-1.5 rounded-2xl transition-all duration-300
                                ${isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground group-hover:bg-secondary'}
                            `}>
                                <Icon 
                                    size={24} 
                                    strokeWidth={isActive ? 2.5 : 2} 
                                    className="transition-transform"
                                />
                            </div>

                            <span className={`
                                text-[10px] font-black uppercase tracking-tighter transition-colors
                                ${isActive ? 'text-primary' : 'text-muted-foreground'}
                            `}>
                                {item.name}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
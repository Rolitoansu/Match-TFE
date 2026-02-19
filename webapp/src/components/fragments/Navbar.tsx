import { Flame, MessageCircle, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavbarProp {
    name: string
    route: string
    icon: React.ReactNode
    active_icon: React.ReactNode
}

export const Navbar = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const items: NavbarProp[] = [
        {
            name: "Explorar",
            route: "/home",
            icon: <Flame size={24} />,
            active_icon: <Flame size={24} fill="currentColor" className="text-primary" />,
        },
        {
            name: "Chat",
            route: "/chat",
            icon: <MessageCircle size={24} />,
            active_icon: <MessageCircle size={24} fill="currentColor" className="text-primary" />
        },
        {
            name: "Perfil",
            route: "/profile",
            icon: <User size={24} />,
            active_icon: <User size={24} fill="currentColor" className="text-primary" />
        }
    ]

    return (
        <nav className="sticky bottom-0 flex w-full border-t px-6 py-4 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-md justify-between items-center">
                {items.map((item) => (
                    <button 
                        key={item.name} 
                        className={`flex flex-col items-center gap-1 ${item.route === location.pathname ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={() => navigate(`/${item.route}`)}>
                        {item.route === location.pathname ? item.active_icon : item.icon}
                        <span className="text-[10px] font-bold uppercase">{item.name}</span>
                    </button>
                ))}
            </div>
        </nav>
    )
}
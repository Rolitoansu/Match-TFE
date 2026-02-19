import { 
  Send, 
  MoreVertical,
  ChevronLeft,
  Paperclip,
  Info,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'

const CONVERSATIONS = [
  { id: 1, name: "Lucía García", lastMsg: "Me parece genial la idea de usar LoRaWAN", time: "12:45", online: true, role: "Alumno" },
  { id: 2, name: "Mario Farpón", lastMsg: "¿Has revisado la documentación de BERT?", time: "Ayer", online: false, role: "Profesor" },
  { id: 3, name: "Carlos Menéndez", lastMsg: "Mañana te envío el borrador", time: "Lun", online: true, role: "Alumno" },
]

const MOCK_MESSAGES = [
  { id: 1, senderId: 'other', text: "Hola! He visto tu propuesta sobre el análisis de sentimientos en asturiano.", time: "12:00" },
  { id: 2, senderId: 'me', text: "¡Hola Lucía! Sí, estoy buscando a alguien que quiera enfocarse en la parte de Transformers.", time: "12:05" },
  { id: 3, senderId: 'other', text: "Me interesa mucho. Ya he trabajado con Python y algo de PyTorch en clase.", time: "12:07" },
  { id: 4, senderId: 'me', text: "Perfecto. ¿Te vendría bien una reunión rápida por Teams para concretar?", time: "12:10" },
]

export const Chat = () => {
  const [message, setMessage] = useState('')

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden bg-white border border-border rounded-3xl shadow-sm mx-4 mb-24 lg:mx-10">
      
      <aside className="w-full md:w-80 border-r border-border flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-border bg-white">
          <h2 className="text-xl font-black">Mensajes</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {CONVERSATIONS.map((conv) => (
            <div 
              key={conv.id} 
              className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-border/50 ${conv.id === 1 ? 'bg-white border-l-4 border-l-primary' : 'hover:bg-white'}`}
            >
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {conv.name.charAt(0)}
                </div>
                {conv.online && (
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-sm truncate">{conv.name}</h4>
                  <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="hidden md:flex flex-1 flex-col bg-white">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 text-muted-foreground"><ChevronLeft /></button>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              L
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none">Lucía García</h3>
              <span className="text-[10px] font-medium text-green-600 uppercase tracking-wider">En línea</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-muted-foreground hover:bg-secondary rounded-lg"><Info size={20} /></button>
            <button className="p-2 text-muted-foreground hover:bg-secondary rounded-lg"><MoreVertical size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100 flex items-center gap-2">
              <ExternalLink size={12} /> Discutiendo: Análisis de sentimientos...
            </div>
          </div>

          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                msg.senderId === 'me' 
                ? 'bg-primary text-primary-foreground rounded-tr-none' 
                : 'bg-white border border-border rounded-tl-none'
              }`}>
                <p>{msg.text}</p>
                <p className={`text-[9px] mt-1 text-right ${msg.senderId === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <footer className="p-4 bg-white border-t border-border">
          <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-2 px-4 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-transparent focus-within:border-primary/30">
            <button className="p-2 text-muted-foreground hover:text-primary"><Paperclip size={20} /></button>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent border-none outline-none text-sm py-2"
            />
            <button 
              className={`p-2 rounded-xl transition-all ${message ? 'bg-primary text-white' : 'text-muted-foreground'}`}
              disabled={!message}
            >
              <Send size={20} />
            </button>
          </div>
        </footer>
      </main>

    </div>
  )
}
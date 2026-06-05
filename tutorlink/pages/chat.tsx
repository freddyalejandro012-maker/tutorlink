import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useStore } from '../lib/store'
import Layout from '../components/Layout'
import { Send, MessageCircle } from 'lucide-react'

interface Msg { sender: 'me' | 'them'; text: string; time: string }

const CONVS = [
  { id: 'c1', name: 'Prof. Carlos Mendoza', initials: 'CM', color: 'bg-purple-100 text-purple-700', preview: '¿A las 6pm te parece bien?', unread: 1 },
  { id: 'c2', name: 'Prof. Sofía López', initials: 'SL', color: 'bg-amber-100 text-amber-700', preview: 'Tengo disponibilidad el viernes', unread: 0 },
]

export default function ChatPage() {
  const router = useRouter()
  const store = useStore()
  const { user, ready } = store

  useEffect(() => { if (ready && !user) router.replace('/') }, [ready, user])

  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [msgs, setMsgs] = useState<Record<string, Msg[]>>({
    c1: [
      { sender: 'them', text: 'Hola! Vi tu solicitud de Programación.', time: 'Hace 2h' },
      { sender: 'me', text: 'Hola! ¿Cuándo tienes disponibilidad?', time: 'Hace 1h' },
      { sender: 'them', text: '¿A las 6pm te parece bien?', time: 'Hace 10m' },
    ],
    c2: [
      { sender: 'them', text: 'Hola, vi tu solicitud de Cálculo II.', time: 'Ayer' },
      { sender: 'them', text: 'Tengo disponibilidad el viernes', time: 'Ayer' },
    ],
  })
  const chatRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [msgs, activeConv])

  if (!ready || !user) return null

  function sendMsg() {
    if (!chatInput.trim() || !activeConv) return
    const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    setMsgs(m => ({ ...m, [activeConv]: [...(m[activeConv] || []), { sender: 'me', text: chatInput, time: now }] }))
    setChatInput('')
    setTimeout(() => {
      const replies = ['Perfecto, te confirmo.', 'Entendido!', '¡De acuerdo!', 'Listo, quedo pendiente.']
      const reply = replies[Math.floor(Math.random() * replies.length)]
      setMsgs(m => ({ ...m, [activeConv]: [...(m[activeConv] || []), { sender: 'them', text: reply, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }] }))
    }, 1200)
  }

  const conv = activeConv ? CONVS.find(c => c.id === activeConv) : null

  return (
    <>
      <Head><title>Mensajes — TutorLink</title></Head>
      <Layout user={user} credits={user.credits} onLogout={() => { store.logout(); router.push('/') }}>
        <div className="space-y-5">
          <h1 className="font-display text-2xl font-semibold fade-up">Mensajes</h1>

          <div className={`grid gap-4 ${activeConv ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
            {/* Conversation list */}
            <div className={activeConv ? 'sm:col-span-1' : ''}>
              <div className="space-y-2">
                {CONVS.map(c => (
                  <div key={c.id} onClick={() => setActiveConv(c.id)}
                    className={`card p-4 cursor-pointer transition-all hover:shadow-lift ${activeConv === c.id ? 'card-active' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${c.color}`}>
                        {c.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[#1A1A18] truncate">{c.name}</div>
                        <div className="text-xs text-[#9CA3AF] truncate">{c.preview}</div>
                      </div>
                      {c.unread > 0 && (
                        <span className="badge badge-green text-[10px]">{c.unread}</span>
                      )}
                    </div>
                  </div>
                ))}
                {CONVS.length === 0 && (
                  <div className="card p-8 text-center text-[#9CA3AF]">
                    <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aún no tienes conversaciones.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active chat */}
            {activeConv && conv && (
              <div className="sm:col-span-2 card p-4 fade-up">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#EEEEE9]">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${conv.color}`}>
                    {conv.initials}
                  </div>
                  <span className="font-medium text-sm">{conv.name}</span>
                  <button onClick={() => router.push('/negociacion')}
                    className="ml-auto btn btn-secondary btn-sm text-xs">
                    Ver negociación ↗
                  </button>
                </div>

                <div ref={chatRef} className="space-y-3 max-h-72 overflow-y-auto mb-3 pr-1">
                  {(msgs[activeConv] || []).map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'me' ? 'justify-end' : 'items-start gap-2'}`}>
                      {m.sender === 'them' && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${conv.color}`}>
                          {conv.initials[0]}
                        </div>
                      )}
                      <div className={m.sender === 'me' ? 'text-right' : ''}>
                        <span className={`bubble ${m.sender === 'me' ? 'bubble-me' : 'bubble-them'}`}>{m.text}</span>
                        <div className="text-[10px] text-[#9CA3AF] mt-0.5">{m.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Escribe un mensaje..."
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMsg()} />
                  <button onClick={sendMsg} className="btn btn-primary p-2.5">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}

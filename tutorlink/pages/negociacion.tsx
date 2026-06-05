import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useStore } from '../lib/store'
import Layout from '../components/Layout'
import { Check, MessageCircle, Phone, Mail, Bot, Send, ArrowLeftRight, Shield } from 'lucide-react'
import { askClaude } from '../lib/ai'

interface ChatMsg { sender: 'me' | 'them' | 'system'; text: string; time: string }

const STEPS = ['Solicitud', 'Oferta', 'Negociando', 'Trato', 'Contacto']

export default function NegociacionPage() {
  const router = useRouter()
  const store = useStore()
  const { user, ready, mySolicitudes, openSolicitudes, updateSolicitud, updateUser, addTransaction } = store

  useEffect(() => { if (ready && !user) router.replace('/') }, [ready, user])

  // Find relevant solicitud
  const solicitud = user?.role === 'student'
    ? mySolicitudes.find((s: any) => s.status === 'negotiating')
    : openSolicitudes.find((s: any) => s.status === 'negotiating' && s.cotizacion?.teacher_id === user?.id)

  const cotizacion = solicitud?.cotizacion
  const [currentStep, setCurrentStep] = useState(2)
  const [accepted, setAccepted] = useState(false)
  const [showCounter, setShowCounter] = useState(false)
  const [counterVal, setCounterVal] = useState('')
  const [aiAdvice, setAiAdvice] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([
    { sender: 'them', text: cotizacion?.mensaje || 'Hola, vi tu solicitud. Puedo ayudarte.', time: 'Hace 10m' },
    { sender: 'me', text: '¿Puede ser a las 6pm?', time: 'Hace 8m' },
    { sender: 'system', text: `El profesor envió una cotización de Bs. ${cotizacion?.precio || 75} por ${cotizacion?.duracion || '2 horas'}.`, time: 'Hace 5m' },
  ])
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages])

  if (!ready || !user) return null

  function sendMsg() {
    if (!chatInput.trim()) return
    const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    setMessages(m => [...m, { sender: 'me', text: chatInput, time: now }])
    setChatInput('')
    setTimeout(() => {
      setMessages(m => [...m, { sender: 'them', text: 'Entendido, te confirmo pronto.', time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
    }, 1200)
  }

  function sendCounter() {
    if (!counterVal) return
    const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    setMessages(m => [...m, { sender: 'me', text: `Te ofrezco Bs. ${counterVal} por el trabajo. ¿Aceptas?`, time: now }])
    setShowCounter(false)
    setTimeout(() => {
      setMessages(m => [...m, { sender: 'them', text: `Acepto Bs. ${counterVal}. ¡Trato hecho!`, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
    }, 1200)
  }

  async function getAiAdvice() {
    setAiLoading(true); setAiAdvice('')
    const txt = await askClaude(
      `Un estudiante en Bolivia está negociando una tutoría de ${solicitud?.materia || 'Programación'}.
      El profesor ofrece Bs. ${cotizacion?.precio || 75} por ${cotizacion?.duracion || '2 horas'}.
      El presupuesto del estudiante era Bs. ${solicitud?.presupuesto || 70}.
      ¿Es una buena oferta? ¿Debería aceptar o negociar?`
    )
    setAiAdvice(txt); setAiLoading(false)
  }

  function acceptDeal() {
    const precio = cotizacion?.precio || 75
    const comision = parseFloat((precio * 0.1).toFixed(2))
    // Deduct commission from teacher's credits if teacher
    if (user.role === 'teacher') {
      updateUser({ credits: parseFloat((user.credits - comision).toFixed(2)) })
      addTransaction({ type: 'commission', amount: -comision, description: `Comisión — ${solicitud?.materia} (10%)` })
    }
    updateSolicitud(solicitud?.id, { status: 'accepted' })
    setCurrentStep(4)
    setAccepted(true)
    const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    setMessages(m => [...m, {
      sender: 'system',
      text: `¡Trato aceptado! Se compartieron los datos de contacto. La comisión de Bs. ${comision} fue descontada.`,
      time: now,
    }])
  }

  if (!solicitud || !cotizacion) {
    return (
      <>
        <Head><title>Negociación — TutorLink</title></Head>
        <Layout user={user} credits={user.credits} onLogout={() => { store.logout(); router.push('/') }}>
          <div className="card p-10 text-center text-[#9CA3AF]">
            <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay ninguna negociación activa.</p>
            <button onClick={() => router.push('/home')} className="btn btn-secondary btn-sm mt-4">
              Ir al inicio
            </button>
          </div>
        </Layout>
      </>
    )
  }

  return (
    <>
      <Head><title>Negociación — TutorLink</title></Head>
      <Layout user={user} credits={user.credits} onLogout={() => { store.logout(); router.push('/') }}>
        <div className="space-y-5">
          <h1 className="font-display text-xl font-semibold fade-up">Negociación</h1>

          {/* Step tracker */}
          <div className="flex items-center fade-up-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`step-item ${i < currentStep ? 'step-done' : i === currentStep ? 'step-active' : 'step-idle'}`}>
                  <div className="step-circle">
                    {i < currentStep ? <Check size={11} /> : <span className="text-[10px]">{i + 1}</span>}
                  </div>
                  <span className="step-label hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`step-line ${i < currentStep ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          {/* Offer card */}
          {!accepted && (
            <div className="card card-active p-5 fade-up">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-sm">{cotizacion.teacher_name}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">★ {cotizacion.teacher_rating} · {solicitud.materia}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-semibold text-brand-400">Bs. {cotizacion.precio}</div>
                  <div className="text-xs text-[#9CA3AF]">por {cotizacion.duracion}</div>
                  <div className="text-xs text-[#9CA3AF]">+ Bs. {(cotizacion.precio * 0.1).toFixed(2)} comisión app</div>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] mb-4">{cotizacion.mensaje}</p>

              {user.role === 'student' && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={acceptDeal} className="btn btn-primary gap-1">
                    <Check size={14} /> Aceptar trato
                  </button>
                  <button onClick={() => setShowCounter(!showCounter)} className="btn btn-secondary gap-1">
                    <ArrowLeftRight size={14} /> Contra-oferta
                  </button>
                  <button onClick={getAiAdvice} className="btn btn-ghost btn-sm gap-1 text-amber-700">
                    <Bot size={13} /> Consejo IA ↗
                  </button>
                </div>
              )}

              {user.role === 'teacher' && (
                <div className="info-box text-xs">
                  Esperando la respuesta del estudiante. Te notificaremos cuando acepte.
                </div>
              )}

              {showCounter && (
                <div className="mt-3 flex gap-2 items-end fade-up">
                  <div className="flex-1">
                    <label className="block text-xs text-[#6B7280] mb-1">Tu oferta (Bs.)</label>
                    <input className="input" type="number" value={counterVal} onChange={e => setCounterVal(e.target.value)} />
                  </div>
                  <button onClick={sendCounter} className="btn btn-primary btn-sm">Enviar</button>
                </div>
              )}

              {aiLoading && (
                <div className="ai-box mt-3">
                  <div className="ai-label"><Bot size={11} /> TutorLink IA</div>
                  <div className="flex gap-1.5 py-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                </div>
              )}
              {aiAdvice && (
                <div className="ai-box mt-3 fade-up">
                  <div className="ai-label"><Bot size={11} /> TutorLink IA</div>
                  <p className="text-sm text-amber-900">{aiAdvice}</p>
                </div>
              )}
            </div>
          )}

          {/* Chat */}
          <div className="card p-4">
            <h2 className="font-semibold text-sm mb-3">Chat</h2>
            <div ref={chatRef} className="space-y-3 max-h-52 overflow-y-auto mb-3 pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.sender === 'me' ? 'justify-end' : 'items-start'}`}>
                  {m.sender === 'system' ? (
                    <div className="w-full text-center">
                      <span className="bubble bubble-sys text-xs">{m.text}</span>
                    </div>
                  ) : m.sender === 'them' ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700 flex-shrink-0">
                        {cotizacion.teacher_name[0]}
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9CA3AF] mb-0.5">{cotizacion.teacher_name}</p>
                        <span className="bubble bubble-them">{m.text}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-right">
                      <p className="text-[10px] text-[#9CA3AF] mb-0.5">Tú</p>
                      <span className="bubble bubble-me">{m.text}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Escribe un mensaje..."
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMsg()} />
              <button onClick={sendMsg} className="btn btn-primary p-2.5"><Send size={14} /></button>
            </div>
          </div>

          {/* Contact reveal */}
          {accepted && (
            <div className="space-y-4 fade-up">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-brand-400" />
                <h2 className="font-display font-semibold text-[15px]">¡Trato aceptado — Datos de contacto!</h2>
              </div>
              <div className="info-box text-xs">
                Los datos se comparten <strong>solo al aceptarse el trato</strong>. La comisión del 10% ya fue descontada del crédito del profesor.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Teacher contact */}
                <div className="contact-box">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-sm text-purple-700">
                      {cotizacion.teacher_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-brand-800">{cotizacion.teacher_name}</div>
                      <div className="text-xs text-brand-600">Profesor</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-brand-800">
                    <div className="flex items-center gap-2"><Phone size={13} /><strong>{cotizacion.teacher_phone || '+591 7712 3456'}</strong></div>
                    <div className="flex items-center gap-2"><Mail size={13} />{cotizacion.teacher_email}</div>
                  </div>
                </div>
                {/* Student contact */}
                <div className="contact-box">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center font-bold text-sm text-brand-700">
                      {solicitud.student_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-brand-800">{solicitud.student_name}</div>
                      <div className="text-xs text-brand-600">Estudiante</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-brand-800">
                    <div className="flex items-center gap-2"><Phone size={13} /><strong>{solicitud.student_phone || '+591 6698 7654'}</strong></div>
                  </div>
                </div>
              </div>
              <div className="card p-3 text-xs text-[#6B7280]">
                Coordina el horario y lugar directamente por WhatsApp. Al finalizar, el estudiante podrá calificarte en TutorLink.
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}

import { useState } from 'react'
import { useRouter } from 'next/router'
import { AlertTriangle, Tag, Send, X, Coins, TrendingUp } from 'lucide-react'
import type { Solicitud } from '../lib/store'

export default function TeacherHome({ store }: { store: any }) {
  const router = useRouter()
  const { user, openSolicitudes, updateUser, updateSolicitud, addTransaction } = store
  const [filter, setFilter] = useState('')
  const [openForms, setOpenForms] = useState<Record<string, boolean>>({})
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [durations, setDurations] = useState<Record<string, string>>({})

  const hasCredit = user.credits >= 1

  const filtered = openSolicitudes.filter((s: Solicitud) =>
    !filter || s.materia.toLowerCase().includes(filter.toLowerCase())
  )

  function toggleForm(id: string) {
    if (!hasCredit) { router.push('/creditos'); return }
    setOpenForms(f => ({ ...f, [id]: !f[id] }))
    if (!prices[id]) setPrices(p => ({ ...p, [id]: '75' }))
    if (!messages[id]) setMessages(m => ({ ...m, [id]: 'Puedo ayudarte con este tema. Lo resolvemos en el tiempo estimado.' }))
    if (!durations[id]) setDurations(d => ({ ...d, [id]: '2 horas' }))
  }

  function getComision(id: string) {
    const p = parseFloat(prices[id]) || 0
    return { com: (p * 0.1).toFixed(2), net: (p * 0.9).toFixed(2), price: p.toFixed(2) }
  }

  function sendQuote(s: Solicitud) {
    if (user.credits < 1) { router.push('/creditos'); return }
    // Deduct Bs. 1 for the quote
    updateUser({ credits: parseFloat((user.credits - 1).toFixed(2)), quotes_used: (user.quotes_used || 0) + 1 })
    addTransaction({ type: 'quote_cost', amount: -1, description: `Cotización enviada — ${s.materia}` })
    // Attach offer to solicitud
    updateSolicitud(s.id, {
      status: 'negotiating',
      cotizacion: {
        teacher_id: user.id,
        teacher_name: `${user.name} ${user.last_name}`,
        teacher_phone: user.phone,
        teacher_email: user.email,
        teacher_rating: user.rating || 4.9,
        precio: parseFloat(prices[s.id]) || 75,
        duracion: durations[s.id] || '2 horas',
        mensaje: messages[s.id] || '',
        status: 'pending',
      },
    })
    setOpenForms(f => ({ ...f, [s.id]: false }))
  }

  function timeAgo(iso: string) {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
    if (h < 1) return 'Hace unos minutos'
    if (h < 24) return `Hace ${h}h`
    return `Hace ${Math.floor(h / 24)}d`
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="fade-up">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A18]">
          Hola, Prof. {user.name} 👋
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Hay {openSolicitudes.length} solicitudes disponibles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 fade-up-2">
        <div className="metric-card border-2 border-brand-200">
          <div className="metric-label flex items-center gap-1 text-brand-600">
            <Coins size={11} /> Mis créditos
          </div>
          <div className="metric-value text-brand-600">{user.credits?.toFixed(2)}</div>
          <div className="metric-sub">Bs. disponibles</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Cotizaciones</div>
          <div className="metric-value">{user.quotes_used || 0}</div>
          <div className="metric-sub">Bs. 1 c/u</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Tratos cerrados</div>
          <div className="metric-value">2</div>
          <div className="metric-sub">este mes</div>
        </div>
        <div className="metric-card">
          <div className="metric-label flex items-center gap-1">
            <TrendingUp size={11} /> Ganado
          </div>
          <div className="metric-value">Bs. 126</div>
          <div className="metric-sub">neto</div>
        </div>
      </div>

      {/* No credit warning */}
      {!hasCredit && (
        <div className="warn-box flex items-start gap-2 fade-up">
          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <strong>Sin crédito para cotizar.</strong> Necesitas al menos Bs. 1 por cotización.
            <button onClick={() => router.push('/creditos')}
              className="btn btn-sm ml-2 bg-amber-100 text-amber-800 border-amber-200">
              Cargar crédito ↗
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-[15px]">Solicitudes abiertas</h2>
        <select className="input w-auto text-xs" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Todas</option>
          <option value="Programación">Programación</option>
          <option value="Cálculo">Cálculo</option>
          <option value="Física">Física</option>
          <option value="Estadística">Estadística</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 text-center text-[#9CA3AF] text-sm">No hay solicitudes en este momento.</div>
      )}

      <div className="space-y-3">
        {filtered.map((s: Solicitud) => {
          const { com, net, price } = getComision(s.id)
          const hasSentOffer = s.cotizacion?.teacher_id === user.id
          return (
            <div key={s.id} className="card p-4 fade-up">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-sm text-[#1A1A18]">{s.tipo} — {s.materia}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">{s.student_name} · {timeAgo(s.created_at)} · {s.modalidad}</div>
                </div>
                <span className={`badge ${hasSentOffer ? 'badge-green' : 'badge-amber'}`}>
                  {hasSentOffer ? 'Cotización enviada' : 'Sin cotizar'}
                </span>
              </div>
              <p className="text-[#6B7280] text-xs mb-3 line-clamp-2">{s.descripcion}</p>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="badge badge-gray">{s.materia}</span>
                  <span className="text-xs text-[#9CA3AF]">Presup. Bs. {s.presupuesto}</span>
                </div>
                {!hasSentOffer && (
                  <button onClick={() => toggleForm(s.id)}
                    className="btn btn-primary btn-sm gap-1">
                    <Tag size={12} /> Cotizar (–Bs. 1) ↗
                  </button>
                )}
              </div>

              {/* Offer form */}
              {openForms[s.id] && !hasSentOffer && (
                <div className="mt-4 pt-4 border-t border-[#EEEEE9] space-y-3 fade-up">
                  <div className="info-box text-xs">
                    <strong>Costo:</strong> Se descontará Bs. 1 de tus créditos al enviar esta cotización.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1">Tu precio (Bs.)</label>
                      <input className="input" type="number"
                        value={prices[s.id] || ''} onChange={e => setPrices(p => ({ ...p, [s.id]: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1">Duración estimada</label>
                      <select className="input" value={durations[s.id] || '2 horas'}
                        onChange={e => setDurations(d => ({ ...d, [s.id]: e.target.value }))}>
                        <option>1 hora</option><option>2 horas</option><option>3 horas</option><option>4 horas</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Mensaje al estudiante</label>
                    <textarea className="input" rows={2}
                      value={messages[s.id] || ''}
                      onChange={e => setMessages(m => ({ ...m, [s.id]: e.target.value }))} />
                  </div>

                  {/* Fee breakdown */}
                  <div className="bg-[#F4F3EF] rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex justify-between"><span className="text-[#6B7280]">Precio acordado</span><span className="font-medium">Bs. {price}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Comisión plataforma (10%)</span><span className="text-red-500">–Bs. {com}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Costo cotización</span><span className="text-red-500">–Bs. 1.00</span></div>
                    <div className="flex justify-between pt-1.5 border-t border-[#DDDDD8]">
                      <span className="font-medium">Recibirás</span>
                      <span className="font-semibold text-brand-600">Bs. {net}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => sendQuote(s)} className="btn btn-primary btn-sm gap-1">
                      <Send size={12} /> Confirmar y enviar
                    </button>
                    <button onClick={() => setOpenForms(f => ({ ...f, [s.id]: false }))}
                      className="btn btn-secondary btn-sm gap-1">
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

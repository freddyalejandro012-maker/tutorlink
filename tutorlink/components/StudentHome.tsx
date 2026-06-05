import { useState } from 'react'
import { useRouter } from 'next/router'
import { PlusCircle, Send, Bot, Clock, CheckCircle } from 'lucide-react'
import { askClaude } from '../lib/ai'
import type { Solicitud } from '../lib/store'

export default function StudentHome({ store }: { store: any }) {
  const router = useRouter()
  const { user, mySolicitudes, addSolicitud } = store

  const [tipo, setTipo] = useState('Ayuda con práctico')
  const [materia, setMateria] = useState('Programación')
  const [descripcion, setDescripcion] = useState('')
  const [presupuesto, setPresupuesto] = useState('70')
  const [modalidad, setModalidad] = useState('Virtual')
  const [showForm, setShowForm] = useState(false)
  const [aiTip, setAiTip] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const stats = {
    activas: mySolicitudes.filter((s: Solicitud) => s.status === 'open' || s.status === 'negotiating').length,
    conOferta: mySolicitudes.filter((s: Solicitud) => s.status === 'negotiating').length,
    completadas: mySolicitudes.filter((s: Solicitud) => s.status === 'completed').length,
  }

  function handleCreate() {
    if (!descripcion) return alert('Describe lo que necesitas.')
    const s: Solicitud = {
      id: `sol-${Date.now()}`,
      student_id: user.id,
      student_name: `${user.name} ${user.last_name}`,
      student_phone: user.phone,
      tipo, materia, descripcion,
      presupuesto: parseInt(presupuesto) || 70,
      modalidad, status: 'open',
      created_at: new Date().toISOString(),
    }
    addSolicitud(s)
    setDescripcion(''); setShowForm(false)
  }

  async function handleAiTip() {
    setAiLoading(true); setAiTip('')
    const tip = await askClaude(
      `Un estudiante universitario en Bolivia necesita "${tipo}" en "${materia}" con un presupuesto de Bs. ${presupuesto}. 
      Descripción: "${descripcion || 'sin descripción'}".
      Dame un consejo breve sobre cómo redactar mejor la solicitud y si el presupuesto es razonable.`
    )
    setAiTip(tip); setAiLoading(false)
  }

  const statusLabel: Record<string, { label: string; cls: string }> = {
    open:        { label: 'Esperando', cls: 'badge-amber' },
    negotiating: { label: 'Con oferta', cls: 'badge-green' },
    accepted:    { label: 'Aceptada', cls: 'badge-purple' },
    completed:   { label: 'Completada', cls: 'badge-gray' },
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'Hace unos minutos'
    if (h < 24) return `Hace ${h}h`
    return `Hace ${Math.floor(h / 24)}d`
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="fade-up">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A18]">
          Hola, {user.name} 👋
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">¿En qué necesitas ayuda hoy?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 fade-up-2">
        <div className="metric-card">
          <div className="metric-label">Activas</div>
          <div className="metric-value">{stats.activas}</div>
          <div className="metric-sub">{stats.conOferta} con oferta</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Completadas</div>
          <div className="metric-value">{stats.completadas}</div>
          <div className="metric-sub">este semestre</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Profesores</div>
          <div className="metric-value">3</div>
          <div className="metric-sub">conectados</div>
        </div>
      </div>

      {/* New request button */}
      <div className="fade-up-3">
        <button onClick={() => setShowForm(!showForm)}
          className="btn btn-primary w-full justify-center gap-2 py-3">
          <PlusCircle size={16} />
          {showForm ? 'Cancelar' : 'Nueva solicitud'}
        </button>
      </div>

      {/* New request form */}
      {showForm && (
        <div className="card p-5 fade-up space-y-4">
          <h2 className="font-display font-semibold text-[15px]">Nueva solicitud</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Tipo de ayuda</label>
              <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
                <option>Ayuda con práctico</option>
                <option>Clases particulares</option>
                <option>Preparación examen</option>
                <option>Revisión de tesis</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Materia</label>
              <select className="input" value={materia} onChange={e => setMateria(e.target.value)}>
                <option>Programación</option>
                <option>Cálculo II</option>
                <option>Física I</option>
                <option>Estadística</option>
                <option>Álgebra Lineal</option>
                <option>Base de Datos</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Descripción</label>
            <textarea className="input" rows={3} value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Describe lo que necesitas, tu nivel, cuándo lo necesitas..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Presupuesto (Bs.)</label>
              <input className="input" type="number" value={presupuesto}
                onChange={e => setPresupuesto(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Modalidad</label>
              <select className="input" value={modalidad} onChange={e => setModalidad(e.target.value)}>
                <option>Virtual</option>
                <option>Presencial</option>
                <option>Cualquiera</option>
              </select>
            </div>
          </div>

          {/* AI tip */}
          <button onClick={handleAiTip} disabled={aiLoading}
            className="btn btn-ghost btn-sm gap-2 text-amber-700">
            <Bot size={13} />
            {aiLoading ? 'Pensando...' : 'Consejo de IA para mi solicitud ↗'}
          </button>
          {aiLoading && (
            <div className="ai-box">
              <div className="ai-label"><Bot size={11} /> TutorLink IA</div>
              <div className="flex gap-1.5 py-1">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          )}
          {aiTip && (
            <div className="ai-box fade-up">
              <div className="ai-label"><Bot size={11} /> TutorLink IA</div>
              <p className="text-sm text-amber-900 leading-relaxed">{aiTip}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn btn-primary gap-2">
              <Send size={14} /> Publicar solicitud
            </button>
          </div>
        </div>
      )}

      {/* My requests */}
      <div>
        <h2 className="font-display font-semibold text-[15px] mb-3">Mis solicitudes</h2>
        {mySolicitudes.length === 0 && (
          <div className="card p-8 text-center text-[#9CA3AF] text-sm">
            Aún no tienes solicitudes. ¡Crea una arriba!
          </div>
        )}
        <div className="space-y-3">
          {mySolicitudes.map((s: Solicitud) => {
            const st = statusLabel[s.status] || statusLabel.open
            return (
              <div key={s.id} className={`card p-4 fade-up ${s.status === 'negotiating' ? 'card-active' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-sm text-[#1A1A18]">{s.tipo} — {s.materia}</div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {timeAgo(s.created_at)} · {s.modalidad}
                    </div>
                  </div>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </div>
                <p className="text-[#6B7280] text-xs mb-3 line-clamp-2">{s.descripcion}</p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="badge badge-gray">{s.materia}</span>
                    <span className="text-xs font-medium text-brand-400">Bs. {s.presupuesto}</span>
                  </div>
                  {s.status === 'negotiating' && s.cotizacion && (
                    <button onClick={() => router.push('/negociacion')}
                      className="btn btn-primary btn-sm gap-1">
                      <CheckCircle size={12} /> Ver oferta ↗
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

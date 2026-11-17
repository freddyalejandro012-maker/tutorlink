import { Clock, Layers } from 'lucide-react'
import { Empty, Progress } from './ui'
import {
  useHoras, resumirPlan, cuentaHoras, fmtHoras, fmtBs, fmtFecha,
  ESTADO_PLAN_LABEL, ESTADO_SESION_LABEL,
} from '../../lib/horas'

/** Vista del estudiante: sus planes y horas avanzadas con cada profesor. */
export default function StudentHoras({ user }: { user: any }) {
  const horas = useHoras()
  if (!horas.ready) return null

  const email = (user.email || '').toLowerCase()
  const fichas = horas.alumnos.filter(a => a.email && a.email === email)
  const ids = new Set(fichas.map(a => a.id))
  const planes = horas.planes.filter(p => ids.has(p.alumno_id) && !p.archivado).map(p => resumirPlan(p, horas.sesiones))
  const sesiones = horas.sesiones.filter(s => ids.has(s.alumno_id)).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const total = sesiones.filter(cuentaHoras).reduce((a, s) => a + s.duracion, 0)
  const profe = (alumnoId: string) => fichas.find(a => a.id === alumnoId)?.teacher_name ?? ''

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <h1 className="font-display text-2xl font-semibold">Mis horas</h1>
        <p className="text-sm text-[#6B7280] mt-1">Avance de tus clases y planes con tus profesores.</p>
      </div>

      {fichas.length === 0 ? (
        <Empty>Todavía no tienes horas registradas. Cuando tu profesor te agregue con tu email ({user.email}), verás aquí tu avance.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 fade-up-2">
            <div className="metric-card border-2 border-brand-200">
              <div className="metric-label flex items-center gap-1 text-brand-600"><Clock size={11} /> Horas recibidas</div>
              <div className="metric-value text-brand-600">{fmtHoras(total)}</div>
              <div className="metric-sub">{sesiones.filter(cuentaHoras).length} sesiones</div>
            </div>
            <div className="metric-card">
              <div className="metric-label flex items-center gap-1"><Layers size={11} /> Horas disponibles</div>
              <div className="metric-value">{fmtHoras(planes.reduce((a, r) => a + Math.max(0, r.restantes), 0))}</div>
              <div className="metric-sub">en {planes.filter(r => r.restantes > 0).length} plan(es)</div>
            </div>
          </div>

          {planes.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-semibold text-[15px]">Mis planes</h2>
              {planes.map(r => (
                <div key={r.plan.id} className="card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-sm">{r.plan.nombre}</div>
                      <div className="text-xs text-[#9CA3AF]">Prof. {profe(r.plan.alumno_id)} · {r.plan.materia}{r.plan.fecha_vencimiento ? ` · vence ${fmtFecha(r.plan.fecha_vencimiento)}` : ''}</div>
                    </div>
                    <span className={`badge ${ESTADO_PLAN_LABEL[r.estado].badge}`}>{ESTADO_PLAN_LABEL[r.estado].label}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span><strong>{fmtHoras(r.usadas)}</strong> de {fmtHoras(r.plan.horas_totales)}</span>
                    <span className="text-[#6B7280]">{r.restantes > 0 ? `Te quedan ${fmtHoras(r.restantes)}` : 'Plan completado'}</span>
                  </div>
                  <Progress value={r.progreso} />
                  {r.pendiente > 0 && <p className="text-xs text-amber-700 mt-2">Saldo por pagar: {fmtBs(r.pendiente)}</p>}
                </div>
              ))}
            </div>
          )}

          <div>
            <h2 className="font-display font-semibold text-[15px] mb-3">Historial de clases</h2>
            <div className="card px-4 py-1">
              {sesiones.map(s => (
                <div key={s.id} className="tx-row">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.tema || s.materia}</div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">
                      {fmtFecha(s.fecha, { weekday: 'short', day: '2-digit', month: 'short' })} · {s.plan_id ? 'Plan' : 'Clase suelta'} · Prof. {profe(s.alumno_id)}
                      {s.estado !== 'realizada' && ` · ${ESTADO_SESION_LABEL[s.estado]}`}
                    </div>
                    {s.notas && <div className="text-xs text-[#6B7280] mt-0.5">{s.notas}</div>}
                  </div>
                  <span className={`font-semibold text-sm flex-shrink-0 ${s.estado === 'falta_justificada' ? 'text-[#9CA3AF] line-through' : ''}`}>{fmtHoras(s.duracion)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

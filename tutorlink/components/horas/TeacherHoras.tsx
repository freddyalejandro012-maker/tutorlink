import { useMemo, useState } from 'react'
import {
  Plus, Clock, Users, Layers, Wallet, Download, Pencil, Trash2, ArrowLeft,
  Phone, Mail, CheckCircle2, CircleDollarSign, Archive, ArchiveRestore, Search, AlertTriangle,
} from 'lucide-react'
import { Empty, Progress } from './ui'
import { AlumnoForm, PagoForm, PlanForm, SesionForm } from './forms'
import {
  Alumno, Plan, Sesion, PlanResumen, useHoras, resumirPlan, cuentaHoras, hoyISO,
  fmtHoras, fmtBs, fmtFecha, exportarCSV, ESTADO_PLAN_LABEL, ESTADO_SESION_LABEL,
} from '../../lib/horas'

type Tab = 'resumen' | 'alumnos' | 'planes' | 'historial'
type ModalState =
  | { kind: 'sesion'; initial?: Sesion; alumnoId?: string; planId?: string }
  | { kind: 'alumno'; initial?: Alumno }
  | { kind: 'plan'; initial?: Plan; alumnoId?: string }
  | { kind: 'pago'; plan: Plan }
  | null

const toneFor = (r: PlanResumen) =>
  r.estado === 'completado' ? 'purple' : r.estado === 'vencido' ? 'red' : r.estado === 'por_agotarse' ? 'amber' : 'brand'

export default function TeacherHoras({ user }: { user: any }) {
  const horas = useHoras()
  const [tab, setTab] = useState<Tab>('resumen')
  const [modal, setModal] = useState<ModalState>(null)
  const [alumnoSel, setAlumnoSel] = useState<string | null>(null)

  const alumnos = horas.alumnos.filter(a => a.teacher_id === user.id)
  const ids = new Set(alumnos.map(a => a.id))
  const planes = horas.planes.filter(p => ids.has(p.alumno_id))
  const sesiones = horas.sesiones.filter(s => ids.has(s.alumno_id))
    .sort((a, b) => (b.fecha + b.hora_inicio).localeCompare(a.fecha + a.hora_inicio))
  const resumenes = planes.map(p => resumirPlan(p, sesiones))
  const nombre = (id: string) => alumnos.find(a => a.id === id)?.nombre ?? '—'

  const close = () => setModal(null)

  if (!horas.ready) return null

  const alumnoDetalle = alumnoSel ? alumnos.find(a => a.id === alumnoSel) : null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 fade-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A18]">Registro de horas</h1>
          <p className="text-sm text-[#6B7280] mt-1">Clases y planes de tus alumnos, horas avanzadas y cobros.</p>
        </div>
        <button onClick={() => setModal({ kind: 'sesion', alumnoId: alumnoSel ?? undefined })} className="btn btn-primary flex-shrink-0">
          <Plus size={14} /> <span className="hidden sm:inline">Registrar horas</span><span className="sm:hidden">Horas</span>
        </button>
      </div>

      {alumnoDetalle ? (
        <AlumnoDetalle
          alumno={alumnoDetalle}
          planes={resumenes.filter(r => r.plan.alumno_id === alumnoDetalle.id)}
          sesiones={sesiones.filter(s => s.alumno_id === alumnoDetalle.id)}
          planes_all={planes}
          onBack={() => setAlumnoSel(null)}
          setModal={setModal}
          horas={horas}
        />
      ) : (
        <>
          <div className="flex gap-1 bg-[#F4F3EF] p-1 rounded-xl overflow-x-auto">
            {([
              ['resumen', 'Resumen', Clock], ['alumnos', 'Alumnos', Users],
              ['planes', 'Planes', Layers], ['historial', 'Historial', CheckCircle2],
            ] as const).map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 nav-link justify-center whitespace-nowrap ${tab === k ? 'bg-white text-[#1A1A18] shadow-sm' : ''}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {tab === 'resumen' && <Resumen sesiones={sesiones} resumenes={resumenes} nombre={nombre} setModal={setModal} goAlumno={setAlumnoSel} />}
          {tab === 'alumnos' && <ListaAlumnos alumnos={alumnos} resumenes={resumenes} sesiones={sesiones} setModal={setModal} goAlumno={setAlumnoSel} />}
          {tab === 'planes' && <ListaPlanes resumenes={resumenes} nombre={nombre} setModal={setModal} horas={horas} goAlumno={setAlumnoSel} />}
          {tab === 'historial' && <Historial sesiones={sesiones} alumnos={alumnos} planes={planes} setModal={setModal} horas={horas} />}
        </>
      )}

      {modal?.kind === 'sesion' && <SesionForm horas={horas} teacherId={user.id} initial={modal.initial} alumnoId={modal.alumnoId} planId={modal.planId} onClose={close} />}
      {modal?.kind === 'alumno' && <AlumnoForm horas={horas} teacher={user} initial={modal.initial} onClose={close} />}
      {modal?.kind === 'plan' && <PlanForm horas={horas} teacherId={user.id} rate={user.rate} initial={modal.initial} alumnoId={modal.alumnoId} onClose={close} />}
      {modal?.kind === 'pago' && <PagoForm horas={horas} plan={horas.planes.find(p => p.id === modal.plan.id) ?? modal.plan} onClose={close} />}
    </div>
  )
}

// ================= Resumen =================

function Resumen({ sesiones, resumenes, nombre, setModal, goAlumno }: {
  sesiones: Sesion[]; resumenes: PlanResumen[]; nombre: (id: string) => string
  setModal: (m: ModalState) => void; goAlumno: (id: string) => void
}) {
  const mes = hoyISO().slice(0, 7)
  const contadas = sesiones.filter(cuentaHoras)
  const horasMes = contadas.filter(s => s.fecha.startsWith(mes)).reduce((a, s) => a + s.duracion, 0)
  const horasMesPlan = contadas.filter(s => s.fecha.startsWith(mes) && s.plan_id).reduce((a, s) => a + s.duracion, 0)
  const activos = resumenes.filter(r => r.estado === 'activo' || r.estado === 'por_agotarse')
  const porCobrarPlanes = resumenes.filter(r => !r.plan.archivado).reduce((a, r) => a + r.pendiente, 0)
  const porCobrarSueltas = sesiones.filter(s => !s.plan_id && !s.pagado && cuentaHoras(s)).reduce((a, s) => a + s.precio, 0)
  const cobradoMes =
    resumenes.flatMap(r => r.plan.pagos).filter(p => p.fecha.startsWith(mes)).reduce((a, p) => a + p.monto, 0) +
    sesiones.filter(s => !s.plan_id && s.pagado && s.fecha.startsWith(mes)).reduce((a, s) => a + s.precio, 0)

  const alertas = resumenes.filter(r => r.estado === 'por_agotarse' || r.estado === 'vencido' || (r.estado === 'completado' && r.pendiente > 0))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up-2">
        <div className="metric-card border-2 border-brand-200">
          <div className="metric-label flex items-center gap-1 text-brand-600"><Clock size={11} /> Horas este mes</div>
          <div className="metric-value text-brand-600">{fmtHoras(horasMes)}</div>
          <div className="metric-sub">{fmtHoras(horasMesPlan)} de planes · {fmtHoras(horasMes - horasMesPlan)} sueltas</div>
        </div>
        <div className="metric-card">
          <div className="metric-label flex items-center gap-1"><Layers size={11} /> Planes activos</div>
          <div className="metric-value">{activos.length}</div>
          <div className="metric-sub">{fmtHoras(activos.reduce((a, r) => a + Math.max(0, r.restantes), 0))} por dictar</div>
        </div>
        <div className="metric-card">
          <div className="metric-label flex items-center gap-1"><Wallet size={11} /> Cobrado este mes</div>
          <div className="metric-value">{fmtBs(cobradoMes)}</div>
          <div className="metric-sub">planes + clases</div>
        </div>
        <div className="metric-card">
          <div className="metric-label flex items-center gap-1"><CircleDollarSign size={11} /> Por cobrar</div>
          <div className="metric-value text-amber-700">{fmtBs(porCobrarPlanes + porCobrarSueltas)}</div>
          <div className="metric-sub">{fmtBs(porCobrarSueltas)} de clases sueltas</div>
        </div>
      </div>

      <GraficoSemanal sesiones={contadas} />

      {alertas.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display font-semibold text-[15px]">Requieren atención</h2>
          {alertas.map(r => (
            <div key={r.plan.id} className="warn-box flex items-start gap-2 cursor-pointer" onClick={() => goAlumno(r.plan.alumno_id)}>
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-xs">
                <strong>{nombre(r.plan.alumno_id)}</strong> — {r.plan.nombre}:{' '}
                {r.estado === 'por_agotarse' && <>quedan solo {fmtHoras(r.restantes)}. Ofrece renovar el plan.</>}
                {r.estado === 'vencido' && <>venció el {fmtFecha(r.plan.fecha_vencimiento)} con {fmtHoras(r.restantes)} sin usar.</>}
                {r.estado === 'completado' && <>plan completado con {fmtBs(r.pendiente)} pendiente de pago.</>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-[15px]">Últimas sesiones</h2>
        </div>
        {sesiones.length === 0
          ? <Empty>Aún no registras horas. Usa <strong>Registrar horas</strong> para empezar.</Empty>
          : <div className="card px-4 py-1">{sesiones.slice(0, 6).map(s => <FilaSesion key={s.id} s={s} alumno={nombre(s.alumno_id)} plan={resumenes.find(r => r.plan.id === s.plan_id)?.plan} onEdit={() => setModal({ kind: 'sesion', initial: s })} />)}</div>}
      </div>
    </div>
  )
}

function GraficoSemanal({ sesiones }: { sesiones: Sesion[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const semanas = useMemo(() => {
    const out: { inicio: Date; label: string; horas: number; plan: number }[] = []
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
    for (let i = 7; i >= 0; i--) {
      const ini = new Date(lunes); ini.setDate(lunes.getDate() - i * 7)
      out.push({ inicio: ini, label: ini.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }), horas: 0, plan: 0 })
    }
    for (const s of sesiones) {
      const [y, m, d] = s.fecha.split('-').map(Number)
      const f = new Date(y, m - 1, d)
      for (let i = out.length - 1; i >= 0; i--) {
        if (f >= out[i].inicio) {
          const fin = new Date(out[i].inicio); fin.setDate(fin.getDate() + 7)
          if (f < fin) { out[i].horas += s.duracion; if (s.plan_id) out[i].plan += s.duracion }
          break
        }
      }
    }
    return out
  }, [sesiones])
  const max = Math.max(4, ...semanas.map(s => s.horas))
  const total = semanas.reduce((a, s) => a + s.horas, 0)

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display font-semibold text-[15px]">Horas dictadas por semana</h2>
        <span className="text-xs text-[#6B7280]">Últimas 8 semanas · {fmtHoras(total)}</span>
      </div>
      <div className="relative">
        <div className="flex items-end gap-[2px] h-36 border-b border-[#DDDDD8]" role="img" aria-label="Horas dictadas por semana">
          {semanas.map((s, i) => (
            <div key={i} className="flex-1 h-full flex items-end justify-center cursor-default"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onTouchStart={() => setHover(i)}>
              <div className={`w-full max-w-[28px] rounded-t-[4px] transition-colors ${hover === i ? 'bg-brand-600' : 'bg-brand-400'}`}
                style={{ height: `${(s.horas / max) * 100}%`, minHeight: s.horas ? 2 : 0 }} />
            </div>
          ))}
        </div>
        {hover !== null && (
          <div className="absolute -top-2 bg-[#1A1A18] text-white text-[11px] rounded-md px-2 py-1 pointer-events-none whitespace-nowrap -translate-x-1/2"
            style={{ left: `${((hover + 0.5) / semanas.length) * 100}%` }}>
            Semana del {semanas[hover].label}: <strong>{fmtHoras(semanas[hover].horas)}</strong>
            {semanas[hover].horas > 0 && <> · {fmtHoras(semanas[hover].plan)} plan</>}
          </div>
        )}
        <div className="flex gap-[2px] mt-1.5">
          {semanas.map((s, i) => <div key={i} className="flex-1 text-center text-[10px] text-[#9CA3AF]">{i % 2 === 1 || i === semanas.length - 1 ? s.label : ''}</div>)}
        </div>
      </div>
    </div>
  )
}

// ================= Alumnos =================

function ListaAlumnos({ alumnos, resumenes, sesiones, setModal, goAlumno }: {
  alumnos: Alumno[]; resumenes: PlanResumen[]; sesiones: Sesion[]
  setModal: (m: ModalState) => void; goAlumno: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const lista = alumnos.filter(a => !q || `${a.nombre} ${a.materia}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input className="input pl-8" placeholder="Buscar alumno o materia" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button onClick={() => setModal({ kind: 'alumno' })} className="btn btn-secondary flex-shrink-0"><Plus size={14} /> Alumno</button>
      </div>
      {lista.length === 0 && <Empty>{alumnos.length ? 'Sin resultados.' : 'Agrega tu primer alumno para empezar a registrar horas.'}</Empty>}
      {lista.map(a => {
        const rs = resumenes.filter(r => r.plan.alumno_id === a.id && !r.plan.archivado)
        const activo = rs.find(r => r.estado === 'activo' || r.estado === 'por_agotarse')
        const ses = sesiones.filter(s => s.alumno_id === a.id && cuentaHoras(s))
        const total = ses.reduce((x, s) => x + s.duracion, 0)
        const deuda = rs.reduce((x, r) => x + r.pendiente, 0) + ses.filter(s => !s.plan_id && !s.pagado).reduce((x, s) => x + s.precio, 0)
        const ultima = ses[0]?.fecha
        return (
          <div key={a.id} className="card p-4 cursor-pointer" onClick={() => goAlumno(a.id)}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-sm font-semibold text-brand-800 flex-shrink-0">
                {a.nombre.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div className="font-medium text-sm truncate">{a.nombre}</div>
                  {deuda > 0 && <span className="badge badge-amber flex-shrink-0">Debe {fmtBs(deuda)}</span>}
                </div>
                <div className="text-xs text-[#9CA3AF] mt-0.5">
                  {a.materia || 'Sin materia'} · {fmtHoras(total)} dictadas{ultima ? ` · última ${fmtFecha(ultima, { day: '2-digit', month: 'short' })}` : ''}
                </div>
                {activo && (
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] text-[#6B7280] mb-1">
                      <span>{activo.plan.nombre}</span>
                      <span>{fmtHoras(activo.usadas)} / {fmtHoras(activo.plan.horas_totales)}</span>
                    </div>
                    <Progress value={activo.progreso} tone={toneFor(activo)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ================= Detalle alumno =================

function AlumnoDetalle({ alumno, planes, sesiones, planes_all, onBack, setModal, horas }: {
  alumno: Alumno; planes: PlanResumen[]; sesiones: Sesion[]; planes_all: Plan[]
  onBack: () => void; setModal: (m: ModalState) => void; horas: ReturnType<typeof useHoras>
}) {
  const contadas = sesiones.filter(cuentaHoras)
  const total = contadas.reduce((a, s) => a + s.duracion, 0)
  const sueltas = contadas.filter(s => !s.plan_id)
  const deudaSueltas = sueltas.filter(s => !s.pagado).reduce((a, s) => a + s.precio, 0)
  const deudaPlanes = planes.filter(r => !r.plan.archivado).reduce((a, r) => a + r.pendiente, 0)

  return (
    <div className="space-y-5 fade-up">
      <button onClick={onBack} className="btn btn-ghost btn-sm -ml-2"><ArrowLeft size={14} /> Alumnos</button>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">{alumno.nombre}</h2>
            <div className="text-xs text-[#6B7280] mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {alumno.materia && <span>{alumno.materia}</span>}
              {alumno.telefono && <a href={`https://wa.me/${alumno.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600"><Phone size={11} />{alumno.telefono}</a>}
              {alumno.email && <span className="flex items-center gap-1"><Mail size={11} />{alumno.email}</span>}
            </div>
            {alumno.notas && <p className="text-xs text-[#6B7280] mt-2">{alumno.notas}</p>}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button className="btn btn-ghost btn-sm p-2" onClick={() => setModal({ kind: 'alumno', initial: alumno })} aria-label="Editar"><Pencil size={14} /></button>
            <button className="btn btn-ghost btn-sm p-2 hover:text-red-600" aria-label="Eliminar"
              onClick={() => { if (confirm(`¿Eliminar a ${alumno.nombre} con todos sus planes y sesiones?`)) { horas.deleteAlumno(alumno.id); onBack() } }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="metric-card"><div className="metric-label">Horas dictadas</div><div className="metric-value text-lg">{fmtHoras(total)}</div><div className="metric-sub">{contadas.length} sesiones</div></div>
          <div className="metric-card"><div className="metric-label">Clases sueltas</div><div className="metric-value text-lg">{fmtHoras(sueltas.reduce((a, s) => a + s.duracion, 0))}</div><div className="metric-sub">{sueltas.length} {sueltas.length === 1 ? "clase" : "clases"}</div></div>
          <div className="metric-card"><div className="metric-label">Saldo pendiente</div><div className={`metric-value text-lg ${deudaPlanes + deudaSueltas > 0 ? 'text-amber-700' : ''}`}>{fmtBs(deudaPlanes + deudaSueltas)}</div><div className="metric-sub">planes + clases</div></div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'sesion', alumnoId: alumno.id })}><Plus size={12} /> Registrar horas</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal({ kind: 'plan', alumnoId: alumno.id })}><Layers size={12} /> Nuevo plan</button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-display font-semibold text-[15px]">Planes</h3>
        {planes.length === 0 && <Empty>Sin planes. Crea uno para controlar un paquete de horas prepagadas.</Empty>}
        {planes.map(r => <TarjetaPlan key={r.plan.id} r={r} setModal={setModal} horas={horas} />)}
      </div>

      <div>
        <h3 className="font-display font-semibold text-[15px] mb-3">Sesiones</h3>
        {sesiones.length === 0
          ? <Empty>Sin sesiones registradas.</Empty>
          : <div className="card px-4 py-1">{sesiones.map(s => (
            <FilaSesion key={s.id} s={s} plan={planes_all.find(p => p.id === s.plan_id)}
              onEdit={() => setModal({ kind: 'sesion', initial: s })}
              onTogglePago={!s.plan_id ? () => horas.updateSesion(s.id, { pagado: !s.pagado }) : undefined} />
          ))}</div>}
      </div>
    </div>
  )
}

// ================= Planes =================

function TarjetaPlan({ r, alumno, setModal, horas, onAlumno }: {
  r: PlanResumen; alumno?: string; setModal: (m: ModalState) => void
  horas: ReturnType<typeof useHoras>; onAlumno?: () => void
}) {
  const [verPagos, setVerPagos] = useState(false)
  const est = ESTADO_PLAN_LABEL[r.estado]
  const { plan } = r
  return (
    <div className={`card p-4 ${plan.archivado ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="min-w-0">
          <div className="font-medium text-sm">{plan.nombre}</div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">
            {alumno && <button onClick={onAlumno} className="hover:text-brand-600 font-medium">{alumno} · </button>}
            {plan.materia} · {fmtFecha(plan.fecha_inicio, { day: '2-digit', month: 'short' })}
            {plan.fecha_vencimiento ? ` → ${fmtFecha(plan.fecha_vencimiento, { day: '2-digit', month: 'short' })}` : ''}
          </div>
        </div>
        <span className={`badge ${est.badge} flex-shrink-0`}>{est.label}</span>
      </div>

      <div className="mt-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="font-display text-lg font-semibold">{fmtHoras(r.usadas)} <span className="text-sm font-normal text-[#9CA3AF]">de {fmtHoras(plan.horas_totales)}</span></span>
          <span className={`text-xs font-medium ${r.restantes < 0 ? 'text-red-600' : 'text-[#6B7280]'}`}>
            {r.restantes >= 0 ? `Quedan ${fmtHoras(r.restantes)}` : `Excedido ${fmtHoras(-r.restantes)}`}
          </span>
        </div>
        <Progress value={r.progreso} tone={toneFor(r)} />
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2 mt-3 text-xs">
        <button onClick={() => setVerPagos(v => !v)} className="text-[#6B7280] hover:text-[#1A1A18]">
          Pagado {fmtBs(r.pagado)} / {fmtBs(plan.precio_total)}
          {r.pendiente > 0 ? <span className="text-amber-700 font-medium"> · debe {fmtBs(r.pendiente)}</span> : <span className="text-brand-600 font-medium"> · al día</span>}
        </button>
        <span className="text-[#9CA3AF]">{fmtBs(r.precioHora)}/h</span>
      </div>

      {verPagos && (
        <div className="mt-2 bg-[#F4F3EF] rounded-lg p-2.5 text-xs space-y-1">
          {plan.pagos.length === 0 && <div className="text-[#9CA3AF]">Sin pagos registrados.</div>}
          {plan.pagos.map(p => (
            <div key={p.id} className="flex justify-between items-center">
              <span>{fmtFecha(p.fecha)} · {p.metodo}</span>
              <span className="flex items-center gap-2">{fmtBs(p.monto)}
                <button onClick={() => confirm('¿Eliminar este pago?') && horas.deletePago(plan.id, p.id)} className="text-[#9CA3AF] hover:text-red-600" aria-label="Eliminar pago"><Trash2 size={11} /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#EEEEE9]">
        {!plan.archivado && r.restantes > 0 && (
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'sesion', alumnoId: plan.alumno_id, planId: plan.id })}><Plus size={12} /> Horas</button>
        )}
        {r.pendiente > 0 && <button className="btn btn-secondary btn-sm" onClick={() => setModal({ kind: 'pago', plan })}><Wallet size={12} /> Pago</button>}
        {(r.estado === 'completado' || r.estado === 'vencido' || r.estado === 'por_agotarse') && !plan.archivado && (
          <button className="btn btn-secondary btn-sm" onClick={() => setModal({ kind: 'plan', alumnoId: plan.alumno_id })}>Renovar</button>
        )}
        <div className="flex-1" />
        <button className="btn btn-ghost btn-sm p-1.5" title="Editar" onClick={() => setModal({ kind: 'plan', initial: plan })}><Pencil size={13} /></button>
        <button className="btn btn-ghost btn-sm p-1.5" title={plan.archivado ? 'Restaurar' : 'Archivar'} onClick={() => horas.updatePlan(plan.id, { archivado: !plan.archivado })}>
          {plan.archivado ? <ArchiveRestore size={13} /> : <Archive size={13} />}
        </button>
        <button className="btn btn-ghost btn-sm p-1.5 hover:text-red-600" title="Eliminar"
          onClick={() => confirm('¿Eliminar este plan? Sus sesiones se conservarán como clases sueltas.') && horas.deletePlan(plan.id)}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function ListaPlanes({ resumenes, nombre, setModal, horas, goAlumno }: {
  resumenes: PlanResumen[]; nombre: (id: string) => string; setModal: (m: ModalState) => void
  horas: ReturnType<typeof useHoras>; goAlumno: (id: string) => void
}) {
  const [filtro, setFiltro] = useState<'vigentes' | 'todos' | 'archivado'>('vigentes')
  const lista = resumenes
    .filter(r => filtro === 'todos' || (filtro === 'archivado' ? r.plan.archivado : !r.plan.archivado))
    .sort((a, b) => a.restantes - b.restantes)
  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-between">
        <select className="input w-auto text-xs" value={filtro} onChange={e => setFiltro(e.target.value as any)}>
          <option value="vigentes">No archivados</option>
          <option value="archivado">Archivados</option>
          <option value="todos">Todos</option>
        </select>
        <button onClick={() => setModal({ kind: 'plan' })} className="btn btn-secondary"><Plus size={14} /> Plan</button>
      </div>
      {lista.length === 0 && <Empty>No hay planes en esta vista.</Empty>}
      {lista.map(r => <TarjetaPlan key={r.plan.id} r={r} alumno={nombre(r.plan.alumno_id)} onAlumno={() => goAlumno(r.plan.alumno_id)} setModal={setModal} horas={horas} />)}
    </div>
  )
}

// ================= Historial =================

function FilaSesion({ s, alumno, plan, onEdit, onTogglePago }: {
  s: Sesion; alumno?: string; plan?: Plan; onEdit: () => void; onTogglePago?: () => void
}) {
  const falta = s.estado !== 'realizada'
  return (
    <div className="tx-row gap-3">
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onEdit}>
        <div className="font-medium text-[#1A1A18] truncate">
          {alumno && <>{alumno} · </>}{s.tema || s.materia || 'Sesión'}
        </div>
        <div className="text-xs text-[#9CA3AF] mt-0.5 flex flex-wrap gap-x-1.5">
          <span>{fmtFecha(s.fecha, { weekday: 'short', day: '2-digit', month: 'short' })}{s.hora_inicio ? ` ${s.hora_inicio}` : ''}</span>
          <span>·</span>
          <span>{plan ? plan.nombre : 'Clase suelta'}</span>
          {falta && <span className={`badge ${s.estado === 'falta_descuenta' ? 'badge-red' : 'badge-gray'} !py-0`}>{ESTADO_SESION_LABEL[s.estado]}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-semibold text-sm ${s.estado === 'falta_justificada' ? 'text-[#9CA3AF] line-through' : ''}`}>{fmtHoras(s.duracion)}</div>
        {!s.plan_id && s.precio > 0 && (
          onTogglePago
            ? <button onClick={onTogglePago} className={`text-[11px] ${s.pagado ? 'text-brand-600' : 'text-amber-700 font-medium'}`}>{fmtBs(s.precio)} · {s.pagado ? 'pagada' : 'marcar pagada'}</button>
            : <div className={`text-[11px] ${s.pagado ? 'text-brand-600' : 'text-amber-700'}`}>{fmtBs(s.precio)} · {s.pagado ? 'pagada' : 'pendiente'}</div>
        )}
      </div>
    </div>
  )
}

function Historial({ sesiones, alumnos, planes, setModal, horas }: {
  sesiones: Sesion[]; alumnos: Alumno[]; planes: Plan[]
  setModal: (m: ModalState) => void; horas: ReturnType<typeof useHoras>
}) {
  const [alumno, setAlumno] = useState('')
  const [tipo, setTipo] = useState<'' | 'plan' | 'suelta' | 'impaga'>('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const lista = sesiones.filter(s =>
    (!alumno || s.alumno_id === alumno) &&
    (!tipo || (tipo === 'plan' ? !!s.plan_id : tipo === 'suelta' ? !s.plan_id : (!s.plan_id && !s.pagado))) &&
    (!desde || s.fecha >= desde) && (!hasta || s.fecha <= hasta),
  )
  const totalH = lista.filter(cuentaHoras).reduce((a, s) => a + s.duracion, 0)
  const nombre = (id: string) => alumnos.find(a => a.id === id)?.nombre ?? '—'

  function descargar() {
    const blob = new Blob([exportarCSV(lista, alumnos, planes)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `horas-${hoyISO()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select className="input text-xs" value={alumno} onChange={e => setAlumno(e.target.value)}>
          <option value="">Todos los alumnos</option>
          {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <select className="input text-xs" value={tipo} onChange={e => setTipo(e.target.value as any)}>
          <option value="">Clases y planes</option>
          <option value="plan">Solo planes</option>
          <option value="suelta">Solo clases sueltas</option>
          <option value="impaga">Clases sin pagar</option>
        </select>
        <input type="date" className="input text-xs" value={desde} onChange={e => setDesde(e.target.value)} aria-label="Desde" />
        <input type="date" className="input text-xs" value={hasta} onChange={e => setHasta(e.target.value)} aria-label="Hasta" />
      </div>
      <div className="flex justify-between items-center text-xs text-[#6B7280]">
        <span>{lista.length} sesiones · <strong className="text-[#1A1A18]">{fmtHoras(totalH)}</strong> contabilizadas</span>
        <button onClick={descargar} disabled={!lista.length} className="btn btn-secondary btn-sm"><Download size={12} /> Exportar CSV</button>
      </div>
      {lista.length === 0
        ? <Empty>No hay sesiones con estos filtros.</Empty>
        : <div className="card px-4 py-1">{lista.map(s => (
          <FilaSesion key={s.id} s={s} alumno={nombre(s.alumno_id)} plan={planes.find(p => p.id === s.plan_id)}
            onEdit={() => setModal({ kind: 'sesion', initial: s })}
            onTogglePago={!s.plan_id ? () => horas.updateSesion(s.id, { pagado: !s.pagado }) : undefined} />
        ))}</div>}
    </div>
  )
}

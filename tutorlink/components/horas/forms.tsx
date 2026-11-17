import { useMemo, useState } from 'react'
import { AlertTriangle, Save, Trash2 } from 'lucide-react'
import { Field, Modal } from './ui'
import {
  Alumno, Plan, Sesion, EstadoSesion, HorasStore,
  hoyISO, fmtHoras, fmtBs, resumirPlan, ESTADO_SESION_LABEL,
} from '../../lib/horas'

const DURACIONES = [0.5, 1, 1.5, 2, 2.5, 3, 4]
const METODOS = ['Efectivo', 'Tigo Money', 'QR', 'Transferencia', 'Tarjeta']

// ---------------- Registrar / editar sesión ----------------

export function SesionForm({ horas, teacherId, initial, alumnoId, planId, onClose }: {
  horas: HorasStore
  teacherId: string
  initial?: Sesion
  alumnoId?: string
  planId?: string | null
  onClose: () => void
}) {
  const misAlumnos = horas.alumnos.filter(a => a.teacher_id === teacherId)
  const [alumno, setAlumno] = useState(initial?.alumno_id ?? alumnoId ?? misAlumnos[0]?.id ?? '')
  const planesAlumno = horas.planes
    .filter(p => p.alumno_id === alumno && (!p.archivado || p.id === initial?.plan_id))
    .map(p => resumirPlan(p, horas.sesiones))
  const planesAbiertos = planesAlumno.filter(r => r.restantes > 0 || r.plan.id === initial?.plan_id)

  const [tipo, setTipo] = useState<'plan' | 'suelta'>(
    initial ? (initial.plan_id ? 'plan' : 'suelta') : (planId || planesAbiertos.length ? 'plan' : 'suelta'),
  )
  const [plan, setPlan] = useState<string>(initial?.plan_id ?? planId ?? planesAbiertos[0]?.plan.id ?? '')
  const alumnoObj = misAlumnos.find(a => a.id === alumno)
  const planObj = horas.planes.find(p => p.id === plan)

  const [fecha, setFecha] = useState(initial?.fecha ?? hoyISO())
  const [hora, setHora] = useState(initial?.hora_inicio ?? '')
  const [duracion, setDuracion] = useState(String(initial?.duracion ?? 1))
  const [materia, setMateria] = useState(initial?.materia ?? '')
  const [tema, setTema] = useState(initial?.tema ?? '')
  const [notas, setNotas] = useState(initial?.notas ?? '')
  const [estado, setEstado] = useState<EstadoSesion>(initial?.estado ?? 'realizada')
  const [precio, setPrecio] = useState(String(initial?.precio ?? 75))
  const [pagado, setPagado] = useState(initial?.pagado ?? false)
  const [error, setError] = useState('')

  const dur = parseFloat(duracion.replace(',', '.')) || 0
  const materiaFinal = materia || planObj?.materia || alumnoObj?.materia || ''

  // Aviso si excede las horas restantes del plan
  const exceso = useMemo(() => {
    if (tipo !== 'plan' || !planObj) return 0
    const r = resumirPlan(planObj, horas.sesiones.filter(s => s.id !== initial?.id))
    const cuenta = estado !== 'falta_justificada'
    return cuenta ? Math.max(0, dur - r.restantes) : 0
  }, [tipo, planObj, dur, estado, horas.sesiones, initial?.id])

  function guardar() {
    if (!alumno) return setError('Selecciona un alumno.')
    if (tipo === 'plan' && !plan) return setError('Selecciona un plan o registra como clase suelta.')
    if (dur <= 0 || dur > 12) return setError('La duración debe estar entre 0 y 12 horas.')
    if (!fecha) return setError('Indica la fecha.')
    const data = {
      teacher_id: teacherId,
      alumno_id: alumno,
      plan_id: tipo === 'plan' ? plan : null,
      fecha, hora_inicio: hora, duracion: dur,
      materia: materiaFinal, tema: tema.trim(), notas: notas.trim(), estado,
      precio: tipo === 'suelta' ? (parseFloat(precio) || 0) : 0,
      pagado: tipo === 'suelta' ? pagado : true,
    }
    if (initial) horas.updateSesion(initial.id, data)
    else horas.addSesion(data)
    onClose()
  }

  if (!misAlumnos.length) {
    return (
      <Modal title="Registrar horas" onClose={onClose}>
        <p className="text-sm text-[#6B7280]">Primero agrega un alumno para poder registrar horas.</p>
      </Modal>
    )
  }

  return (
    <Modal title={initial ? 'Editar sesión' : 'Registrar horas'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Alumno">
          <select className="input" value={alumno} onChange={e => {
            setAlumno(e.target.value)
            const ps = horas.planes.filter(p => p.alumno_id === e.target.value && !p.archivado)
              .map(p => resumirPlan(p, horas.sesiones)).filter(r => r.restantes > 0)
            setPlan(ps[0]?.plan.id ?? '')
            setTipo(ps.length ? 'plan' : 'suelta')
          }}>
            {misAlumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setTipo('plan')} disabled={!planesAbiertos.length}
            className={`pkg-card text-sm ${tipo === 'plan' ? 'selected' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}>
            <div className="font-medium">Descontar de plan</div>
            <div className="text-[11px] text-[#9CA3AF]">{planesAbiertos.length ? `${planesAbiertos.length} plan(es) con saldo` : 'Sin planes con saldo'}</div>
          </button>
          <button type="button" onClick={() => setTipo('suelta')}
            className={`pkg-card text-sm ${tipo === 'suelta' ? 'selected' : ''}`}>
            <div className="font-medium">Clase suelta</div>
            <div className="text-[11px] text-[#9CA3AF]">Se cobra por separado</div>
          </button>
        </div>

        {tipo === 'plan' && planesAbiertos.length > 0 && (
          <Field label="Plan">
            <select className="input" value={plan} onChange={e => setPlan(e.target.value)}>
              {planesAbiertos.map(r => (
                <option key={r.plan.id} value={r.plan.id}>
                  {r.plan.nombre} — quedan {fmtHoras(r.restantes)}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha"><input type="date" className="input" value={fecha} onChange={e => setFecha(e.target.value)} /></Field>
          <Field label="Hora de inicio (opcional)"><input type="time" className="input" value={hora} onChange={e => setHora(e.target.value)} /></Field>
        </div>

        <Field label="Duración (horas)">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DURACIONES.map(d => (
              <button key={d} type="button" onClick={() => setDuracion(String(d))}
                className={`btn btn-sm ${dur === d ? 'btn-primary' : 'btn-secondary'}`}>{fmtHoras(d)}</button>
            ))}
          </div>
          <input className="input" type="number" min="0.25" max="12" step="0.25" value={duracion} onChange={e => setDuracion(e.target.value)} />
        </Field>

        {exceso > 0 && (
          <div className="warn-box text-xs flex gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>Esta sesión excede en <strong>{fmtHoras(exceso)}</strong> las horas restantes del plan. Se registrará igual (saldo negativo); considera renovar el plan o registrar el excedente como clase suelta.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Materia"><input className="input" placeholder={planObj?.materia || alumnoObj?.materia || 'Materia'} value={materia} onChange={e => setMateria(e.target.value)} /></Field>
          <Field label="Asistencia">
            <select className="input" value={estado} onChange={e => setEstado(e.target.value as EstadoSesion)}>
              {(Object.keys(ESTADO_SESION_LABEL) as EstadoSesion[]).map(k => <option key={k} value={k}>{ESTADO_SESION_LABEL[k]}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Tema avanzado"><input className="input" placeholder="Ej. Integrales por partes" value={tema} onChange={e => setTema(e.target.value)} /></Field>
        <Field label="Notas / observaciones"><textarea className="input" rows={2} placeholder="Avance, tareas pendientes, dificultades…" value={notas} onChange={e => setNotas(e.target.value)} /></Field>

        {tipo === 'suelta' && (
          <div className="grid grid-cols-2 gap-3 items-end">
            <Field label="Precio de la clase (Bs.)"><input className="input" type="number" min="0" value={precio} onChange={e => setPrecio(e.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm pb-2.5 cursor-pointer">
              <input type="checkbox" className="accent-[#1D9E75] w-4 h-4" checked={pagado} onChange={e => setPagado(e.target.checked)} />
              Ya está pagada
            </label>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button onClick={guardar} className="btn btn-primary flex-1 justify-center"><Save size={14} /> {initial ? 'Guardar cambios' : 'Registrar sesión'}</button>
          {initial && (
            <button onClick={() => { if (confirm('¿Eliminar esta sesión?')) { horas.deleteSesion(initial.id); onClose() } }}
              className="btn btn-danger" aria-label="Eliminar sesión"><Trash2 size={14} /></button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ---------------- Alumno ----------------

export function AlumnoForm({ horas, teacher, initial, onClose, onSaved }: {
  horas: HorasStore
  teacher: { id: string; name: string; last_name: string }
  initial?: Alumno
  onClose: () => void
  onSaved?: (a: Alumno) => void
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [telefono, setTelefono] = useState(initial?.telefono ?? '')
  const [materia, setMateria] = useState(initial?.materia ?? '')
  const [notas, setNotas] = useState(initial?.notas ?? '')
  const [error, setError] = useState('')

  function guardar() {
    if (!nombre.trim()) return setError('El nombre es obligatorio.')
    const data = {
      teacher_id: teacher.id, teacher_name: `${teacher.name} ${teacher.last_name}`,
      nombre: nombre.trim(), email: email.trim().toLowerCase(), telefono: telefono.trim(),
      materia: materia.trim(), notas: notas.trim(),
    }
    if (initial) { horas.updateAlumno(initial.id, data); onSaved?.({ ...initial, ...data }) }
    else onSaved?.(horas.addAlumno(data))
    onClose()
  }

  return (
    <Modal title={initial ? 'Editar alumno' : 'Nuevo alumno'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre completo"><input className="input" value={nombre} onChange={e => setNombre(e.target.value)} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono"><input className="input" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+591 …" /></Field>
          <Field label="Materia principal"><input className="input" value={materia} onChange={e => setMateria(e.target.value)} /></Field>
        </div>
        <Field label="Email (opcional)" hint="Si el alumno tiene cuenta de estudiante en TutorLink con este email, podrá ver su avance de horas.">
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <Field label="Notas"><textarea className="input" rows={2} value={notas} onChange={e => setNotas(e.target.value)} /></Field>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={guardar} className="btn btn-primary w-full justify-center"><Save size={14} /> Guardar</button>
      </div>
    </Modal>
  )
}

// ---------------- Plan ----------------

const PLANTILLAS = [
  { nombre: 'Paquete 4 h', horas: 4 },
  { nombre: 'Paquete 8 h', horas: 8 },
  { nombre: 'Plan mensual 12 h', horas: 12 },
  { nombre: 'Plan semestral 40 h', horas: 40 },
]

export function PlanForm({ horas, teacherId, rate, initial, alumnoId, onClose }: {
  horas: HorasStore
  teacherId: string
  rate: number
  initial?: Plan
  alumnoId?: string
  onClose: () => void
}) {
  const misAlumnos = horas.alumnos.filter(a => a.teacher_id === teacherId)
  const [alumno, setAlumno] = useState(initial?.alumno_id ?? alumnoId ?? misAlumnos[0]?.id ?? '')
  const alumnoObj = misAlumnos.find(a => a.id === alumno)
  const [nombre, setNombre] = useState(initial?.nombre ?? 'Plan mensual 12 h')
  const [materia, setMateria] = useState(initial?.materia ?? '')
  const [horasT, setHorasT] = useState(String(initial?.horas_totales ?? 12))
  const [precio, setPrecio] = useState(String(initial?.precio_total ?? Math.round((rate || 70) * 12 * 0.9)))
  const [inicio, setInicio] = useState(initial?.fecha_inicio ?? hoyISO())
  const [venc, setVenc] = useState(initial?.fecha_vencimiento ?? '')
  const [notas, setNotas] = useState(initial?.notas ?? '')
  const [pagoInicial, setPagoInicial] = useState('')
  const [metodo, setMetodo] = useState(METODOS[0])
  const [error, setError] = useState('')

  const h = parseFloat(horasT) || 0
  const p = parseFloat(precio) || 0

  function guardar() {
    if (!alumno) return setError('Selecciona un alumno.')
    if (!nombre.trim()) return setError('Ponle un nombre al plan.')
    if (h <= 0) return setError('Las horas del plan deben ser mayores a 0.')
    if (venc && venc < inicio) return setError('El vencimiento no puede ser antes del inicio.')
    const data = {
      teacher_id: teacherId, alumno_id: alumno, nombre: nombre.trim(),
      materia: materia.trim() || alumnoObj?.materia || '',
      horas_totales: h, precio_total: p, fecha_inicio: inicio, fecha_vencimiento: venc, notas: notas.trim(),
    }
    if (initial) horas.updatePlan(initial.id, data)
    else {
      const pi = parseFloat(pagoInicial) || 0
      horas.addPlan({ ...data, archivado: false, pagos: pi > 0 ? [{ id: `pg-${Date.now()}`, monto: pi, fecha: inicio, metodo }] : [] })
    }
    onClose()
  }

  if (!misAlumnos.length) {
    return <Modal title="Nuevo plan" onClose={onClose}><p className="text-sm text-[#6B7280]">Primero agrega un alumno.</p></Modal>
  }

  return (
    <Modal title={initial ? 'Editar plan' : 'Nuevo plan de horas'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Alumno">
          <select className="input" value={alumno} onChange={e => setAlumno(e.target.value)} disabled={!!initial}>
            {misAlumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Field>
        {!initial && (
          <div className="flex flex-wrap gap-1.5">
            {PLANTILLAS.map(t => (
              <button key={t.nombre} type="button" className="btn btn-secondary btn-sm"
                onClick={() => { setNombre(t.nombre); setHorasT(String(t.horas)); setPrecio(String(Math.round((rate || 70) * t.horas * (t.horas >= 12 ? 0.9 : 1)))) }}>
                {t.nombre}
              </button>
            ))}
          </div>
        )}
        <Field label="Nombre del plan"><input className="input" value={nombre} onChange={e => setNombre(e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Horas"><input className="input" type="number" min="0.5" step="0.5" value={horasT} onChange={e => setHorasT(e.target.value)} /></Field>
          <Field label="Precio total (Bs.)"><input className="input" type="number" min="0" value={precio} onChange={e => setPrecio(e.target.value)} /></Field>
          <Field label="Materia"><input className="input" placeholder={alumnoObj?.materia} value={materia} onChange={e => setMateria(e.target.value)} /></Field>
        </div>
        {h > 0 && <p className="text-[11px] text-[#6B7280]">Equivale a <strong>{fmtBs(p / h)}</strong> por hora.</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio"><input type="date" className="input" value={inicio} onChange={e => setInicio(e.target.value)} /></Field>
          <Field label="Vence (opcional)"><input type="date" className="input" value={venc} onChange={e => setVenc(e.target.value)} /></Field>
        </div>
        {!initial && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pago inicial (Bs.)"><input className="input" type="number" min="0" placeholder="0" value={pagoInicial} onChange={e => setPagoInicial(e.target.value)} /></Field>
            <Field label="Método">
              <select className="input" value={metodo} onChange={e => setMetodo(e.target.value)}>{METODOS.map(m => <option key={m}>{m}</option>)}</select>
            </Field>
          </div>
        )}
        <Field label="Contenido / objetivos"><textarea className="input" rows={2} value={notas} onChange={e => setNotas(e.target.value)} /></Field>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={guardar} className="btn btn-primary w-full justify-center"><Save size={14} /> {initial ? 'Guardar cambios' : 'Crear plan'}</button>
      </div>
    </Modal>
  )
}

// ---------------- Pago de plan ----------------

export function PagoForm({ horas, plan, onClose }: { horas: HorasStore; plan: Plan; onClose: () => void }) {
  const r = resumirPlan(plan, horas.sesiones)
  const [monto, setMonto] = useState(String(r.pendiente || ''))
  const [fecha, setFecha] = useState(hoyISO())
  const [metodo, setMetodo] = useState(METODOS[0])
  const [error, setError] = useState('')
  function guardar() {
    const m = parseFloat(monto) || 0
    if (m <= 0) return setError('Ingresa un monto válido.')
    horas.addPago(plan.id, { monto: m, fecha, metodo })
    onClose()
  }
  return (
    <Modal title={`Registrar pago — ${plan.nombre}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="bg-[#F4F3EF] rounded-lg p-3 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-[#6B7280]">Precio del plan</span><span>{fmtBs(plan.precio_total)}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Pagado</span><span>{fmtBs(r.pagado)}</span></div>
          <div className="flex justify-between font-semibold pt-1 border-t border-[#DDDDD8]"><span>Pendiente</span><span className="text-amber-700">{fmtBs(r.pendiente)}</span></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Monto (Bs.)"><input className="input" type="number" min="0" value={monto} onChange={e => setMonto(e.target.value)} autoFocus /></Field>
          <Field label="Fecha"><input type="date" className="input" value={fecha} onChange={e => setFecha(e.target.value)} /></Field>
          <Field label="Método"><select className="input" value={metodo} onChange={e => setMetodo(e.target.value)}>{METODOS.map(m => <option key={m}>{m}</option>)}</select></Field>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={guardar} className="btn btn-primary w-full justify-center"><Save size={14} /> Registrar pago</button>
      </div>
    </Modal>
  )
}

import { useState, useEffect } from 'react'

// =============================================
// Registro y seguimiento de horas avanzadas
// - Alumnos del profesor
// - Planes (paquetes de N horas con precio)
// - Sesiones: clases sueltas o descontadas de un plan
// - Pagos de planes
// =============================================

export interface Alumno {
  id: string
  teacher_id: string
  teacher_name: string
  nombre: string
  email: string        // si coincide con una cuenta de estudiante, el alumno ve su avance
  telefono: string
  materia: string
  notas: string
  created_at: string
}

export interface Pago {
  id: string
  monto: number
  fecha: string        // YYYY-MM-DD
  metodo: string
}

export interface Plan {
  id: string
  teacher_id: string
  alumno_id: string
  nombre: string
  materia: string
  horas_totales: number
  precio_total: number
  fecha_inicio: string        // YYYY-MM-DD
  fecha_vencimiento: string   // YYYY-MM-DD o ''
  pagos: Pago[]
  notas: string
  archivado: boolean
  created_at: string
}

export type EstadoSesion = 'realizada' | 'falta_descuenta' | 'falta_justificada'

export interface Sesion {
  id: string
  teacher_id: string
  alumno_id: string
  plan_id: string | null      // null => clase suelta
  fecha: string               // YYYY-MM-DD
  hora_inicio: string         // HH:MM o ''
  duracion: number            // horas (decimal, ej. 1.5)
  materia: string
  tema: string
  notas: string
  estado: EstadoSesion
  precio: number              // solo clases sueltas
  pagado: boolean             // solo clases sueltas
  created_at: string
}

export type EstadoPlan = 'activo' | 'por_agotarse' | 'completado' | 'vencido' | 'archivado'

export interface PlanResumen {
  plan: Plan
  usadas: number
  restantes: number
  progreso: number       // 0..1
  pagado: number
  pendiente: number
  estado: EstadoPlan
  precioHora: number
}

// ---------- Helpers ----------

export function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function diasAtras(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function diasAdelante(n: number) { return diasAtras(-n) }

export function fmtHoras(h: number): string {
  const total = Math.round(h * 60)
  const hh = Math.floor(Math.abs(total) / 60)
  const mm = Math.abs(total) % 60
  const sign = total < 0 ? '–' : ''
  if (hh === 0) return `${sign}${mm} min`
  return mm ? `${sign}${hh} h ${mm} min` : `${sign}${hh} h`
}

export function fmtBs(n: number): string {
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function fmtFecha(iso: string, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-BO', opts)
}

/** ¿La sesión descuenta horas? */
export function cuentaHoras(s: Sesion): boolean {
  return s.estado === 'realizada' || s.estado === 'falta_descuenta'
}

export const ESTADO_SESION_LABEL: Record<EstadoSesion, string> = {
  realizada: 'Realizada',
  falta_descuenta: 'Falta (descuenta)',
  falta_justificada: 'Falta justificada',
}

export const ESTADO_PLAN_LABEL: Record<EstadoPlan, { label: string; badge: string }> = {
  activo:       { label: 'Activo',        badge: 'badge-green' },
  por_agotarse: { label: 'Por agotarse',  badge: 'badge-amber' },
  completado:   { label: 'Completado',    badge: 'badge-purple' },
  vencido:      { label: 'Vencido',       badge: 'badge-red' },
  archivado:    { label: 'Archivado',     badge: 'badge-gray' },
}

export function resumirPlan(plan: Plan, sesiones: Sesion[]): PlanResumen {
  const usadas = sesiones
    .filter(s => s.plan_id === plan.id && cuentaHoras(s))
    .reduce((a, s) => a + s.duracion, 0)
  const restantes = plan.horas_totales - usadas
  const pagado = plan.pagos.reduce((a, p) => a + p.monto, 0)
  const pendiente = Math.max(0, plan.precio_total - pagado)
  let estado: EstadoPlan = 'activo'
  if (plan.archivado) estado = 'archivado'
  else if (restantes <= 0) estado = 'completado'
  else if (plan.fecha_vencimiento && plan.fecha_vencimiento < hoyISO()) estado = 'vencido'
  else if (restantes <= Math.max(2, plan.horas_totales * 0.2)) estado = 'por_agotarse'
  return {
    plan, usadas, restantes, pagado, pendiente, estado,
    progreso: plan.horas_totales > 0 ? Math.min(1, usadas / plan.horas_totales) : 0,
    precioHora: plan.horas_totales > 0 ? plan.precio_total / plan.horas_totales : 0,
  }
}

export function exportarCSV(sesiones: Sesion[], alumnos: Alumno[], planes: Plan[]): string {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = ['Fecha', 'Hora', 'Alumno', 'Tipo', 'Plan', 'Materia', 'Tema', 'Duración (h)', 'Estado', 'Precio (Bs)', 'Pagado', 'Notas']
  const rows = sesiones.map(s => {
    const a = alumnos.find(x => x.id === s.alumno_id)
    const p = planes.find(x => x.id === s.plan_id)
    return [
      s.fecha, s.hora_inicio, a?.nombre, s.plan_id ? 'Plan' : 'Clase suelta', p?.nombre ?? '',
      s.materia, s.tema, String(s.duracion).replace('.', ','), ESTADO_SESION_LABEL[s.estado],
      s.plan_id ? '' : s.precio, s.plan_id ? '' : (s.pagado ? 'Sí' : 'No'), s.notas,
    ].map(esc).join(';')
  })
  return '﻿' + [header.map(esc).join(';'), ...rows].join('\n')
}

// ---------- Datos demo (profesor teacher-1) ----------

const T = 'teacher-1'
const TN = 'Carlos Mendoza'

const DEMO_ALUMNOS: Alumno[] = [
  { id: 'al-1', teacher_id: T, teacher_name: TN, nombre: 'Juan García', email: 'juan@alumno.com', telefono: '+591 6698 7654', materia: 'Programación', notas: 'Prefiere clases por la tarde.', created_at: new Date(Date.now() - 40 * 864e5).toISOString() },
  { id: 'al-2', teacher_id: T, teacher_name: TN, nombre: 'Ana Ríos', email: '', telefono: '+591 7745 8901', materia: 'Física I', notas: '', created_at: new Date(Date.now() - 20 * 864e5).toISOString() },
  { id: 'al-3', teacher_id: T, teacher_name: TN, nombre: 'Diego Paz', email: '', telefono: '+591 7123 4567', materia: 'Base de Datos', notas: 'Clases puntuales antes de cada práctico.', created_at: new Date(Date.now() - 15 * 864e5).toISOString() },
]

const DEMO_PLANES: Plan[] = [
  { id: 'pl-1', teacher_id: T, alumno_id: 'al-1', nombre: 'Plan mensual 12 h', materia: 'Programación', horas_totales: 12, precio_total: 800, fecha_inicio: diasAtras(25), fecha_vencimiento: diasAdelante(5), pagos: [{ id: 'pg-1', monto: 400, fecha: diasAtras(25), metodo: 'Tigo Money' }], notas: 'Recursividad, árboles, grafos.', archivado: false, created_at: new Date(Date.now() - 25 * 864e5).toISOString() },
  { id: 'pl-2', teacher_id: T, alumno_id: 'al-2', nombre: 'Preparación parcial 6 h', materia: 'Física I', horas_totales: 6, precio_total: 360, fecha_inicio: diasAtras(10), fecha_vencimiento: diasAdelante(4), pagos: [{ id: 'pg-2', monto: 360, fecha: diasAtras(10), metodo: 'Transferencia' }], notas: '', archivado: false, created_at: new Date(Date.now() - 10 * 864e5).toISOString() },
]

function ses(id: string, alumno_id: string, plan_id: string | null, dias: number, duracion: number, materia: string, tema: string, extra: Partial<Sesion> = {}): Sesion {
  return { id, teacher_id: T, alumno_id, plan_id, fecha: diasAtras(dias), hora_inicio: '16:00', duracion, materia, tema, notas: '', estado: 'realizada', precio: 0, pagado: true, created_at: new Date(Date.now() - dias * 864e5).toISOString(), ...extra }
}

const DEMO_SESIONES: Sesion[] = [
  ses('se-1', 'al-1', 'pl-1', 24, 2, 'Programación', 'Introducción a recursividad'),
  ses('se-2', 'al-1', 'pl-1', 20, 1.5, 'Programación', 'Recursividad: ejercicios'),
  ses('se-3', 'al-1', 'pl-1', 16, 2, 'Programación', 'Árboles binarios'),
  ses('se-4', 'al-1', 'pl-1', 12, 1, 'Programación', 'Recorridos de árboles', { estado: 'falta_justificada', notas: 'Avisó con anticipación' }),
  ses('se-5', 'al-1', 'pl-1', 9, 2, 'Programación', 'Árboles BST'),
  ses('se-6', 'al-1', 'pl-1', 3, 1.5, 'Programación', 'Grafos: BFS y DFS'),
  ses('se-7', 'al-2', 'pl-2', 8, 2, 'Física I', 'Cinemática'),
  ses('se-8', 'al-2', 'pl-2', 4, 2, 'Física I', 'Dinámica: leyes de Newton'),
  ses('se-9', 'al-3', null, 14, 2, 'Base de Datos', 'Modelo entidad-relación', { precio: 150, pagado: true }),
  ses('se-10', 'al-3', null, 6, 1.5, 'Base de Datos', 'Consultas SQL con JOIN', { precio: 110, pagado: false }),
  ses('se-11', 'al-1', null, 1, 1, 'Programación', 'Repaso extra antes del examen', { precio: 75, pagado: false, hora_inicio: '19:00' }),
]

// ---------- Persistencia ----------

const LS_ALUMNOS = 'tl_horas_alumnos'
const LS_PLANES = 'tl_horas_planes'
const LS_SESIONES = 'tl_horas_sesiones'

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key: string, val: any) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export function useHoras() {
  const [alumnos, setAlumnosS] = useState<Alumno[]>([])
  const [planes, setPlanesS] = useState<Plan[]>([])
  const [sesiones, setSesionesS] = useState<Sesion[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAlumnosS(load(LS_ALUMNOS, DEMO_ALUMNOS))
    setPlanesS(load(LS_PLANES, DEMO_PLANES))
    setSesionesS(load(LS_SESIONES, DEMO_SESIONES))
    setReady(true)
  }, [])

  const setAlumnos = (fn: (a: Alumno[]) => Alumno[]) => setAlumnosS(prev => { const n = fn(prev); save(LS_ALUMNOS, n); return n })
  const setPlanes = (fn: (a: Plan[]) => Plan[]) => setPlanesS(prev => { const n = fn(prev); save(LS_PLANES, n); return n })
  const setSesiones = (fn: (a: Sesion[]) => Sesion[]) => setSesionesS(prev => { const n = fn(prev); save(LS_SESIONES, n); return n })

  return {
    ready, alumnos, planes, sesiones,

    addAlumno(a: Omit<Alumno, 'id' | 'created_at'>) {
      const n: Alumno = { ...a, id: uid('al'), created_at: new Date().toISOString() }
      setAlumnos(l => [n, ...l]); return n
    },
    updateAlumno(id: string, patch: Partial<Alumno>) { setAlumnos(l => l.map(x => x.id === id ? { ...x, ...patch } : x)) },
    deleteAlumno(id: string) {
      setAlumnos(l => l.filter(x => x.id !== id))
      setPlanes(l => l.filter(x => x.alumno_id !== id))
      setSesiones(l => l.filter(x => x.alumno_id !== id))
    },

    addPlan(p: Omit<Plan, 'id' | 'created_at'>) {
      const n: Plan = { ...p, id: uid('pl'), created_at: new Date().toISOString() }
      setPlanes(l => [n, ...l]); return n
    },
    updatePlan(id: string, patch: Partial<Plan>) { setPlanes(l => l.map(x => x.id === id ? { ...x, ...patch } : x)) },
    deletePlan(id: string) {
      setPlanes(l => l.filter(x => x.id !== id))
      // las sesiones del plan se conservan como clases sueltas sin precio
      setSesiones(l => l.map(s => s.plan_id === id ? { ...s, plan_id: null, precio: 0, pagado: true } : s))
    },
    addPago(planId: string, pago: Omit<Pago, 'id'>) {
      setPlanes(l => l.map(x => x.id === planId ? { ...x, pagos: [...x.pagos, { ...pago, id: uid('pg') }] } : x))
    },
    deletePago(planId: string, pagoId: string) {
      setPlanes(l => l.map(x => x.id === planId ? { ...x, pagos: x.pagos.filter(p => p.id !== pagoId) } : x))
    },

    addSesion(s: Omit<Sesion, 'id' | 'created_at'>) {
      const n: Sesion = { ...s, id: uid('se'), created_at: new Date().toISOString() }
      setSesiones(l => [n, ...l]); return n
    },
    updateSesion(id: string, patch: Partial<Sesion>) { setSesiones(l => l.map(x => x.id === id ? { ...x, ...patch } : x)) },
    deleteSesion(id: string) { setSesiones(l => l.filter(x => x.id !== id)) },
  }
}

export type HorasStore = ReturnType<typeof useHoras>

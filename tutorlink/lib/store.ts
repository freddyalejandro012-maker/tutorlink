import { useState, useEffect } from 'react'

export interface User {
  id: string
  name: string
  last_name: string
  email: string
  phone: string
  role: 'student' | 'teacher'
  university: string
  materias: string
  rate: number
  credits: number
  quotes_used: number
  rating: number
  bio: string
}

export interface Solicitud {
  id: string
  student_id: string
  student_name: string
  student_phone: string
  tipo: string
  materia: string
  descripcion: string
  presupuesto: number
  modalidad: string
  status: 'open' | 'negotiating' | 'accepted' | 'completed'
  cotizacion?: Cotizacion
  created_at: string
}

export interface Cotizacion {
  teacher_id: string
  teacher_name: string
  teacher_phone: string
  teacher_email: string
  teacher_rating: number
  precio: number
  duracion: string
  mensaje: string
  status: 'pending' | 'accepted'
}

export interface Transaction {
  id: string
  type: 'credit_load' | 'quote_cost' | 'commission'
  amount: number
  description: string
  date: string
}

const DEMO_USERS: User[] = [
  {
    id: 'teacher-1',
    name: 'Carlos', last_name: 'Mendoza',
    email: 'carlos@tutor.com', phone: '+591 7712 3456',
    role: 'teacher', university: 'UMSA',
    materias: 'Programación, Algoritmos, Base de Datos',
    rate: 75, credits: 5.00, quotes_used: 2,
    rating: 4.9, bio: 'Ingeniero de Sistemas con 5 años de experiencia docente.',
  },
  {
    id: 'student-1',
    name: 'Juan', last_name: 'García',
    email: 'juan@alumno.com', phone: '+591 6698 7654',
    role: 'student', university: 'UMSA',
    materias: '', rate: 0, credits: 0,
    quotes_used: 0, rating: 0, bio: '',
  },
]

const DEMO_SOLICITUDES: Solicitud[] = [
  {
    id: 'sol-1',
    student_id: 'student-1',
    student_name: 'Juan García',
    student_phone: '+591 6698 7654',
    tipo: 'Ayuda con práctico',
    materia: 'Programación',
    descripcion: 'Necesito ayuda con recursividad y árboles binarios. Tengo el práctico el jueves y no entiendo bien los conceptos.',
    presupuesto: 70,
    modalidad: 'Virtual',
    status: 'negotiating',
    cotizacion: {
      teacher_id: 'teacher-1',
      teacher_name: 'Carlos Mendoza',
      teacher_phone: '+591 7712 3456',
      teacher_email: 'carlos@tutor.com',
      teacher_rating: 4.9,
      precio: 75,
      duracion: '2 horas',
      mensaje: 'Puedo ayudarte con recursividad y árboles binarios hoy mismo. Lo resolveríamos en 2 horas aprox.',
      status: 'pending',
    },
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'sol-2',
    student_id: 'student-1',
    student_name: 'Juan García',
    student_phone: '+591 6698 7654',
    tipo: 'Clases particulares',
    materia: 'Cálculo II',
    descripcion: 'Busco profesor para clases semanales de integrales y series. Presupuesto Bs. 80/clase.',
    presupuesto: 80,
    modalidad: 'Presencial',
    status: 'open',
    created_at: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 'sol-3',
    student_id: 'ana-2',
    student_name: 'Ana Ríos',
    student_phone: '+591 7745 8901',
    tipo: 'Preparación examen',
    materia: 'Física I',
    descripcion: 'Examen parcial la próxima semana. Necesito repasar cinemática y dinámica.',
    presupuesto: 65,
    modalidad: 'Virtual',
    status: 'open',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', type: 'commission', amount: -7.50, description: 'Comisión — Programación (10%)', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tx-2', type: 'credit_load', amount: 10.00, description: 'Carga de crédito — Tigo Money', date: new Date(Date.now() - 90000000).toISOString() },
  { id: 'tx-3', type: 'quote_cost', amount: -1.00, description: 'Cotización enviada — Física I', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 'tx-4', type: 'commission', amount: -6.50, description: 'Comisión — Física I (10%)', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 'tx-5', type: 'credit_load', amount: 15.00, description: 'Carga de crédito — Transferencia', date: new Date(Date.now() - 259200000).toISOString() },
]

const LS_USER = 'tl_user'
const LS_SOLICITUDES = 'tl_solicitudes'
const LS_TRANSACTIONS = 'tl_transactions'

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key: string, val: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(val))
}

export function useStore() {
  const [user, setUserState] = useState<User | null>(null)
  const [solicitudes, setSolicitudesState] = useState<Solicitud[]>(DEMO_SOLICITUDES)
  const [transactions, setTransactionsState] = useState<Transaction[]>(DEMO_TRANSACTIONS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = load<User | null>(LS_USER, null)
    if (saved) setUserState(saved)
    const savedSols = load<Solicitud[]>(LS_SOLICITUDES, DEMO_SOLICITUDES)
    setSolicitudesState(savedSols)
    const savedTx = load<Transaction[]>(LS_TRANSACTIONS, DEMO_TRANSACTIONS)
    setTransactionsState(savedTx)
    setReady(true)
  }, [])

  function setUser(u: User | null) {
    setUserState(u)
    save(LS_USER, u)
  }

  function updateUser(patch: Partial<User>) {
    if (!user) return
    const updated = { ...user, ...patch }
    setUser(updated)
  }

  function setSolicitudes(s: Solicitud[]) {
    setSolicitudesState(s)
    save(LS_SOLICITUDES, s)
  }

  function addSolicitud(s: Solicitud) {
    const updated = [s, ...solicitudes]
    setSolicitudes(updated)
  }

  function updateSolicitud(id: string, patch: Partial<Solicitud>) {
    const updated = solicitudes.map(s => s.id === id ? { ...s, ...patch } : s)
    setSolicitudes(updated)
  }

  function setTransactions(t: Transaction[]) {
    setTransactionsState(t)
    save(LS_TRANSACTIONS, t)
  }

  function addTransaction(t: Omit<Transaction, 'id' | 'date'>) {
    const tx: Transaction = { ...t, id: `tx-${Date.now()}`, date: new Date().toISOString() }
    const updated = [tx, ...transactions]
    setTransactions(updated)
    return tx
  }

  function login(email: string, pass: string, role: 'student' | 'teacher'): User | null {
    const demo = DEMO_USERS.find(u => u.email === email && u.role === role)
    if (demo && pass === '123456') { setUser(demo); return demo }
    // Check registered users
    const registered = load<User[]>('tl_registered', [])
    const found = registered.find(u => u.email === email && u.role === role)
    if (found) { setUser(found); return found }
    return null
  }

  function register(data: Omit<User, 'id' | 'credits' | 'quotes_used' | 'rating'>): User {
    const newUser: User = {
      ...data,
      id: `user-${Date.now()}`,
      credits: 0,
      quotes_used: 0,
      rating: 0,
    }
    const registered = load<User[]>('tl_registered', [])
    save('tl_registered', [...registered, newUser])
    setUser(newUser)
    return newUser
  }

  function logout() { setUser(null) }

  // Open solicitudes visible to teachers (not their own, not accepted)
  const openSolicitudes = solicitudes.filter(s => s.status === 'open' || s.status === 'negotiating')
  const mySolicitudes = user ? solicitudes.filter(s => s.student_id === user.id) : []

  return {
    user, ready, solicitudes, openSolicitudes, mySolicitudes, transactions,
    setUser, updateUser, login, register, logout,
    addSolicitud, updateSolicitud,
    addTransaction,
  }
}

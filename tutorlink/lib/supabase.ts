import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://placeholder.supabase.co'
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnon)

export type UserRole = 'student' | 'teacher'

export interface Profile {
  id: string
  name: string
  last_name: string
  email: string
  phone: string
  role: UserRole
  university: string
  materias: string
  rate: number
  credits: number
  quotes_used: number
  rating: number
  total_reviews: number
  bio: string
  created_at: string
}

export interface Solicitud {
  id: string
  student_id: string
  student_name: string
  tipo: string
  materia: string
  descripcion: string
  presupuesto: number
  modalidad: string
  status: 'open' | 'negotiating' | 'accepted' | 'completed' | 'cancelled'
  created_at: string
}

export interface Cotizacion {
  id: string
  solicitud_id: string
  teacher_id: string
  teacher_name: string
  teacher_rating: number
  precio: number
  duracion: string
  mensaje: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface Message {
  id: string
  deal_id: string
  sender_id: string
  sender_name: string
  sender_role: UserRole | 'system'
  content: string
  created_at: string
}

export interface Transaction {
  id: string
  teacher_id: string
  type: 'credit_load' | 'quote_cost' | 'commission'
  amount: number
  description: string
  created_at: string
}

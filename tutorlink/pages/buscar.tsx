import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useStore } from '../lib/store'
import Layout from '../components/Layout'
import { Search, Star, Bot, MessageCircle } from 'lucide-react'
import { askClaude } from '../lib/ai'

const TEACHERS = [
  { id: 't1', name: 'Carlos Mendoza', initials: 'CM', color: 'bg-purple-100 text-purple-700', specialty: 'Ing. de Sistemas', exp: '5 años', rating: 4.9, reviews: 47, rate: 70, materias: ['Programación', 'Algoritmos', 'Base de Datos'], modalidad: 'Virtual/Presencial', uni: 'UMSA' },
  { id: 't2', name: 'Sofía López', initials: 'SL', color: 'bg-amber-100 text-amber-700', specialty: 'Lic. Matemáticas', exp: '8 años', rating: 4.8, reviews: 63, rate: 80, materias: ['Cálculo II', 'Álgebra Lineal', 'Física I'], modalidad: 'Presencial zona sur', uni: 'UCB' },
  { id: 't3', name: 'Miguel Torres', initials: 'MT', color: 'bg-blue-100 text-blue-700', specialty: 'Lic. Física', exp: '3 años', rating: 4.7, reviews: 21, rate: 65, materias: ['Física I', 'Física II', 'Termodinámica'], modalidad: 'Virtual', uni: 'UMSA' },
  { id: 't4', name: 'Valeria Quispe', initials: 'VQ', color: 'bg-rose-100 text-rose-700', specialty: 'Ing. Industrial', exp: '6 años', rating: 4.9, reviews: 38, rate: 75, materias: ['Estadística', 'Investigación de Operaciones', 'Cálculo'], modalidad: 'Virtual/Presencial', uni: 'EMI' },
]

export default function BuscarPage() {
  const router = useRouter()
  const store = useStore()
  const { user, ready } = store

  useEffect(() => { if (ready && !user) router.replace('/') }, [ready, user])

  const [query, setQuery] = useState('')
  const [matFilter, setMatFilter] = useState('')
  const [aiIdx, setAiIdx] = useState<string | null>(null)
  const [aiText, setAiText] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})

  if (!ready || !user) return null

  const filtered = TEACHERS.filter(t => {
    const q = query.toLowerCase()
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.materias.some(m => m.toLowerCase().includes(q))
    const matchM = !matFilter || t.materias.some(m => m.toLowerCase().includes(matFilter.toLowerCase()))
    return matchQ && matchM
  })

  async function handleAi(t: typeof TEACHERS[0]) {
    setAiIdx(t.id)
    if (aiText[t.id]) return
    setAiLoading(l => ({ ...l, [t.id]: true }))
    const txt = await askClaude(
      `Dame 2 razones concretas y específicas por las que el Prof. ${t.name} (${t.specialty}, ${t.exp} de experiencia, calificación ${t.rating}/5, Bs. ${t.rate}/hora) sería una excelente opción para un estudiante universitario en Bolivia que necesita aprender ${t.materias[0]}.`
    )
    setAiText(a => ({ ...a, [t.id]: txt }))
    setAiLoading(l => ({ ...l, [t.id]: false }))
  }

  function handleContact(t: typeof TEACHERS[0]) {
    router.push('/chat')
  }

  return (
    <>
      <Head><title>Buscar profesores — TutorLink</title></Head>
      <Layout user={user} credits={user.credits} onLogout={() => { store.logout(); router.push('/') }}>
        <div className="space-y-5">
          <div className="fade-up">
            <h1 className="font-display text-2xl font-semibold">Explorar profesores</h1>
            <p className="text-sm text-[#6B7280] mt-1">{TEACHERS.length} profesores disponibles en Bolivia</p>
          </div>

          {/* Search & filter */}
          <div className="flex gap-2 fade-up-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input className="input pl-9" placeholder="Buscar por nombre o materia..."
                value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className="input w-auto text-sm" value={matFilter} onChange={e => setMatFilter(e.target.value)}>
              <option value="">Todas</option>
              <option>Programación</option>
              <option>Cálculo</option>
              <option>Física</option>
              <option>Estadística</option>
            </select>
          </div>

          <div className="space-y-4">
            {filtered.map(t => (
              <div key={t.id} className="card p-5 fade-up">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 ${t.color}`}>
                    {t.initials}
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-semibold text-base text-[#1A1A18]">{t.name}</div>
                    <div className="text-xs text-[#9CA3AF]">{t.specialty} · {t.exp} experiencia · {t.uni}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={11} fill={n <= Math.round(t.rating) ? '#FBBF24' : 'none'} stroke={n <= Math.round(t.rating) ? '#FBBF24' : '#D1D5DB'} />
                        ))}
                      </div>
                      <span className="text-xs text-[#6B7280]">{t.rating} ({t.reviews})</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display font-semibold text-lg text-brand-400">Bs. {t.rate}/h</div>
                    <div className="text-xs text-[#9CA3AF]">{t.modalidad}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {t.materias.map(m => <span key={m} className="badge badge-gray">{m}</span>)}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleContact(t)} className="btn btn-primary btn-sm gap-1">
                    <MessageCircle size={12} /> Contactar
                  </button>
                  <button onClick={() => handleAi(t)} className="btn btn-ghost btn-sm gap-1 text-amber-700">
                    <Bot size={12} /> Preguntar a IA ↗
                  </button>
                </div>

                {aiIdx === t.id && (
                  <div className="ai-box mt-3 fade-up">
                    <div className="ai-label"><Bot size={11} /> TutorLink IA</div>
                    {aiLoading[t.id] ? (
                      <div className="flex gap-1.5 py-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                    ) : (
                      <p className="text-sm text-amber-900 leading-relaxed">{aiText[t.id]}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="card p-10 text-center text-[#9CA3AF]">
                <Search size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No se encontraron profesores con esos filtros.</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}

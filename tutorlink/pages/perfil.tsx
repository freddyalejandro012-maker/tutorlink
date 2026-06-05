import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useStore } from '../lib/store'
import Layout from '../components/Layout'
import { Save, Bot, Star, CheckCircle } from 'lucide-react'
import { askClaude } from '../lib/ai'

export default function PerfilPage() {
  const router = useRouter()
  const store = useStore()
  const { user, ready, updateUser } = store

  useEffect(() => { if (ready && !user) router.replace('/') }, [ready, user])

  const [name, setName] = useState(user?.name || '')
  const [last, setLast] = useState(user?.last_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [uni, setUni] = useState(user?.university || '')
  const [mats, setMats] = useState(user?.materias || '')
  const [rate, setRate] = useState(String(user?.rate || 70))
  const [bio, setBio] = useState(user?.bio || '')
  const [saved, setSaved] = useState(false)
  const [aiTip, setAiTip] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [starRating, setStarRating] = useState(0)
  const [ratingDone, setRatingDone] = useState(false)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name); setLast(user.last_name || ''); setPhone(user.phone || '')
      setUni(user.university || ''); setMats(user.materias || '')
      setRate(String(user.rate || 70)); setBio(user.bio || '')
    }
  }, [user])

  if (!ready || !user) return null

  function handleSave() {
    updateUser({ name, last_name: last, phone, university: uni, materias: mats, rate: parseInt(rate) || 70, bio })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAiTip() {
    setAiLoading(true); setAiTip('')
    const tip = await askClaude(
      `Dame 3 consejos concretos para mejorar el perfil de un ${user.role === 'teacher' ? 'profesor particular' : 'estudiante'} en TutorLink, una plataforma de tutorías universitarias en Bolivia.
      ${user.role === 'teacher' ? `El profesor enseña: ${mats}. Su tarifa es Bs. ${rate}/hora.` : `El estudiante estudia en ${uni || 'una universidad boliviana'}.`}
      Los consejos deben ser prácticos y específicos para conseguir más ${user.role === 'teacher' ? 'alumnos' : 'conexiones'}.`
    )
    setAiTip(tip); setAiLoading(false)
  }

  function submitRating() {
    if (!starRating) return alert('Selecciona una calificación.')
    setRatingDone(true)
  }

  return (
    <>
      <Head><title>Mi perfil — TutorLink</title></Head>
      <Layout user={user} credits={user.credits} onLogout={() => { store.logout(); router.push('/') }}>
        <div className="space-y-5">
          <div className="fade-up">
            <h1 className="font-display text-2xl font-semibold">Mi perfil</h1>
          </div>

          {/* Avatar & info */}
          <div className="card p-5 fade-up-2">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-xl font-bold font-display text-brand-600">
                {user.name?.[0]}{user.last_name?.[0]}
              </div>
              <div>
                <div className="font-display font-semibold text-lg">{user.name} {user.last_name}</div>
                <div className="text-sm text-[#6B7280]">{user.role === 'teacher' ? 'Profesor' : 'Estudiante'}</div>
                <div className="text-xs text-[#9CA3AF]">{user.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Nombre</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Apellido</label>
                <input className="input" value={last} onChange={e => setLast(e.target.value)} />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[#6B7280] mb-1">Teléfono / WhatsApp</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+591 7..." />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-[#6B7280] mb-1">Universidad</label>
              <input className="input" value={uni} onChange={e => setUni(e.target.value)} placeholder="UMSA, UCB, EMI..." />
            </div>

            {user.role === 'teacher' && (
              <>
                <div className="mb-3">
                  <label className="block text-xs text-[#6B7280] mb-1">Materias que enseñas</label>
                  <input className="input" value={mats} onChange={e => setMats(e.target.value)} placeholder="Cálculo, Programación..." />
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-[#6B7280] mb-1">Tarifa base (Bs./hora)</label>
                  <input className="input" type="number" value={rate} onChange={e => setRate(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-[#6B7280] mb-1">Sobre mí</label>
                  <textarea className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Tu experiencia, metodología, especialidades..." />
                </div>
              </>
            )}

            <div className="flex gap-2 flex-wrap">
              <button onClick={handleSave} className="btn btn-primary gap-2">
                {saved ? <><CheckCircle size={14} /> Guardado</> : <><Save size={14} /> Guardar perfil</>}
              </button>
              <button onClick={handleAiTip} disabled={aiLoading} className="btn btn-ghost btn-sm gap-2 text-amber-700">
                <Bot size={13} /> {aiLoading ? 'Cargando...' : 'Mejorar con IA ↗'}
              </button>
            </div>

            {aiLoading && (
              <div className="ai-box mt-3">
                <div className="ai-label"><Bot size={11} /> TutorLink IA</div>
                <div className="flex gap-1.5 py-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
              </div>
            )}
            {aiTip && (
              <div className="ai-box mt-3 fade-up">
                <div className="ai-label"><Bot size={11} /> TutorLink IA</div>
                <p className="text-sm text-amber-900 leading-relaxed">{aiTip}</p>
              </div>
            )}
          </div>

          {/* Rate a teacher (student only) */}
          {user.role === 'student' && (
            <div className="card p-5 fade-up">
              <h2 className="font-display font-semibold text-[15px] mb-1">Calificar última clase</h2>
              <p className="text-xs text-[#9CA3AF] mb-4">Prof. Carlos Mendoza — Programación</p>
              {ratingDone ? (
                <div className="success-box">
                  <CheckCircle size={24} className="text-brand-400 mx-auto mb-2" />
                  <div className="font-semibold text-brand-800">¡Gracias por tu reseña!</div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setStarRating(n)}
                        className={`text-2xl transition-colors ${n <= starRating ? 'text-amber-400' : 'text-[#DDDDD8]'}`}>
                        <Star size={24} fill={n <= starRating ? '#FBBF24' : 'none'} stroke={n <= starRating ? '#FBBF24' : '#DDDDD8'} />
                      </button>
                    ))}
                  </div>
                  <textarea className="input mb-3" rows={2} value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Escribe tu reseña (opcional)..." />
                  <button onClick={submitRating} className="btn btn-primary btn-sm gap-1">
                    <Send size={12} /> Enviar calificación
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}

// Missing import fix
function Send({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
    </svg>
  )
}

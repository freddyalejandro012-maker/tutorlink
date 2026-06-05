import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useStore } from '../lib/store'
import { Eye, EyeOff, BookOpen, GraduationCap, Coins, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const { user, login, register, ready } = useStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // login form
  const [email, setEmail] = useState('juan@alumno.com')
  const [pass, setPass] = useState('123456')

  // register form
  const [rName, setRName] = useState('')
  const [rLast, setRLast] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass, setRPass] = useState('')
  const [rPhone, setRPhone] = useState('')
  const [rUni, setRUni] = useState('')
  const [rMats, setRMats] = useState('')
  const [rRate, setRRate] = useState('70')
  const [rBio, setRBio] = useState('')

  useEffect(() => {
    if (ready && user) router.replace('/home')
  }, [ready, user])

  async function handleLogin() {
    setError(''); setLoading(true)
    const u = login(email, pass, role)
    setLoading(false)
    if (!u) { setError('Credenciales incorrectas o rol equivocado.'); return }
    router.push('/home')
  }

  async function handleRegister() {
    if (!rName || !rEmail || rPass.length < 6) {
      setError('Completa todos los campos. Contraseña mínimo 6 caracteres.'); return
    }
    setError(''); setLoading(true)
    register({
      name: rName, last_name: rLast, email: rEmail,
      phone: rPhone, role,
      university: rUni, materias: rMats,
      rate: parseInt(rRate) || 70, bio: rBio,
    })
    setLoading(false)
    router.push('/home')
  }

  const demoAccounts = [
    { label: 'Estudiante demo', email: 'juan@alumno.com', pass: '123456', role: 'student' as const },
    { label: 'Profesor demo', email: 'carlos@tutor.com', pass: '123456', role: 'teacher' as const },
  ]

  return (
    <>
      <Head><title>TutorLink — Tutorías universitarias en Bolivia</title></Head>
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col">

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center mb-10 fade-up">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-400 flex items-center justify-center">
                <span className="text-white font-bold text-lg">TL</span>
              </div>
              <span className="font-display text-3xl font-semibold text-[#1A1A18]">TutorLink</span>
            </div>
            <p className="text-[#6B7280] text-base max-w-xs mx-auto leading-relaxed">
              Conectamos estudiantes con los mejores profesores universitarios de Bolivia
            </p>

            {/* Features row */}
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-[#9CA3AF]">
              <span className="flex items-center gap-1"><BookOpen size={12} className="text-brand-400" /> Solicita ayuda</span>
              <span className="flex items-center gap-1"><Coins size={12} className="text-brand-400" /> Cotiza y negocia</span>
              <span className="flex items-center gap-1"><GraduationCap size={12} className="text-brand-400" /> Aprende</span>
            </div>
          </div>

          {/* Auth card */}
          <div className="card w-full max-w-sm p-6 fade-up-2">
            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-[#F4F3EF] rounded-lg p-1">
              {(['login', 'register'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError('') }}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all
                    ${tab === t ? 'bg-white shadow-sm text-[#1A1A18]' : 'text-[#6B7280]'}`}>
                  {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>

            {/* Role selector */}
            <div className="mb-4">
              <p className="text-xs text-[#6B7280] mb-2">Soy:</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { val: 'student', icon: GraduationCap, label: 'Estudiante' },
                  { val: 'teacher', icon: BookOpen, label: 'Profesor' },
                ] as const).map(({ val, icon: Icon, label }) => (
                  <button key={val} onClick={() => setRole(val)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-medium transition-all
                      ${role === val ? 'border-brand-400 bg-brand-50 text-brand-800' : 'border-[#DDDDD8] text-[#6B7280]'}`}>
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'login' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Correo electrónico</label>
                  <input className="input" type="email" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
                </div>
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Contraseña</label>
                  <div className="relative">
                    <input className="input pr-10" type={showPass ? 'text' : 'password'}
                      value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
                    <button onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Demo shortcuts */}
                <div className="bg-[#F4F3EF] rounded-lg p-3">
                  <p className="text-[10px] text-[#9CA3AF] mb-2 font-medium uppercase tracking-wide">Acceso demo rápido</p>
                  <div className="flex gap-2">
                    {demoAccounts.map(d => (
                      <button key={d.role} onClick={() => { setEmail(d.email); setPass(d.pass); setRole(d.role) }}
                        className="flex-1 text-[11px] py-1.5 rounded-md bg-white border border-[#DDDDD8] text-[#6B7280] hover:border-brand-200 transition-colors">
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button onClick={handleLogin} disabled={loading}
                  className="btn btn-primary btn-lg w-full justify-center mt-1">
                  {loading ? 'Entrando...' : <>Entrar <ArrowRight size={15} /></>}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Nombre</label>
                    <input className="input" value={rName} onChange={e => setRName(e.target.value)} placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Apellido</label>
                    <input className="input" value={rLast} onChange={e => setRLast(e.target.value)} placeholder="Apellido" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Correo</label>
                  <input className="input" type="email" value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="tu@correo.com" />
                </div>
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Contraseña</label>
                  <input className="input" type="password" value={rPass} onChange={e => setRPass(e.target.value)} placeholder="Mín. 6 caracteres" />
                </div>
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Teléfono / WhatsApp</label>
                  <input className="input" value={rPhone} onChange={e => setRPhone(e.target.value)} placeholder="+591 7..." />
                </div>
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Universidad</label>
                  <input className="input" value={rUni} onChange={e => setRUni(e.target.value)} placeholder="UMSA, UCB, EMI..." />
                </div>
                {role === 'teacher' && (
                  <>
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1">Materias que enseñas</label>
                      <input className="input" value={rMats} onChange={e => setRMats(e.target.value)} placeholder="Cálculo, Programación..." />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1">Tarifa base (Bs./hora)</label>
                      <input className="input" type="number" value={rRate} onChange={e => setRRate(e.target.value)} />
                    </div>
                    <div className="info-box text-xs">
                      <strong>Sistema de créditos:</strong> Pagas Bs. 1 por cada cotización enviada.
                      Al cerrarse un trato, se descuenta el 10% del valor del trabajo de tus créditos.
                    </div>
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1">Sobre mí (opcional)</label>
                      <textarea className="input" rows={2} value={rBio} onChange={e => setRBio(e.target.value)}
                        placeholder="Tu experiencia y especialidades..." />
                    </div>
                  </>
                )}
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button onClick={handleRegister} disabled={loading}
                  className="btn btn-primary btn-lg w-full justify-center">
                  {loading ? 'Creando cuenta...' : <>Crear cuenta <ArrowRight size={15} /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

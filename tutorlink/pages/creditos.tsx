import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useStore } from '../lib/store'
import Layout from '../components/Layout'
import { Coins, CreditCard, Building, Smartphone, CheckCircle, TrendingDown } from 'lucide-react'

const PACKAGES = [
  { bs: 10,  label: '10 cotizaciones', bonus: '' },
  { bs: 25,  label: '25 cotizaciones', bonus: '+2 gratis' },
  { bs: 50,  label: '50 cotizaciones', bonus: '+8 gratis' },
  { bs: 100, label: '100 cotizaciones', bonus: '+20 gratis' },
]

const PAY_METHODS = [
  { id: 'tigo',  icon: Smartphone,  label: 'Tigo Money · QR' },
  { id: 'card',  icon: CreditCard,  label: 'Tarjeta débito/crédito' },
  { id: 'bank',  icon: Building,    label: 'Transferencia bancaria' },
]

export default function CreditosPage() {
  const router = useRouter()
  const store = useStore()
  const { user, ready, transactions, updateUser, addTransaction } = store

  useEffect(() => {
    if (ready && !user) router.replace('/')
    if (ready && user?.role === 'student') router.replace('/home')
  }, [ready, user])

  const [selPkg, setSelPkg] = useState(10)
  const [selPay, setSelPay] = useState('tigo')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handlePay() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500)) // simulate payment
    updateUser({ credits: parseFloat(((user?.credits || 0) + selPkg).toFixed(2)) })
    addTransaction({ type: 'credit_load', amount: selPkg, description: `Carga de crédito — ${PAY_METHODS.find(p => p.id === selPay)?.label}` })
    setLoading(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (!ready || !user) return null

  const myTx = transactions.slice(0, 10)

  return (
    <>
      <Head><title>Mis créditos — TutorLink</title></Head>
      <Layout user={user} credits={user.credits} onLogout={() => { store.logout(); router.push('/') }}>
        <div className="space-y-6">
          <div className="fade-up">
            <h1 className="font-display text-2xl font-semibold">Mis créditos</h1>
            <p className="text-sm text-[#6B7280] mt-1">Necesitas crédito para cotizar con estudiantes</p>
          </div>

          {/* Balance */}
          <div className="card p-5 fade-up-2 border-2 border-brand-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280] mb-1">Saldo disponible</p>
                <div className="font-display text-4xl font-semibold text-brand-600">Bs. {user.credits?.toFixed(2)}</div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
                <Coins size={28} className="text-brand-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#EEEEE9]">
              <div className="metric-card">
                <div className="metric-label">Cotizaciones enviadas</div>
                <div className="metric-value text-lg">{user.quotes_used || 0}</div>
                <div className="metric-sub">Bs. 1 c/u</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Comisiones cobradas</div>
                <div className="metric-value text-lg flex items-center gap-1 text-red-500">
                  <TrendingDown size={14} /> Bs. 14.00
                </div>
                <div className="metric-sub">10% por trato</div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="info-box fade-up">
            <p className="font-semibold text-sm mb-2">¿Cómo funciona el sistema de créditos?</p>
            <ul className="space-y-1 text-xs">
              <li>· <strong>Bs. 1</strong> se descuenta cada vez que envías una cotización a un estudiante.</li>
              <li>· Al cerrarse un trato, se descuenta el <strong>10%</strong> del valor acordado de tus créditos.</li>
              <li>· El resto es tuyo. Coordinas directamente con el estudiante.</li>
            </ul>
          </div>

          {/* Load credit */}
          <div className="card p-5 fade-up">
            <h2 className="font-display font-semibold text-[15px] mb-4">Cargar crédito</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {PACKAGES.map(pkg => (
                <div key={pkg.bs} onClick={() => setSelPkg(pkg.bs)}
                  className={`pkg-card ${selPkg === pkg.bs ? 'selected' : ''}`}>
                  <div className={`text-xl font-display font-semibold ${selPkg === pkg.bs ? 'text-brand-600' : ''}`}>
                    Bs. {pkg.bs}
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">{pkg.label}</div>
                  {pkg.bonus && <div className="text-xs text-brand-400 font-medium mt-1">{pkg.bonus}</div>}
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              {PAY_METHODS.map(({ id, icon: Icon, label }) => (
                <div key={id} onClick={() => setSelPay(id)}
                  className={`pay-method ${selPay === id ? 'selected' : ''}`}>
                  <Icon size={18} className={selPay === id ? 'text-brand-400' : 'text-[#9CA3AF]'} />
                  {label}
                </div>
              ))}
            </div>

            {success ? (
              <div className="success-box fade-up">
                <CheckCircle size={26} className="text-brand-400 mx-auto mb-2" />
                <div className="font-semibold text-brand-800">¡Crédito cargado exitosamente!</div>
                <div className="text-xs text-brand-600 mt-1">Tu saldo fue actualizado. Ya puedes cotizar.</div>
              </div>
            ) : (
              <button onClick={handlePay} disabled={loading}
                className="btn btn-primary btn-lg w-full justify-center gap-2">
                {loading ? (
                  <><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></>
                ) : (
                  <><Coins size={15} /> Pagar y acreditar Bs. {selPkg.toFixed(2)}</>
                )}
              </button>
            )}
          </div>

          {/* Transaction history */}
          <div className="card p-5 fade-up">
            <h2 className="font-display font-semibold text-[15px] mb-3">Historial de movimientos</h2>
            {myTx.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-4">Sin movimientos aún.</p>
            ) : (
              <div>
                {myTx.map(tx => (
                  <div key={tx.id} className="tx-row">
                    <div>
                      <div className="font-medium text-[#1A1A18]">{tx.description}</div>
                      <div className="text-xs text-[#9CA3AF] mt-0.5">
                        {new Date(tx.date).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${tx.amount > 0 ? 'text-brand-400' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}Bs. {Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}

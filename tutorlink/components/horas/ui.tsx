import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-lift fade-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#EEEEE9]">
          <h3 className="font-display font-semibold text-[16px]">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5" aria-label="Cerrar"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#6B7280] mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  )
}

export function Progress({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'amber' | 'red' | 'purple' }) {
  const color = { brand: 'bg-brand-400', amber: 'bg-amber-400', red: 'bg-red-400', purple: 'bg-violet-500' }[tone]
  return (
    <div className="h-2 w-full rounded-full bg-[#EEEEE9] overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-8 text-center text-[#9CA3AF] text-sm">{children}</div>
}

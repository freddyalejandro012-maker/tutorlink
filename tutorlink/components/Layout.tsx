import { useRouter } from 'next/router'
import { Home, BookOpen, MessageCircle, User, Coins, Bell, LogOut } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  user: any
  credits?: number
  onLogout: () => void
}

export default function Layout({ children, user, credits, onLogout }: LayoutProps) {
  const router = useRouter()
  const isTeacher = user?.role === 'teacher'

  const studentNav = [
    { href: '/',           icon: Home,          label: 'Inicio' },
    { href: '/buscar',     icon: BookOpen,       label: 'Buscar' },
    { href: '/chat',       icon: MessageCircle,  label: 'Chat' },
    { href: '/perfil',     icon: User,           label: 'Perfil' },
  ]
  const teacherNav = [
    { href: '/',           icon: Home,          label: 'Inicio' },
    { href: '/creditos',   icon: Coins,          label: 'Créditos' },
    { href: '/solicitudes',icon: BookOpen,       label: 'Solicitudes' },
    { href: '/chat',       icon: MessageCircle,  label: 'Chat' },
    { href: '/perfil',     icon: User,           label: 'Perfil' },
  ]
  const nav = isTeacher ? teacherNav : studentNav

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EEEEE9] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-400 flex items-center justify-center">
              <span className="text-white font-bold text-xs">TL</span>
            </div>
            <span className="font-display font-semibold text-[15px] text-[#1A1A18]">TutorLink</span>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {nav.map(({ href, icon: Icon, label }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`nav-link ${router.pathname === href ? 'active' : ''}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isTeacher && typeof credits === 'number' && (
              <div className="credit-pill">
                <Coins size={12} />
                <span>{credits.toFixed(2)} Bs.</span>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-xs font-semibold text-brand-800">
              {user?.name?.[0]}{user?.last_name?.[0]}
            </div>
            <button onClick={onLogout} className="btn btn-ghost btn-sm p-2">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EEEEE9] flex">
        {nav.map(({ href, icon: Icon, label }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-colors
              ${router.pathname === href ? 'text-brand-400' : 'text-gray-400'}`}
          >
            <Icon size={18} className="mb-0.5" />
            {label}
          </button>
        ))}
      </nav>

      {/* Page content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 sm:pb-8">
        {children}
      </main>
    </div>
  )
}

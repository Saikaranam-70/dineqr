import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, TableProperties,
  BarChart3, Users, Tag, Bell, Settings, LogOut, Menu, X,
  ChevronRight, Circle, Wifi, WifiOff,
} from 'lucide-react'
import { adminApiService } from '@/services/api'
import { connectAdmin, disconnectAdmin } from '@/services/socket'
import { useAdminStore } from '@/store'
import { Spinner } from '@/components/ui'
import { cn } from '@/utils/helpers'

// ─── Admin Login ──────────────────────────────────────────────────────────────
export const AdminLogin = () => {
  const navigate = useNavigate()
  const setAuth  = useAdminStore(s => s.setAuth)
  const [form, setForm]   = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [show, setShow]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return }
    setLoading(true)
    try {
      const { data } = await adminApiService.login(form)
      setAuth(data.data)
      localStorage.setItem('adminToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      toast.success(`Welcome back, ${data.data.admin.name}!`)
      navigate('/admin/dashboard', { replace: true })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/20 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl shadow-brand mb-4 text-3xl">🍽️</div>
          <h1 className="font-display text-3xl font-bold text-white">DineQR Admin</h1>
          <p className="text-surface-400 text-sm mt-1">Restaurant management dashboard</p>
        </div>

        <form onSubmit={submit} className="bg-surface-900 rounded-2xl p-8 border border-surface-800 shadow-2xl space-y-5">
          <div>
            <label className="text-surface-400 text-xs font-medium uppercase tracking-wide block mb-1.5">Email Address</label>
            <input
              type="email" autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="admin@restaurant.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-surface-400 text-xs font-medium uppercase tracking-wide block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'} autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all pr-12"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 text-sm">
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all shadow-brand hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign In →'}
          </button>

          <div className="text-center pt-2">
            <p className="text-surface-500 text-xs">Demo: admin@grandbites.com / Admin@123</p>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────
const NAV = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/orders',    icon: ClipboardList,   label: 'Orders' },
  { path: '/admin/menu',      icon: UtensilsCrossed, label: 'Menu' },
  { path: '/admin/tables',    icon: TableProperties, label: 'Tables' },
  { path: '/admin/analytics', icon: BarChart3,       label: 'Analytics' },
  { path: '/admin/reviews',   icon: '⭐',            label: 'Reviews',  emoji: true },
  { path: '/admin/staff',     icon: Users,           label: 'Staff' },
  { path: '/admin/coupons',   icon: Tag,             label: 'Coupons' },
  { path: '/admin/settings',  icon: Settings,        label: 'Settings' },
]

export const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, restaurant, token, unreadCount, addNotification, setLiveOrders } = useAdminStore()
  const clearAuth = useAdminStore(s => s.clearAuth)

  const [sidebarOpen, setSidebar] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) { navigate('/admin/login', { replace: true }); return }

    const socket = connectAdmin(token)
    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('orders:NEW_ORDER', (data) => {
      addNotification({ type: 'new_order', title: `New Order #${data.orderNumber}`, message: `Table ${data.tableNumber} · ${data.itemCount} items`, data })
      toast(`🆕 New order from Table ${data.tableNumber}`, { icon: '🔔' })
    })

    socket.on('orders:ORDER_STATUS_UPDATED', (data) => {
      toast(`Order #${data.orderNumber} → ${data.status}`, { icon: '📦' })
    })

    return () => disconnectAdmin()
  }, [token])

  const logout = async () => {
    try { await adminApiService.logout() } catch {}
    localStorage.removeItem('adminToken')
    localStorage.removeItem('refreshToken')
    clearAuth()
    navigate('/admin/login', { replace: true })
  }

  const currentPage = NAV.find(n => location.pathname.startsWith(n.path))?.label || 'Admin'

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-60 bg-surface-950 flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-surface-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-lg shadow-brand">🍽️</div>
          <div className="min-w-0">
            <p className="font-display font-bold text-white text-sm truncate">{restaurant?.name || 'DineQR'}</p>
            <p className="text-surface-500 text-xs truncate">{admin?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={() => setSidebar(false)} className="ml-auto lg:hidden text-surface-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = location.pathname.startsWith(item.path)
            const Icon   = item.icon
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebar(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  active ? 'bg-brand-500 text-white shadow-brand' : 'text-surface-400 hover:text-white hover:bg-surface-800',
                )}>
                {item.emoji
                  ? <span className="text-base">{Icon}</span>
                  : <Icon className="w-4 h-4 flex-shrink-0" />}
                <span>{item.label}</span>
                {item.path === '/admin/orders' && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" id="live-count" />
                )}
                {item.path === '/admin/settings' && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-surface-800 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-sm">
              {admin?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{admin?.name}</p>
              <div className="flex items-center gap-1">
                <Circle className={cn('w-1.5 h-1.5', connected ? 'fill-green-400 text-green-400' : 'fill-surface-500 text-surface-500')} />
                <span className="text-surface-500 text-[10px]">{connected ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-surface-400 hover:text-red-400 hover:bg-surface-800 rounded-xl text-sm transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebar(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-surface-100 px-4 py-3 flex items-center gap-4">
          <button onClick={() => setSidebar(true)} className="lg:hidden btn-ghost p-2"><Menu className="w-5 h-5" /></button>
          <h1 className="font-display text-lg font-semibold text-surface-900">{currentPage}</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className={cn('flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border',
              connected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-surface-100 text-surface-500 border-surface-200')}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? 'Live' : 'Offline'}
            </div>
            <Link to="/admin/notifications" className="btn-ghost p-2 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

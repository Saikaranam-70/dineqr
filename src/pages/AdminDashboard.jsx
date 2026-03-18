import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { adminApiService } from '@/services/api'
import { useAdminStore } from '@/store'
import { Spinner, SkeletonCard, StatusBadge } from '@/components/ui'
import { fmt, cn } from '@/utils/helpers'
import toast from 'react-hot-toast'

const COLORS = ['#f97316','#fb923c','#fdba74','#fed7aa','#fef3c7']

export const DashboardPage = () => {
  const { restaurant } = useAdminStore()
  const [data, setData]   = useState(null)
  const [sales, setSales] = useState(null)
  const [live, setLive]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('week')

  useEffect(() => { loadAll() }, [period])

  useEffect(() => {
    const interval = setInterval(() => loadLive(), 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [dashRes, salesRes, liveRes] = await Promise.all([
        adminApiService.getDashboard(),
        adminApiService.getSales({ period }),
        adminApiService.getLiveOrders(),
      ])
      setData(dashRes.data.data)
      setSales(salesRes.data.data)
      setLive(liveRes.data.data)
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  const loadLive = async () => {
    try {
      const { data: d } = await adminApiService.getLiveOrders()
      setLive(d.data)
    } catch {}
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <SkeletonCard key={i} />)}</div>
      <SkeletonCard />
    </div>
  )

  const { today = {}, growth = {}, week = {}, month = {}, live: liveStats = {} } = data || {}
  const curr = restaurant?.settings?.currencySymbol || '₹'

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-surface-900">Good day! 👋</h2>
          <p className="text-surface-500 text-sm">{fmt.date(new Date())}</p>
        </div>
        <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
          {['today','week','month'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-3 py-1.5 text-sm rounded-lg font-medium transition-all capitalize',
                period === p ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="💰" label="Today's Revenue"
          value={fmt.currency(today.revenue, curr)}
          sub={`${growth.revenue > 0 ? '↑' : '↓'} ${Math.abs(growth.revenue)}% vs yesterday`}
          trend={growth.revenue}
          color="brand"
        />
        <StatCard
          icon="📦" label="Today's Orders"
          value={today.orders}
          sub={`${growth.orders > 0 ? '↑' : '↓'} ${Math.abs(growth.orders)}% vs yesterday`}
          trend={growth.orders}
          color="blue"
        />
        <StatCard
          icon="📊" label="Avg Order Value"
          value={fmt.currency(today.avgOrderValue, curr)}
          sub={`${today.guests || 0} guests today`}
          color="green"
        />
        <StatCard
          icon="📅" label="This Week"
          value={fmt.currency(week.revenue, curr)}
          sub={`${week.orders} orders`}
          color="purple"
        />
      </div>

      {/* Live status bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live Activity
          </h3>
          <button onClick={loadLive} className="btn-ghost p-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Orders', value: liveStats.orders || 0,          icon: '🔥', color: 'text-red-600' },
            { label: 'Pending Payment', value: liveStats.pendingPayments || 0, icon: '💳', color: 'text-amber-600' },
            { label: 'Occupied Tables', value: liveStats.activeTables || 0,   icon: '🪑', color: 'text-brand-600' },
            { label: 'New Reviews',     value: liveStats.newReviews || 0,      icon: '⭐', color: 'text-yellow-600' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 bg-surface-50 rounded-xl">
              <p className="text-2xl">{s.icon}</p>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-surface-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-surface-800 mb-4">Revenue Trend</h3>
          {sales?.timeline?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sales.timeline}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={v => `${curr}${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`${curr}${fmt.number(v)}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-surface-400 text-sm">No data for this period</div>}
        </div>

        {/* Payment breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 mb-4">Payment Methods</h3>
          {sales?.paymentBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={sales.paymentBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                    dataKey="total" paddingAngle={3}>
                    {sales.paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${curr}${fmt.number(v)}`, 'Revenue']} contentStyle={{ borderRadius: '8px', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {sales.paymentBreakdown.map((item, i) => (
                  <div key={item._id} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-surface-600 capitalize">{item._id || 'Unknown'}</span>
                    <span className="font-medium text-surface-900">{fmt.currency(item.total, curr)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-40 flex items-center justify-center text-surface-400 text-sm">No payment data</div>}
        </div>
      </div>

      {/* Top products */}
      {sales?.topProducts?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-800">Top Selling Items</h3>
            <Link to="/admin/analytics" className="text-brand-500 text-sm font-medium hover:text-brand-600 flex items-center gap-1">
              Full report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {sales.topProducts.slice(0, 5).map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="w-6 text-sm font-bold text-surface-400">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{p.name}</p>
                  <div className="h-1.5 bg-surface-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${(p.revenue / (sales.topProducts[0]?.revenue || 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-surface-900">{fmt.currency(p.revenue, curr)}</p>
                  <p className="text-xs text-surface-400">{p.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live orders */}
      {live?.orders?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Active Orders ({live.orders.length})
            </h3>
            <Link to="/admin/orders" className="text-brand-500 text-sm font-medium hover:text-brand-600 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {live.orders.slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center text-sm font-bold">{order.tableNumber}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800">#{order.orderNumber}</p>
                  <p className="text-xs text-surface-400">{order.items?.length} items · {fmt.currency(order.pricing?.grandTotal, curr)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ icon, label, value, sub, trend, color }) => (
  <motion.div whileHover={{ y: -2 }} className="stat-card cursor-default">
    <div className="flex items-start justify-between">
      <span className="text-2xl">{icon}</span>
      {trend !== undefined && (
        <span className={cn('text-xs font-medium flex items-center gap-0.5', trend >= 0 ? 'text-green-600' : 'text-red-500')}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="font-display text-xl font-bold text-surface-900 mt-1">{value}</p>
    <p className="text-xs text-surface-500">{label}</p>
    {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
  </motion.div>
)

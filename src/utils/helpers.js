import { clsx } from 'clsx'

export const cn = (...args) => clsx(...args)

export const fmt = {
  currency: (n, symbol = '₹') => `${symbol}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
  date:     (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  time:     (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  datetime: (d) => `${fmt.date(d)}, ${fmt.time(d)}`,
  relTime:  (d) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return fmt.date(d)
  },
  number:   (n) => Number(n || 0).toLocaleString('en-IN'),
}

export const STATUS_COLORS = {
  placed    : 'bg-blue-50   text-blue-700   border-blue-200',
  confirmed : 'bg-indigo-50 text-indigo-700 border-indigo-200',
  preparing : 'bg-amber-50  text-amber-700  border-amber-200',
  ready     : 'bg-green-50  text-green-700  border-green-200',
  served    : 'bg-surface-50 text-surface-600 border-surface-200',
  cancelled : 'bg-red-50    text-red-700    border-red-200',
  refunded  : 'bg-purple-50 text-purple-700 border-purple-200',
  paid      : 'bg-green-50  text-green-700  border-green-200',
  pending   : 'bg-amber-50  text-amber-700  border-amber-200',
  failed    : 'bg-red-50    text-red-700    border-red-200',
}

export const STATUS_LABELS = {
  placed    : '🕐 Placed',
  confirmed : '✅ Confirmed',
  preparing : '👨‍🍳 Preparing',
  ready     : '🔔 Ready',
  served    : '🍽️ Served',
  cancelled : '❌ Cancelled',
  refunded  : '↩️ Refunded',
}

export const SPICE_ICONS = { none: '', mild: '🌶', medium: '🌶🌶', hot: '🌶🌶🌶', 'extra-hot': '🌶🌶🌶🌶' }
export const TYPE_ICONS  = { veg: '🟢', 'non-veg': '🔴', vegan: '🌿', egg: '🥚' }

export const debounce = (fn, ms) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export const truncate = (str, n = 60) => str?.length > n ? str.slice(0, n) + '…' : str

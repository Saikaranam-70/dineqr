import { cn, STATUS_COLORS } from '@/utils/helpers'
import { Loader2, Star, AlertCircle, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }
  return <Loader2 className={cn('animate-spin text-brand-500', s[size], className)} />
}

export const FullPageLoader = ({ text = 'Loading...' }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-50">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center text-2xl">🍽️</div>
    </div>
    <p className="text-surface-600 font-body text-sm animate-pulse">{text}</p>
  </div>
)

// ─── Empty State ─────────────────────────────────────────────────────────────
export const Empty = ({ icon = '📭', title = 'Nothing here', desc = '', action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    <span className="text-5xl">{icon}</span>
    <h3 className="font-display text-lg font-semibold text-surface-700">{title}</h3>
    {desc && <p className="text-surface-500 text-sm max-w-xs">{desc}</p>}
    {action}
  </div>
)

// ─── Badge / Status ───────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => (
  <span className={cn('badge border', STATUS_COLORS[status] || 'bg-surface-100 text-surface-600')}>
    {status?.charAt(0).toUpperCase() + status?.slice(1)}
  </span>
)

// ─── Star Rating ─────────────────────────────────────────────────────────────
export const StarRating = ({ value = 0, max = 5, size = 'sm', interactive = false, onChange }) => {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || value) : value
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(sz, 'transition-colors', interactive && 'cursor-pointer',
            i < display ? 'fill-amber-400 text-amber-400' : 'fill-none text-surface-300')}
          onMouseEnter={() => interactive && setHovered(i + 1)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', full: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className={cn('relative w-full bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden', widths[size])}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────
export const Select = ({ value, onChange, options, placeholder, className }) => (
  <div className={cn('relative', className)}>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="input appearance-none pr-10 cursor-pointer"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
  </div>
)

// ─── Skeleton loaders ────────────────────────────────────────────────────────
export const SkeletonCard = () => (
  <div className="card p-4 space-y-3 animate-pulse">
    <div className="skeleton h-40 w-full" />
    <div className="skeleton h-4 w-3/4" />
    <div className="skeleton h-3 w-1/2" />
    <div className="flex justify-between items-center">
      <div className="skeleton h-5 w-16" />
      <div className="skeleton h-8 w-20 rounded-xl" />
    </div>
  </div>
)

export const SkeletonRow = () => (
  <div className="flex items-center gap-3 p-3 animate-pulse">
    <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3.5 w-2/3" />
      <div className="skeleton h-3 w-1/3" />
    </div>
    <div className="skeleton h-5 w-16" />
  </div>
)

// ─── Alert ───────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'info', title, children }) => {
  const styles = {
    info    : 'bg-blue-50 border-blue-200 text-blue-800',
    warning : 'bg-amber-50 border-amber-200 text-amber-800',
    error   : 'bg-red-50 border-red-200 text-red-800',
    success : 'bg-green-50 border-green-200 text-green-800',
  }
  return (
    <div className={cn('flex gap-3 p-4 rounded-xl border text-sm', styles[type])}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>{title && <p className="font-semibold mb-0.5">{title}</p>}{children}</div>
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
export const Toggle = ({ checked, onChange, label, disabled }) => (
  <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 pointer-events-none')}>
    <div
      onClick={() => onChange(!checked)}
      className={cn('relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
        checked ? 'bg-brand-500' : 'bg-surface-200')}
    >
      <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </div>
    {label && <span className="text-sm text-surface-700">{label}</span>}
  </label>
)

// ─── Tabs ────────────────────────────────────────────────────────────────────
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 p-1 bg-surface-100 rounded-xl">
    {tabs.map(t => (
      <button
        key={t.value}
        onClick={() => onChange(t.value)}
        className={cn(
          'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all',
          active === t.value
            ? 'bg-white text-surface-900 shadow-sm'
            : 'text-surface-500 hover:text-surface-700',
        )}
      >
        {t.icon && <span className="mr-1.5">{t.icon}</span>}{t.label}
      </button>
    ))}
  </div>
)

// ─── Confirm dialog ──────────────────────────────────────────────────────────
export const Confirm = ({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) => (
  <Modal open={open} onClose={onClose} size="sm">
    <div className="p-6 space-y-4">
      <div className="text-center space-y-2">
        <div className="text-4xl">{danger ? '⚠️' : '❓'}</div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {message && <p className="text-surface-500 text-sm">{message}</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => { onConfirm(); onClose() }}
          className={cn('flex-1', danger ? 'bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors' : 'btn-primary')}>
          {confirmText}
        </button>
      </div>
    </div>
  </Modal>
)

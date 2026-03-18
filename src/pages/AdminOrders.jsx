// import { useState, useEffect, useCallback } from 'react'
// import { motion } from 'framer-motion'
// import toast from 'react-hot-toast'
// import { Search, RefreshCw, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react'
// import { adminApiService } from '@/services/api'
// import { useAdminStore } from '@/store'
// import { fmt, cn, STATUS_COLORS, STATUS_LABELS, debounce } from '@/utils/helpers'
// import { Spinner, Modal, StatusBadge, Empty, SkeletonRow, Select, Tabs, Confirm } from '@/components/ui'


// const STATUS_FLOW = {
//   placed    : { next: 'confirmed', label: 'Confirm Order',  color: 'bg-indigo-500' },
//   confirmed : { next: 'preparing', label: 'Start Preparing', color: 'bg-amber-500' },
//   preparing : { next: 'ready',    label: 'Mark Ready',     color: 'bg-green-500' },
//   ready     : { next: 'served',   label: 'Mark Served',    color: 'bg-surface-700' },
// }

// export const OrdersPage = () => {
//   const { restaurant } = useAdminStore()
//   const curr = restaurant?.settings?.currencySymbol || '₹'

//   const [orders, setOrders]     = useState([])
//   const [total, setTotal]       = useState(0)
//   const [page, setPage]         = useState(1)
//   const [loading, setLoading]   = useState(true)
//   const [view, setView]         = useState('all')   // all | live | kds
//   const [search, setSearch]     = useState('')
//   const [statusFilter, setStatus] = useState('')
//   const [selectedOrder, setSelected] = useState(null)
//   const [payModal, setPayModal] = useState(null)
//   const [cancelConfirm, setCancel] = useState(null)

//   useEffect(() => { loadOrders() }, [page, view, statusFilter])

//   const doSearch = useCallback(debounce(() => loadOrders(), 400), [])

//   const loadOrders = async () => {
//     setLoading(true)
//     try {
//       if (view === 'live' || view === 'kds') {
//         const { data } = await adminApiService.getLiveOrders()
//         setOrders(data.data.orders || [])
//         setTotal(data.data.orders?.length || 0)
//       } else {
//         const params = { page, limit: 20, search: search || undefined, status: statusFilter || undefined }
//         const { data } = await adminApiService.getOrders(params)
//         setOrders(data.data.orders)
//         setTotal(data.pagination.total)
//       }
//     } catch { toast.error('Failed to load orders') }
//     finally { setLoading(false) }
//   }

//   const updateStatus = async (orderId, status, note = '') => {
//     try {
//       await adminApiService.updateStatus(orderId, { status, note })
//       toast.success(`Order → ${status}`)
//       loadOrders()
//       if (selectedOrder?._id === orderId) {
//         setSelected(prev => ({ ...prev, status }))
//       }
//     } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
//   }

//   const cancelOrder = async (orderId, reason) => {
//     try {
//       await adminApiService.cancelOrder(orderId, { reason })
//       toast.success('Order cancelled')
//       loadOrders()
//       setSelected(null)
//     } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
//   }

//   const markPayment = async (orderId, method, tip = 0) => {
//     try {
//       await adminApiService.markPayment(orderId, { method, tip })
//       toast.success(`Payment recorded (${method})`)
//       setPayModal(null)
//       loadOrders()
//     } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
//   }

//   return (
//     <div className="space-y-4">
//       {/* Toolbar */}
//       <div className="card p-4 flex flex-col sm:flex-row gap-3">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
//           <input className="input pl-9" placeholder="Search order #, table, customer…"
//             value={search} onChange={e => { setSearch(e.target.value); doSearch() }} />
//         </div>
//         <Select value={statusFilter} onChange={setStatus} placeholder="All Status"
//           options={['placed','confirmed','preparing','ready','served','cancelled'].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))}
//           className="w-40"
//         />
//         <button onClick={loadOrders} className="btn-ghost p-2.5"><RefreshCw className="w-4 h-4" /></button>
//       </div>

//       {/* View tabs */}
//       <Tabs
//         tabs={[{ value: 'all', label: 'All Orders' }, { value: 'live', label: '🔴 Live', icon: '' }, { value: 'kds', label: '👨‍🍳 Kitchen' }]}
//         active={view} onChange={v => { setView(v); setPage(1) }}
//       />

//       {/* KDS view */}
//       {view === 'kds' && (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {loading ? [...Array(6)].map((_,i) => <div key={i} className="card p-4 animate-pulse h-40 bg-surface-100" />)
//           : orders.filter(o => ['placed','confirmed','preparing'].includes(o.status)).map(order => (
//             <KDSCard key={order._id} order={order} curr={curr} onUpdate={updateStatus} />
//           ))}
//           {!loading && orders.filter(o => ['placed','confirmed','preparing'].includes(o.status)).length === 0 && (
//             <div className="col-span-full"><Empty icon="🍳" title="Kitchen is clear!" desc="No active orders to prepare" /></div>
//           )}
//         </div>
//       )}

//       {/* Orders list */}
//       {view !== 'kds' && (
//         <div className="card overflow-hidden">
//           {loading ? (
//             <div className="divide-y divide-surface-50">{[...Array(8)].map((_,i) => <SkeletonRow key={i} />)}</div>
//           ) : orders.length === 0 ? (
//             <Empty icon="📋" title="No orders found" desc="Try adjusting your filters" />
//           ) : (
//             <div className="divide-y divide-surface-50">
//               {orders.map(order => (
//                 <OrderRow key={order._id} order={order} curr={curr}
//                   onClick={() => setSelected(order)}
//                   onStatusUpdate={updateStatus}
//                   onPayment={() => setPayModal(order)}
//                 />
//               ))}
//             </div>
//           )}
//           {/* Pagination */}
//           {!loading && total > 20 && (
//             <div className="p-4 border-t border-surface-100 flex items-center justify-between text-sm text-surface-500">
//               <span>Showing {(page-1)*20+1}–{Math.min(page*20, total)} of {total}</span>
//               <div className="flex gap-2">
//                 <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
//                 <button disabled={page*20>=total} onClick={() => setPage(p=>p+1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Order detail modal */}
//       <OrderDetailModal order={selectedOrder} curr={curr}
//         onClose={() => setSelected(null)}
//         onStatusUpdate={updateStatus}
//         onPayment={setPayModal}
//         onCancel={setCancel}
//       />

//       {/* Payment modal */}
//       <PaymentModal order={payModal} curr={curr} onClose={() => setPayModal(null)} onConfirm={markPayment} />

//       {/* Cancel confirm */}
//       <Confirm open={!!cancelConfirm} onClose={() => setCancel(null)} danger
//         title="Cancel Order?" message="This action cannot be undone."
//         confirmText="Cancel Order"
//         onConfirm={() => cancelOrder(cancelConfirm, 'Cancelled by admin')}
//       />
//     </div>
//   )
// }

// // ─── Order Row ────────────────────────────────────────────────────────────────
// const OrderRow = ({ order, curr, onClick, onStatusUpdate, onPayment }) => {
//   const flow = STATUS_FLOW[order.status]
//   return (
//     <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 cursor-pointer transition-colors" onClick={onClick}>
//       <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0">
//         {order.tableNumber}
//       </div>
//       <div className="flex-1 min-w-0">
//         <div className="flex items-center gap-2">
//           <p className="text-sm font-semibold text-surface-900">#{order.orderNumber}</p>
//           <StatusBadge status={order.status} />
//           {order.payment?.status === 'pending' && order.status === 'served' && (
//             <span className="badge bg-amber-50 text-amber-700 border border-amber-200">💳 Unpaid</span>
//           )}
//         </div>
//         <p className="text-xs text-surface-400">{order.customerName || 'Guest'} · {order.items?.length} items · {fmt.relTime(order.createdAt)}</p>
//       </div>
//       <div className="text-right flex-shrink-0">
//         <p className="font-semibold text-surface-900 text-sm">{fmt.currency(order.pricing?.grandTotal, curr)}</p>
//         {flow && (
//           <button
//             onClick={e => { e.stopPropagation(); onStatusUpdate(order._id, flow.next) }}
//             className={cn('text-[10px] text-white px-2 py-0.5 rounded-md mt-1 transition-opacity hover:opacity-90', flow.color)}
//           >
//             {flow.label}
//           </button>
//         )}
//       </div>
//     </div>
//   )
// }

// // ─── KDS Card ─────────────────────────────────────────────────────────────────
// const KDSCard = ({ order, curr, onUpdate }) => {
//   const flow = STATUS_FLOW[order.status]
//   const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
//   const urgent  = elapsed > (order.estimatedTime || 20)

//   return (
//     <motion.div layout className={cn('card overflow-hidden border-2 transition-all', urgent ? 'border-red-300' : 'border-transparent')}>
//       <div className={cn('px-4 py-2 flex items-center justify-between text-sm', urgent ? 'bg-red-50' : 'bg-surface-50')}>
//         <span className="font-bold text-surface-800">Table {order.tableNumber}</span>
//         <div className="flex items-center gap-1.5">
//           <Clock className={cn('w-3.5 h-3.5', urgent ? 'text-red-500' : 'text-surface-400')} />
//           <span className={cn('font-medium', urgent ? 'text-red-500' : 'text-surface-500')}>{elapsed}m</span>
//           <StatusBadge status={order.status} />
//         </div>
//       </div>
//       <div className="p-4 space-y-1.5">
//         {order.items?.map(item => (
//           <div key={item._id} className="flex items-start gap-2 text-sm">
//             <span className="font-bold text-surface-800 w-5">{item.quantity}×</span>
//             <div className="flex-1">
//               <p className="font-medium text-surface-800">{item.productName}</p>
//               {item.selectedVariants?.length > 0 && (
//                 <p className="text-xs text-surface-400">{item.selectedVariants.map(v=>`${v.name}: ${v.selected}`).join(', ')}</p>
//               )}
//               {item.specialInstructions && (
//                 <p className="text-xs text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 mt-0.5">⚠️ {item.specialInstructions}</p>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//       {flow && (
//         <div className="px-4 pb-4">
//           <button onClick={() => onUpdate(order._id, flow.next)}
//             className={cn('w-full py-2 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90', flow.color)}>
//             {flow.label} →
//           </button>
//         </div>
//       )}
//     </motion.div>
//   )
// }

// // ─── Order Detail Modal ───────────────────────────────────────────────────────
// const OrderDetailModal = ({ order, curr, onClose, onStatusUpdate, onPayment, onCancel }) => {
//   if (!order) return null
//   const flow = STATUS_FLOW[order.status]
//   return (
//     <Modal open={!!order} onClose={onClose} title={`Order #${order.orderNumber}`} size="lg">
//       <div className="p-5 space-y-4">
//         {/* Meta */}
//         <div className="grid grid-cols-2 gap-3 text-sm">
//           <div className="bg-surface-50 rounded-xl p-3">
//             <p className="text-surface-400 text-xs mb-0.5">Table</p>
//             <p className="font-semibold">{order.tableNumber}</p>
//           </div>
//           <div className="bg-surface-50 rounded-xl p-3">
//             <p className="text-surface-400 text-xs mb-0.5">Status</p>
//             <StatusBadge status={order.status} />
//           </div>
//           <div className="bg-surface-50 rounded-xl p-3">
//             <p className="text-surface-400 text-xs mb-0.5">Customer</p>
//             <p className="font-semibold">{order.customerName || 'Guest'} ({order.guestCount} guests)</p>
//           </div>
//           <div className="bg-surface-50 rounded-xl p-3">
//             <p className="text-surface-400 text-xs mb-0.5">Time</p>
//             <p className="font-semibold">{fmt.datetime(order.createdAt)}</p>
//           </div>
//         </div>

//         {/* Items */}
//         <div>
//           <p className="font-semibold text-sm text-surface-700 mb-2">Items</p>
//           <div className="space-y-1.5">
//             {order.items?.map(item => (
//               <div key={item._id} className="flex items-start gap-2 text-sm p-2 bg-surface-50 rounded-lg">
//                 <span className="font-bold text-surface-700 w-5">{item.quantity}×</span>
//                 <div className="flex-1">
//                   <p className="font-medium text-surface-800">{item.productName}</p>
//                   {item.selectedVariants?.length > 0 && <p className="text-xs text-surface-400">{item.selectedVariants.map(v=>`${v.name}: ${v.selected}`).join(', ')}</p>}
//                   {item.specialInstructions && <p className="text-xs text-amber-600 mt-0.5">⚠️ {item.specialInstructions}</p>}
//                 </div>
//                 <span className="font-medium">{fmt.currency(item.total, curr)}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Bill */}
//         <div className="bg-surface-50 rounded-xl p-4 space-y-1.5 text-sm">
//           <div className="flex justify-between text-surface-500"><span>Subtotal</span><span>{fmt.currency(order.pricing?.subtotal, curr)}</span></div>
//           {order.pricing?.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{fmt.currency(order.pricing.discount, curr)}</span></div>}
//           <div className="flex justify-between text-surface-500"><span>GST ({order.pricing?.taxRate}%)</span><span>{fmt.currency(order.pricing?.tax, curr)}</span></div>
//           <div className="border-t border-surface-200 pt-1.5 flex justify-between font-bold text-surface-900">
//             <span>TOTAL</span><span>{fmt.currency(order.pricing?.grandTotal, curr)}</span>
//           </div>
//         </div>

//         {/* Payment status */}
//         <div className="flex items-center gap-2">
//           <span className="text-sm text-surface-600">Payment:</span>
//           <StatusBadge status={order.payment?.status || 'pending'} />
//           {order.payment?.method && <span className="text-xs text-surface-500 capitalize">({order.payment.method})</span>}
//         </div>

//         {/* Actions */}
//         <div className="flex flex-wrap gap-2 pt-2">
//           {flow && (
//             <button onClick={() => { onStatusUpdate(order._id, flow.next); onClose() }}
//               className={cn('btn-primary flex-1', flow.color === 'bg-surface-700' && 'bg-surface-700 hover:bg-surface-800')}>
//               {flow.label}
//             </button>
//           )}
//           {order.payment?.status !== 'paid' && order.status !== 'cancelled' && (
//             <button onClick={() => onPayment(order)} className="btn-secondary flex-1">
//               <CreditCard className="w-4 h-4" /> Record Payment
//             </button>
//           )}
//           {!['served','cancelled','refunded'].includes(order.status) && (
//             <button onClick={() => { onCancel(order._id); onClose() }} className="btn-ghost text-red-500 hover:bg-red-50 px-3 py-2">
//               <XCircle className="w-4 h-4" />
//             </button>
//           )}
//         </div>
//       </div>
//     </Modal>
//   )
// }

// // ─── Payment Modal ────────────────────────────────────────────────────────────
// const PaymentModal = ({ order, curr, onClose, onConfirm }) => {
//   const [method, setMethod] = useState('cash')
//   const [tip, setTip]       = useState(0)
//   if (!order) return null
//   const total = (order.pricing?.grandTotal || 0) + tip
//   return (
//     <Modal open={!!order} onClose={onClose} title="Record Payment" size="sm">
//       <div className="p-5 space-y-4">
//         <div>
//           <p className="text-sm font-semibold text-surface-700 mb-2">Payment Method</p>
//           <div className="grid grid-cols-3 gap-2">
//             {['cash','card','upi'].map(m => (
//               <button key={m} onClick={() => setMethod(m)}
//                 className={cn('py-3 rounded-xl border text-sm font-medium capitalize transition-all',
//                   method === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600')}>
//                 {m === 'cash' ? '💵' : m === 'card' ? '💳' : '📱'} {m.toUpperCase()}
//               </button>
//             ))}
//           </div>
//         </div>
//         <div>
//           <label className="text-sm font-semibold text-surface-700 block mb-1">Tip (optional)</label>
//           <input type="number" className="input" placeholder="0" min={0}
//             value={tip || ''} onChange={e => setTip(parseFloat(e.target.value) || 0)} />
//         </div>
//         <div className="bg-surface-50 rounded-xl p-3 flex justify-between font-bold">
//           <span>Total to collect</span>
//           <span className="text-brand-600">{fmt.currency(total, curr)}</span>
//         </div>
//         <button onClick={() => onConfirm(order._id, method, tip)}
//           className="btn-primary w-full py-3">Confirm Payment</button>
//       </div>
//     </Modal>
//   )
// }


















import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Search, RefreshCw, Clock, CheckCircle, XCircle, CreditCard, Receipt, Printer, Download, AlertCircle } from 'lucide-react'
import { adminApiService } from '@/services/api'
import { useAdminStore } from '@/store'
import { fmt, cn, STATUS_COLORS, STATUS_LABELS, debounce } from '@/utils/helpers'
import { Spinner, Modal, StatusBadge, Empty, SkeletonRow, Select, Tabs, Confirm } from '@/components/ui'


const STATUS_FLOW = {
  placed    : { next: 'confirmed', label: 'Confirm Order',   color: 'bg-indigo-500' },
  confirmed : { next: 'preparing', label: 'Start Preparing', color: 'bg-amber-500' },
  preparing : { next: 'ready',    label: 'Mark Ready',      color: 'bg-green-500' },
  ready     : { next: 'served',   label: 'Mark Served',     color: 'bg-surface-700' },
}

export const OrdersPage = () => {
  const { restaurant } = useAdminStore()
  const curr = restaurant?.settings?.currencySymbol || '₹'

  const [orders, setOrders]       = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('all')
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')
  const [selectedOrder, setSelected] = useState(null)
  const [payModal, setPayModal]   = useState(null)
  const [cancelConfirm, setCancel] = useState(null)
  // ✅ NEW: bill modal state
  const [billOrderId, setBillOrderId] = useState(null)

  useEffect(() => { loadOrders() }, [page, view, statusFilter])

  const doSearch = useCallback(debounce(() => loadOrders(), 400), [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      if (view === 'live' || view === 'kds') {
        const { data } = await adminApiService.getLiveOrders()
        setOrders(data.data.orders || [])
        setTotal(data.data.orders?.length || 0)
      } else {
        const params = { page, limit: 20, search: search || undefined, status: statusFilter || undefined }
        const { data } = await adminApiService.getOrders(params)
        setOrders(data.data.orders)
        setTotal(data.pagination.total)
      }
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  const updateStatus = async (orderId, status, note = '') => {
    try {
      await adminApiService.updateStatus(orderId, { status, note })
      toast.success(`Order → ${status}`)
      loadOrders()
      if (selectedOrder?._id === orderId) setSelected(prev => ({ ...prev, status }))
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const cancelOrder = async (orderId, reason) => {
    try {
      await adminApiService.cancelOrder(orderId, { reason })
      toast.success('Order cancelled')
      loadOrders()
      setSelected(null)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const markPayment = async (orderId, method, tip = 0) => {
    try {
      await adminApiService.markPayment(orderId, { method, tip })
      toast.success(`Payment recorded (${method})`)
      setPayModal(null)
      loadOrders()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input className="input pl-9" placeholder="Search order #, table, customer…"
            value={search} onChange={e => { setSearch(e.target.value); doSearch() }} />
        </div>
        <Select value={statusFilter} onChange={setStatus} placeholder="All Status"
          options={['placed','confirmed','preparing','ready','served','cancelled'].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))}
          className="w-40"
        />
        <button onClick={loadOrders} className="btn-ghost p-2.5"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* View tabs */}
      <Tabs
        tabs={[{ value: 'all', label: 'All Orders' }, { value: 'live', label: '🔴 Live' }, { value: 'kds', label: '👨‍🍳 Kitchen' }]}
        active={view} onChange={v => { setView(v); setPage(1) }}
      />

      {/* KDS view */}
      {view === 'kds' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? [...Array(6)].map((_,i) => <div key={i} className="card p-4 animate-pulse h-40 bg-surface-100" />)
          : orders.filter(o => ['placed','confirmed','preparing'].includes(o.status)).map(order => (
            <KDSCard key={order._id} order={order} curr={curr} onUpdate={updateStatus} />
          ))}
          {!loading && orders.filter(o => ['placed','confirmed','preparing'].includes(o.status)).length === 0 && (
            <div className="col-span-full"><Empty icon="🍳" title="Kitchen is clear!" desc="No active orders to prepare" /></div>
          )}
        </div>
      )}

      {/* Orders list */}
      {view !== 'kds' && (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="divide-y divide-surface-50">{[...Array(8)].map((_,i) => <SkeletonRow key={i} />)}</div>
          ) : orders.length === 0 ? (
            <Empty icon="📋" title="No orders found" desc="Try adjusting your filters" />
          ) : (
            <div className="divide-y divide-surface-50">
              {orders.map(order => (
                <OrderRow key={order._id} order={order} curr={curr}
                  onClick={() => setSelected(order)}
                  onStatusUpdate={updateStatus}
                  onPayment={() => setPayModal(order)}
                />
              ))}
            </div>
          )}
          {!loading && total > 20 && (
            <div className="p-4 border-t border-surface-100 flex items-center justify-between text-sm text-surface-500">
              <span>Showing {(page-1)*20+1}–{Math.min(page*20, total)} of {total}</span>
              <div className="flex gap-2">
                <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
                <button disabled={page*20>=total} onClick={() => setPage(p=>p+1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order detail modal */}
      <OrderDetailModal order={selectedOrder} curr={curr}
        onClose={() => setSelected(null)}
        onStatusUpdate={updateStatus}
        onPayment={setPayModal}
        onCancel={setCancel}
        // ✅ NEW: pass bill opener
        onViewBill={(id) => { setSelected(null); setBillOrderId(id) }}
      />

      {/* Payment modal */}
      <PaymentModal order={payModal} curr={curr} onClose={() => setPayModal(null)} onConfirm={markPayment} />

      {/* Cancel confirm */}
      <Confirm open={!!cancelConfirm} onClose={() => setCancel(null)} danger
        title="Cancel Order?" message="This action cannot be undone."
        confirmText="Cancel Order"
        onConfirm={() => cancelOrder(cancelConfirm, 'Cancelled by admin')}
      />

      {/* ✅ NEW: Order bill modal */}
      <AdminOrderBillModal orderId={billOrderId} curr={curr} onClose={() => setBillOrderId(null)} />
    </div>
  )
}

// ─── Order Row ────────────────────────────────────────────────────────────────
const OrderRow = ({ order, curr, onClick, onStatusUpdate, onPayment }) => {
  const flow = STATUS_FLOW[order.status]
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 cursor-pointer transition-colors" onClick={onClick}>
      <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0">
        {order.tableNumber}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-surface-900">#{order.orderNumber}</p>
          <StatusBadge status={order.status} />
          {order.payment?.status === 'pending' && order.status === 'served' && (
            <span className="badge bg-amber-50 text-amber-700 border border-amber-200">💳 Unpaid</span>
          )}
        </div>
        <p className="text-xs text-surface-400">{order.customerName || 'Guest'} · {order.items?.length} items · {fmt.relTime(order.createdAt)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-surface-900 text-sm">{fmt.currency(order.pricing?.grandTotal, curr)}</p>
        {flow && (
          <button
            onClick={e => { e.stopPropagation(); onStatusUpdate(order._id, flow.next) }}
            className={cn('text-[10px] text-white px-2 py-0.5 rounded-md mt-1 transition-opacity hover:opacity-90', flow.color)}
          >
            {flow.label}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── KDS Card ─────────────────────────────────────────────────────────────────
const KDSCard = ({ order, curr, onUpdate }) => {
  const flow    = STATUS_FLOW[order.status]
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
  const urgent  = elapsed > (order.estimatedTime || 20)

  return (
    <motion.div layout className={cn('card overflow-hidden border-2 transition-all', urgent ? 'border-red-300' : 'border-transparent')}>
      <div className={cn('px-4 py-2 flex items-center justify-between text-sm', urgent ? 'bg-red-50' : 'bg-surface-50')}>
        <span className="font-bold text-surface-800">Table {order.tableNumber}</span>
        <div className="flex items-center gap-1.5">
          <Clock className={cn('w-3.5 h-3.5', urgent ? 'text-red-500' : 'text-surface-400')} />
          <span className={cn('font-medium', urgent ? 'text-red-500' : 'text-surface-500')}>{elapsed}m</span>
          <StatusBadge status={order.status} />
        </div>
      </div>
      <div className="p-4 space-y-1.5">
        {order.items?.map(item => (
          <div key={item._id} className="flex items-start gap-2 text-sm">
            <span className="font-bold text-surface-800 w-5">{item.quantity}×</span>
            <div className="flex-1">
              <p className="font-medium text-surface-800">{item.productName}</p>
              {item.selectedVariants?.length > 0 && (
                <p className="text-xs text-surface-400">{item.selectedVariants.map(v=>`${v.name}: ${v.selected}`).join(', ')}</p>
              )}
              {item.specialInstructions && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 mt-0.5">⚠️ {item.specialInstructions}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {flow && (
        <div className="px-4 pb-4">
          <button onClick={() => onUpdate(order._id, flow.next)}
            className={cn('w-full py-2 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90', flow.color)}>
            {flow.label} →
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
// ✅ CHANGED: added onViewBill prop, added "View Bill" button
const OrderDetailModal = ({ order, curr, onClose, onStatusUpdate, onPayment, onCancel, onViewBill }) => {
  if (!order) return null
  const flow = STATUS_FLOW[order.status]
  return (
    <Modal open={!!order} onClose={onClose} title={`Order #${order.orderNumber}`} size="lg">
      <div className="p-5 space-y-4">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-surface-50 rounded-xl p-3">
            <p className="text-surface-400 text-xs mb-0.5">Table</p>
            <p className="font-semibold">{order.tableNumber}</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-3">
            <p className="text-surface-400 text-xs mb-0.5">Status</p>
            <StatusBadge status={order.status} />
          </div>
          <div className="bg-surface-50 rounded-xl p-3">
            <p className="text-surface-400 text-xs mb-0.5">Customer</p>
            <p className="font-semibold">{order.customerName || 'Guest'} ({order.guestCount} guests)</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-3">
            <p className="text-surface-400 text-xs mb-0.5">Time</p>
            <p className="font-semibold">{fmt.datetime(order.createdAt)}</p>
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="font-semibold text-sm text-surface-700 mb-2">Items</p>
          <div className="space-y-1.5">
            {order.items?.map(item => (
              <div key={item._id} className="flex items-start gap-2 text-sm p-2 bg-surface-50 rounded-lg">
                <span className="font-bold text-surface-700 w-5">{item.quantity}×</span>
                <div className="flex-1">
                  <p className="font-medium text-surface-800">{item.productName}</p>
                  {item.selectedVariants?.length > 0 && <p className="text-xs text-surface-400">{item.selectedVariants.map(v=>`${v.name}: ${v.selected}`).join(', ')}</p>}
                  {item.specialInstructions && <p className="text-xs text-amber-600 mt-0.5">⚠️ {item.specialInstructions}</p>}
                </div>
                <span className="font-medium">{fmt.currency(item.total, curr)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill summary */}
        <div className="bg-surface-50 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-surface-500"><span>Subtotal</span><span>{fmt.currency(order.pricing?.subtotal, curr)}</span></div>
          {order.pricing?.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{fmt.currency(order.pricing.discount, curr)}</span></div>}
          <div className="flex justify-between text-surface-500"><span>GST ({order.pricing?.taxRate}%)</span><span>{fmt.currency(order.pricing?.tax, curr)}</span></div>
          <div className="border-t border-surface-200 pt-1.5 flex justify-between font-bold text-surface-900">
            <span>TOTAL</span><span>{fmt.currency(order.pricing?.grandTotal, curr)}</span>
          </div>
        </div>

        {/* Payment status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-600">Payment:</span>
          <StatusBadge status={order.payment?.status || 'pending'} />
          {order.payment?.method && <span className="text-xs text-surface-500 capitalize">({order.payment.method})</span>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {flow && (
            <button onClick={() => { onStatusUpdate(order._id, flow.next); onClose() }}
              className={cn('btn-primary flex-1', flow.color === 'bg-surface-700' && 'bg-surface-700 hover:bg-surface-800')}>
              {flow.label}
            </button>
          )}
          {order.payment?.status !== 'paid' && order.status !== 'cancelled' && (
            <button onClick={() => onPayment(order)} className="btn-secondary flex-1">
              <CreditCard className="w-4 h-4" /> Record Payment
            </button>
          )}
          {/* ✅ NEW: View Bill button */}
          <button onClick={() => onViewBill(order._id)} className="btn-secondary flex-1">
            <Receipt className="w-4 h-4" /> View Bill
          </button>
          {!['served','cancelled','refunded'].includes(order.status) && (
            <button onClick={() => { onCancel(order._id); onClose() }} className="btn-ghost text-red-500 hover:bg-red-50 px-3 py-2">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
const PaymentModal = ({ order, curr, onClose, onConfirm }) => {
  const [method, setMethod] = useState('cash')
  const [tip, setTip]       = useState(0)
  if (!order) return null
  const total = (order.pricing?.grandTotal || 0) + tip
  return (
    <Modal open={!!order} onClose={onClose} title="Record Payment" size="sm">
      <div className="p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-surface-700 mb-2">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {['cash','card','upi'].map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={cn('py-3 rounded-xl border text-sm font-medium capitalize transition-all',
                  method === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600')}>
                {m === 'cash' ? '💵' : m === 'card' ? '💳' : '📱'} {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-surface-700 block mb-1">Tip (optional)</label>
          <input type="number" className="input" placeholder="0" min={0}
            value={tip || ''} onChange={e => setTip(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="bg-surface-50 rounded-xl p-3 flex justify-between font-bold">
          <span>Total to collect</span>
          <span className="text-brand-600">{fmt.currency(total, curr)}</span>
        </div>
        <button onClick={() => onConfirm(order._id, method, tip)} className="btn-primary w-full py-3">
          Confirm Payment
        </button>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ NEW: ADMIN ORDER BILL MODAL
// ═══════════════════════════════════════════════════════════════════════════════
const PayChip = ({ status }) => (
  <span className={cn(
    'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
    status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
  )}>
    {status === 'paid' ? <><CheckCircle className="w-3 h-3" /> Paid</> : <><AlertCircle className="w-3 h-3" /> Unpaid</>}
  </span>
)

const AdminOrderBillModal = ({ orderId, curr, onClose }) => {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orderId) return
    setData(null)
    setLoading(true)
    adminApiService.getOrderBill(orderId)
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load bill'))
      .finally(() => setLoading(false))
  }, [orderId])

  const handlePrint = () => {
    if (!data) return
    const { order, restaurant, bill } = data
    const c   = restaurant.settings.currencySymbol
    const p   = bill?.pricing || {}
    const itemRows = (order.items || []).map(item =>
      `<tr><td>${item.productName}${item.selectedVariants?.length ? ` (${item.selectedVariants.map(v=>v.selected).join(', ')})` : ''}</td><td align="center">${item.quantity}</td><td align="right">${c}${(item.total||0).toFixed(2)}</td></tr>`
    ).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>body{font-family:'Courier New',monospace;font-size:12px;max-width:320px;margin:0 auto;padding:12px}h1{font-size:16px;text-align:center;margin:0 0 4px}.center{text-align:center}.muted{color:#666;font-size:11px}table{width:100%;border-collapse:collapse;margin:8px 0}td{padding:3px 0;vertical-align:top}.divider{border-top:1px dashed #999;margin:8px 0}.bold{font-weight:bold;font-size:14px}@media print{body{margin:0}}</style>
    </head><body>
    <h1>${restaurant.name}</h1>
    <p class="center muted">${restaurant.address?.street || ''}</p>
    ${restaurant.gstin ? `<p class="center muted">GSTIN: ${restaurant.gstin}</p>` : ''}
    <div class="divider"></div>
    <p>Order: <strong>#${order.orderNumber}</strong></p>
    <p>Table: <strong>${order.tableNumber}</strong></p>
    <p>Customer: ${order.customerName || 'Guest'}</p>
    <p class="muted">${new Date(order.createdAt).toLocaleString()}</p>
    <div class="divider"></div>
    <table><thead><tr><th align="left">Item</th><th>Qty</th><th align="right">Amt</th></tr></thead><tbody>${itemRows}</tbody></table>
    <div class="divider"></div>
    <table>
      <tr><td>Subtotal</td><td align="right">${c}${(p.subtotal||0).toFixed(2)}</td></tr>
      ${p.discount>0?`<tr><td>Discount</td><td align="right">-${c}${(p.discount||0).toFixed(2)}</td></tr>`:''}
      <tr><td>GST (${p.taxRate}%)</td><td align="right">${c}${(p.tax||0).toFixed(2)}</td></tr>
      ${p.serviceCharge>0?`<tr><td>Service Charge</td><td align="right">${c}${(p.serviceCharge||0).toFixed(2)}</td></tr>`:''}
      ${p.tip>0?`<tr><td>Tip</td><td align="right">${c}${(p.tip||0).toFixed(2)}</td></tr>`:''}
      <tr><td colspan="2"><div class="divider"></div></td></tr>
      <tr class="bold"><td>TOTAL</td><td align="right">${c}${(p.grandTotal||0).toFixed(2)}</td></tr>
    </table>
    <div class="divider"></div>
    <p class="center muted">Thank you for dining with us!</p>
    </body></html>`
    const win = window.open('', '_blank', 'width=420,height=700')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  return (
    <Modal open={!!orderId} onClose={onClose} title="Order Bill" size="sm">
      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner /></div>
      ) : !data ? (
        <div className="p-6 text-center text-surface-400">Failed to load bill</div>
      ) : (
        <div className="p-5 space-y-4">
          {/* Restaurant header */}
          <div className="text-center space-y-0.5">
            {data.restaurant.logo && <img src={data.restaurant.logo} alt="" className="w-12 h-12 object-cover rounded-xl mx-auto mb-2" />}
            <h2 className="font-display text-lg font-bold text-surface-900">{data.restaurant.name}</h2>
            {data.restaurant.address?.street && <p className="text-xs text-surface-400">{data.restaurant.address.street}, {data.restaurant.address.city}</p>}
            {data.restaurant.phone && <p className="text-xs text-surface-400">{data.restaurant.phone}</p>}
            {data.restaurant.gstin && <p className="text-xs text-surface-400">GSTIN: {data.restaurant.gstin}</p>}
          </div>

          {/* Order meta */}
          <div className="bg-surface-50 rounded-xl p-3 grid grid-cols-2 gap-y-2 text-sm">
            <div><p className="text-xs text-surface-400">Order</p><p className="font-semibold">#{data.order.orderNumber}</p></div>
            <div><p className="text-xs text-surface-400">Table</p><p className="font-semibold">{data.order.tableNumber}</p></div>
            <div><p className="text-xs text-surface-400">Customer</p><p className="font-semibold">{data.order.customerName || 'Guest'}</p></div>
            <div><p className="text-xs text-surface-400">Date & Time</p><p className="font-semibold">{fmt.datetime(data.order.createdAt)}</p></div>
          </div>

          {/* Items */}
          <div className="space-y-1 border-t border-dashed border-surface-200 pt-3">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Items</p>
            {(data.bill?.items || []).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-surface-700 flex-1">
                  {item.productName}
                  {item.selectedVariants?.length > 0 && <span className="text-xs text-surface-400 ml-1">({item.selectedVariants.map(v=>v.selected).join(', ')})</span>}
                </span>
                <span className="text-surface-500 mx-3">×{item.quantity}</span>
                <span className="font-medium text-surface-800">{fmt.currency(item.total, data.restaurant.settings.currencySymbol)}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="border-t border-dashed border-surface-200 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-surface-500"><span>Subtotal</span><span>{fmt.currency(data.bill?.pricing?.subtotal, data.restaurant.settings.currencySymbol)}</span></div>
            {data.order.pricing?.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{fmt.currency(data.order.pricing.discount, data.restaurant.settings.currencySymbol)}</span></div>}
            <div className="flex justify-between text-surface-500"><span>GST ({data.order.pricing?.taxRate}%)</span><span>{fmt.currency(data.bill?.pricing?.tax, data.restaurant.settings.currencySymbol)}</span></div>
            {data.order.pricing?.serviceCharge > 0 && <div className="flex justify-between text-surface-500"><span>Service Charge</span><span>{fmt.currency(data.order.pricing.serviceCharge, data.restaurant.settings.currencySymbol)}</span></div>}
            {data.order.pricing?.tip > 0 && <div className="flex justify-between text-surface-500"><span>Tip</span><span>{fmt.currency(data.order.pricing.tip, data.restaurant.settings.currencySymbol)}</span></div>}
            <div className="border-t border-surface-200 pt-1.5 flex justify-between font-bold text-surface-900">
              <span>TOTAL</span><span>
  {fmt.currency(
    ((data.bill?.pricing?.subtotal || 0)
      - (data.bill?.pricing?.discount || 0)
      + (data.bill?.pricing?.tax || 0)
      + (data.bill?.pricing?.serviceCharge || 0)
      + (data.bill?.pricing?.tip || 0)
    ),
    data.restaurant.settings.currencySymbol
  )}
</span>
            </div>
          </div>

          {/* Payment */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-surface-600">Payment Status</span>
            <PayChip status={data.order.payment?.status || 'pending'} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handlePrint} className="btn-secondary flex-1 gap-2 justify-center">
              <Printer className="w-4 h-4" /> Print
            </button>
            <a href={`/api/bills/${data.order._id}/download`} target="_blank" rel="noreferrer"
              className="btn-primary flex-1 gap-2 justify-center flex items-center">
              <Download className="w-4 h-4" /> PDF
            </a>
          </div>
        </div>
      )}
    </Modal>
  )
}

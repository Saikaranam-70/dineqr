// ─────────────────────────────────────────────────────────────────────────────
// 1.  API SERVICE ADDITIONS
//     Add these two lines inside adminApiService in your api.js
// ─────────────────────────────────────────────────────────────────────────────
//
//   getOrderBill:    (id)  => adminApi.get(`/admin/orders/${id}/bill`),
//   getSessionBill:  (id)  => adminApi.get(`/admin/tables/sessions/${id}/bill`),
//
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// 2.  BILL COMPONENTS
//     File: src/components/admin/BillModals.jsx
//     Import and use wherever needed (see integration notes at the bottom)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, Download, X, Receipt, Clock, Users, Hash, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApiService } from '@/services/api'
import { fmt, cn } from '@/utils/helpers'
import { Spinner, Modal } from '@/components/ui'

// ─── Shared print helper ──────────────────────────────────────────────────────
function printBillHtml(html) {
  const win = window.open('', '_blank', 'width=420,height=700')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ─── Shared bill line ─────────────────────────────────────────────────────────
const BillLine = ({ label, value, bold, green, red, small, border }) => (
  <div className={cn(
    'flex items-center justify-between',
    small  ? 'text-xs text-surface-400' : 'text-sm',
    bold   ? 'font-bold text-surface-900' : 'text-surface-600',
    green  ? 'text-green-600' : '',
    red    ? 'text-red-500'   : '',
    border ? 'border-t border-dashed border-surface-200 pt-2 mt-1' : '',
  )}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
)

// ─── Status chip ──────────────────────────────────────────────────────────────
const PayChip = ({ status }) => (
  <span className={cn(
    'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
    status === 'paid'
      ? 'bg-green-100 text-green-700'
      : 'bg-amber-100 text-amber-700',
  )}>
    {status === 'paid'
      ? <><CheckCircle className="w-3 h-3" /> Paid</>
      : <><AlertCircle className="w-3 h-3" /> Unpaid</>}
  </span>
)

// =============================================================================
// ADMIN PER-ORDER BILL MODAL
// Usage: <AdminOrderBillModal orderId={id} curr="₹" onClose={() => …} />
// Trigger from OrderDetailModal — replace the old generateBill button
// =============================================================================
export const AdminOrderBillModal = ({ orderId, curr = '₹', onClose }) => {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    adminApiService.getOrderBill(orderId)
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load bill'))
      .finally(() => setLoading(false))
  }, [orderId])

  const handlePrint = () => {
    if (!data) return
    const { order, restaurant, bill } = data
    const curr_ = restaurant.settings.currencySymbol
    const html = buildOrderPrintHtml({ order, restaurant, bill, curr: curr_ })
    printBillHtml(html)
  }

  return (
    <Modal open={!!orderId} onClose={onClose} title="Order Bill" size="sm">
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner />
        </div>
      ) : data ? (
        <OrderBillContent data={data} curr={curr} onPrint={handlePrint} />
      ) : (
        <div className="p-6 text-center text-surface-400">Failed to load bill</div>
      )}
    </Modal>
  )
}

// ─── Order bill content ───────────────────────────────────────────────────────
const OrderBillContent = ({ data, onPrint }) => {
  const { order, restaurant, bill } = data
  const curr = restaurant.settings.currencySymbol
  const p    = order.pricing || bill?.pricing || {}

  return (
    <div className="p-5 space-y-4">
      {/* Restaurant header */}
      <div className="text-center space-y-0.5">
        {restaurant.logo && (
          <img src={restaurant.logo} alt="" className="w-12 h-12 object-cover rounded-xl mx-auto mb-2" />
        )}
        <h2 className="font-display text-lg font-bold text-surface-900">{restaurant.name}</h2>
        {restaurant.address?.street && (
          <p className="text-xs text-surface-400">{restaurant.address.street}, {restaurant.address.city}</p>
        )}
        {restaurant.phone && <p className="text-xs text-surface-400">{restaurant.phone}</p>}
        {restaurant.gstin && <p className="text-xs text-surface-400">GSTIN: {restaurant.gstin}</p>}
      </div>

      {/* Order meta */}
      <div className="bg-surface-50 rounded-xl p-3 grid grid-cols-2 gap-y-2 text-sm">
        <div>
          <p className="text-xs text-surface-400">Order</p>
          <p className="font-semibold text-surface-800">#{order.orderNumber}</p>
        </div>
        <div>
          <p className="text-xs text-surface-400">Table</p>
          <p className="font-semibold text-surface-800">{order.tableNumber}</p>
        </div>
        <div>
          <p className="text-xs text-surface-400">Customer</p>
          <p className="font-semibold text-surface-800">{order.customerName || 'Guest'}</p>
        </div>
        <div>
          <p className="text-xs text-surface-400">Date & Time</p>
          <p className="font-semibold text-surface-800">{fmt.datetime(order.createdAt)}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 border-t border-dashed border-surface-200 pt-3">
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Items</p>
        {(bill?.items || []).map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-surface-700 flex-1">
              {item.productName}
              {item.selectedVariants?.length > 0 && (
                <span className="text-xs text-surface-400 ml-1">
                  ({item.selectedVariants.map(v => v.selected).join(', ')})
                </span>
              )}
            </span>
            <span className="text-surface-500 mx-3">×{item.quantity}</span>
            <span className="font-medium text-surface-800">{fmt.currency(item.total, curr)}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="border-t border-dashed border-surface-200 pt-3 space-y-1.5">
        <BillLine label="Subtotal" value={fmt.currency(p.subtotal, curr)} />
        {p.discount > 0 && <BillLine label="Discount" value={`−${fmt.currency(p.discount, curr)}`} green />}
        <BillLine label={`GST (${p.taxRate}%)`} value={fmt.currency(p.tax, curr)} />
        {p.serviceCharge > 0 && <BillLine label="Service Charge" value={fmt.currency(p.serviceCharge, curr)} />}
        {p.tip > 0 && <BillLine label="Tip" value={fmt.currency(p.tip, curr)} />}
        <BillLine label="TOTAL" value={fmt.currency(p.grandTotal, curr)} bold border />
      </div>

      {/* Payment status */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-surface-600">Payment Status</span>
        <PayChip status={order.payment?.status || 'pending'} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onPrint}
          className="btn-secondary flex-1 gap-2 justify-center">
          <Printer className="w-4 h-4" /> Print
        </button>
        <a href={`/api/bills/${order._id}/download`} target="_blank" rel="noreferrer"
          className="btn-primary flex-1 gap-2 justify-center">
          <Download className="w-4 h-4" /> PDF
        </a>
      </div>
    </div>
  )
}

// =============================================================================
// ADMIN SESSION BILL MODAL
// Usage: <SessionBillModal sessionId={id} curr="₹" onClose={() => …} />
// Add a "View Bill" button in your Sessions tab (Tables page)
// =============================================================================
export const SessionBillModal = ({ sessionId, curr = '₹', onClose }) => {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null) // which order is expanded

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    adminApiService.getSessionBill(sessionId)
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load session bill'))
      .finally(() => setLoading(false))
  }, [sessionId])

  const handlePrint = () => {
    if (!data) return
    const html = buildSessionPrintHtml(data)
    printBillHtml(html)
  }

  return (
    <Modal open={!!sessionId} onClose={onClose} title="Combined Session Bill" size="md">
      {loading ? (
        <div className="flex items-center justify-center h-56">
          <Spinner />
        </div>
      ) : data ? (
        <SessionBillContent
          data={data}
          curr={curr}
          expanded={expanded}
          setExpanded={setExpanded}
          onPrint={handlePrint}
        />
      ) : (
        <div className="p-6 text-center text-surface-400">Failed to load session bill</div>
      )}
    </Modal>
  )
}

// ─── Session bill content ─────────────────────────────────────────────────────
const SessionBillContent = ({ data, curr, expanded, setExpanded, onPrint }) => {
  const { session, restaurant, orders, items, pricing, summary } = data
  const curr_ = restaurant.settings.currencySymbol

  return (
    <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

      {/* Restaurant header */}
      <div className="text-center space-y-0.5">
        {restaurant.logo && (
          <img src={restaurant.logo} alt="" className="w-12 h-12 object-cover rounded-xl mx-auto mb-2" />
        )}
        <h2 className="font-display text-lg font-bold text-surface-900">{restaurant.name}</h2>
        {restaurant.address?.street && (
          <p className="text-xs text-surface-400">{restaurant.address.street}, {restaurant.address.city}</p>
        )}
        {restaurant.gstin && <p className="text-xs text-surface-400">GSTIN: {restaurant.gstin}</p>}
      </div>

      {/* Session info banner */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 grid grid-cols-2 gap-y-2.5 text-sm">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-brand-500" />
          <div>
            <p className="text-xs text-surface-400">Table</p>
            <p className="font-semibold text-surface-800">{session.tableNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-brand-500" />
          <div>
            <p className="text-xs text-surface-400">Guests</p>
            <p className="font-semibold text-surface-800">{session.guestCount || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-brand-500" />
          <div>
            <p className="text-xs text-surface-400">Session Started</p>
            <p className="font-semibold text-surface-800">{fmt.datetime(session.startedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="w-3.5 h-3.5 text-brand-500" />
          <div>
            <p className="text-xs text-surface-400">Total Orders</p>
            <p className="font-semibold text-surface-800">{summary.orderCount}</p>
          </div>
        </div>
        {session.customerName && (
          <div className="col-span-2">
            <p className="text-xs text-surface-400">Customer</p>
            <p className="font-semibold text-surface-800">{session.customerName}</p>
          </div>
        )}
      </div>

      {/* Order-by-order breakdown (collapsible) */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
          Orders in this Session
        </p>
        {orders.map((order, idx) => (
          <div key={order._id} className="border border-surface-100 rounded-xl overflow-hidden">
            {/* Order header row */}
            <button
              onClick={() => setExpanded(expanded === order._id ? null : order._id)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-surface-800">#{order.orderNumber}</p>
                  <p className="text-xs text-surface-400">{fmt.datetime(order.createdAt)} · {order.itemCount} item(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PayChip status={order.paymentStatus} />
                <span className="font-semibold text-sm text-surface-800">
                  {fmt.currency(order.grandTotal, curr_)}
                </span>
                <span className="text-surface-300 text-xs">{expanded === order._id ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Expanded items */}
            <AnimatePresence>
              {expanded === order._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-1 border-t border-surface-50 space-y-1">
                    {items
                      .filter(i => i._orderId?.toString() === order._id?.toString())
                      .map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-surface-600">
                          <span className="flex-1">
                            {item.productName}
                            {item.selectedVariants?.length > 0 && (
                              <span className="text-surface-400 ml-1">
                                ({item.selectedVariants.map(v => v.selected).join(', ')})
                              </span>
                            )}
                          </span>
                          <span className="mx-2 text-surface-400">×{item.quantity}</span>
                          <span className="font-medium">{fmt.currency(item.total, curr_)}</span>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* All items flat list */}
      <div className="border-t border-dashed border-surface-200 pt-3 space-y-1">
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
          All Items Combined
        </p>
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-surface-700 flex-1">
              {item.productName}
              {item.selectedVariants?.length > 0 && (
                <span className="text-xs text-surface-400 ml-1">
                  ({item.selectedVariants.map(v => v.selected).join(', ')})
                </span>
              )}
              {item.specialInstructions && (
                <span className="text-xs text-amber-500 ml-1">⚠️</span>
              )}
            </span>
            <span className="text-surface-500 mx-3">×{item.quantity}</span>
            <span className="font-medium text-surface-800">{fmt.currency(item.total, curr_)}</span>
          </div>
        ))}
      </div>

      {/* Pricing summary */}
      <div className="bg-surface-50 rounded-xl p-4 space-y-1.5">
        <BillLine label="Subtotal" value={fmt.currency(pricing.subtotal, curr_)} />
        {pricing.discount > 0 && (
          <BillLine label="Discount" value={`−${fmt.currency(pricing.discount, curr_)}`} green />
        )}
        <BillLine label={`GST (${pricing.taxRate}%)`} value={fmt.currency(pricing.tax, curr_)} />
        {pricing.serviceCharge > 0 && (
          <BillLine label="Service Charge" value={fmt.currency(pricing.serviceCharge, curr_)} />
        )}
        {pricing.tip > 0 && (
          <BillLine label="Tip" value={fmt.currency(pricing.tip, curr_)} />
        )}
        <BillLine
          label={`GRAND TOTAL (${summary.orderCount} orders)`}
          value={fmt.currency(pricing.grandTotal, curr_)}
          bold border
        />
      </div>

      {/* Payment status */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-surface-600">Payment Status</p>
          {summary.paymentMethods.length > 0 && (
            <p className="text-xs text-surface-400 capitalize">
              via {summary.paymentMethods.join(', ')}
            </p>
          )}
        </div>
        <PayChip status={summary.paymentStatus} />
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-surface-400 italic">
        This bill covers the full dining session — all orders from the time the table was opened.
        A new bill will be generated for the next visit.
      </p>

      {/* Actions */}
      <div className="flex gap-2 pt-1 sticky bottom-0 bg-white pt-3 border-t border-surface-100">
        <button onClick={onPrint} className="btn-secondary flex-1 gap-2 justify-center">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// PRINT HTML BUILDERS
// =============================================================================
function buildOrderPrintHtml({ order, restaurant, bill, curr }) {
  const p = bill?.pricing || {}
  const itemRows = (bill?.items || []).map(item =>
    `<tr>
      <td>${item.productName}${item.selectedVariants?.length ? ` (${item.selectedVariants.map(v=>v.selected).join(', ')})` : ''}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${curr}${(item.total||0).toFixed(2)}</td>
    </tr>`
  ).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 320px; margin: 0 auto; padding: 12px; }
    h1 { font-size: 16px; text-align: center; margin: 0 0 4px; }
    .center { text-align: center; } .muted { color: #666; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 3px 0; vertical-align: top; }
    .divider { border-top: 1px dashed #999; margin: 8px 0; }
    .total-row td { font-weight: bold; font-size: 14px; }
    @media print { body { margin: 0; } }
  </style></head><body>
  <h1>${restaurant.name}</h1>
  <p class="center muted">${restaurant.address?.street || ''}</p>
  ${restaurant.gstin ? `<p class="center muted">GSTIN: ${restaurant.gstin}</p>` : ''}
  <div class="divider"></div>
  <p>Order: <strong>#${order.orderNumber}</strong></p>
  <p>Table: <strong>${order.tableNumber}</strong></p>
  <p>Customer: ${order.customerName || 'Guest'}</p>
  <p class="muted">${new Date(order.createdAt).toLocaleString()}</p>
  <div class="divider"></div>
  <table><thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${itemRows}</tbody></table>
  <div class="divider"></div>
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${curr}${(p.subtotal||0).toFixed(2)}</td></tr>
    ${p.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${curr}${(p.discount||0).toFixed(2)}</td></tr>` : ''}
    <tr><td>GST (${p.taxRate}%)</td><td style="text-align:right">${curr}${(p.tax||0).toFixed(2)}</td></tr>
    ${p.serviceCharge > 0 ? `<tr><td>Service Charge</td><td style="text-align:right">${curr}${(p.serviceCharge||0).toFixed(2)}</td></tr>` : ''}
    ${p.tip > 0 ? `<tr><td>Tip</td><td style="text-align:right">${curr}${(p.tip||0).toFixed(2)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="1"><div class="divider"></div>TOTAL</td><td style="text-align:right"><div class="divider"></div>${curr}${(p.grandTotal||0).toFixed(2)}</td></tr>
  </table>
  <div class="divider"></div>
  <p class="center muted">Thank you for dining with us!</p>
  </body></html>`
}

function buildSessionPrintHtml(data) {
  const { session, restaurant, orders, items, pricing, summary } = data
  const curr = restaurant.settings.currencySymbol

  const itemRows = items.map(item =>
    `<tr>
      <td>${item.productName}${item.selectedVariants?.length ? ` (${item.selectedVariants.map(v=>v.selected).join(', ')})` : ''}<br><span style="color:#999;font-size:10px">Order #${item._orderNumber}</span></td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${curr}${(item.total||0).toFixed(2)}</td>
    </tr>`
  ).join('')

  const orderSummaryRows = orders.map((o, i) =>
    `<tr><td>${i+1}. #${o.orderNumber}</td><td style="text-align:right">${curr}${(o.grandTotal||0).toFixed(2)} (${o.paymentStatus})</td></tr>`
  ).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 320px; margin: 0 auto; padding: 12px; }
    h1 { font-size: 16px; text-align: center; margin: 0 0 4px; }
    h2 { font-size: 13px; margin: 8px 0 4px; }
    .center { text-align: center; } .muted { color: #666; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    td { padding: 3px 0; vertical-align: top; }
    .divider { border-top: 1px dashed #999; margin: 8px 0; }
    .total-row td { font-weight: bold; font-size: 14px; }
    @media print { body { margin: 0; } }
  </style></head><body>
  <h1>${restaurant.name}</h1>
  <p class="center muted">${restaurant.address?.street || ''}</p>
  ${restaurant.gstin ? `<p class="center muted">GSTIN: ${restaurant.gstin}</p>` : ''}
  <div class="divider"></div>
  <p><strong>COMBINED SESSION BILL</strong></p>
  <p>Table: <strong>${session.tableNumber}</strong></p>
  ${session.customerName ? `<p>Customer: ${session.customerName}</p>` : ''}
  <p>Guests: ${session.guestCount || '—'}</p>
  <p class="muted">Session: ${new Date(session.startedAt).toLocaleString()}</p>
  <div class="divider"></div>
  <h2>Orders (${summary.orderCount})</h2>
  <table><tbody>${orderSummaryRows}</tbody></table>
  <div class="divider"></div>
  <h2>All Items</h2>
  <table><thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Amt</th></tr></thead>
  <tbody>${itemRows}</tbody></table>
  <div class="divider"></div>
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${curr}${(pricing.subtotal||0).toFixed(2)}</td></tr>
    ${pricing.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${curr}${(pricing.discount||0).toFixed(2)}</td></tr>` : ''}
    <tr><td>GST (${pricing.taxRate}%)</td><td style="text-align:right">${curr}${(pricing.tax||0).toFixed(2)}</td></tr>
    ${pricing.serviceCharge > 0 ? `<tr><td>Service Charge</td><td style="text-align:right">${curr}${(pricing.serviceCharge||0).toFixed(2)}</td></tr>` : ''}
    ${pricing.tip > 0 ? `<tr><td>Tip</td><td style="text-align:right">${curr}${(pricing.tip||0).toFixed(2)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="1"><div class="divider"></div>GRAND TOTAL</td><td style="text-align:right"><div class="divider"></div>${curr}${(pricing.grandTotal||0).toFixed(2)}</td></tr>
  </table>
  <div class="divider"></div>
  <p class="center muted">This covers your full session (${summary.orderCount} order${summary.orderCount>1?'s':''}).</p>
  <p class="center muted">Thank you for dining with us!</p>
  </body></html>`
}


// =============================================================================
// INTEGRATION GUIDE
// =============================================================================

/*
──────────────────────────────────────────────────────────────────────────────
A) In your admin OrdersPage (OrderDetailModal) — replace generateBill logic:
──────────────────────────────────────────────────────────────────────────────

import { AdminOrderBillModal } from '@/components/admin/BillModals'

// Add state:
const [billOrderId, setBillOrderId] = useState(null)

// In OrderDetailModal actions section, replace the old bill button with:
<button onClick={() => { setBillOrderId(order._id); onClose() }}
  className="btn-secondary flex-1">
  <Receipt className="w-4 h-4" /> View Bill
</button>

// Render at page level:
<AdminOrderBillModal
  orderId={billOrderId}
  curr={curr}
  onClose={() => setBillOrderId(null)}
/>

──────────────────────────────────────────────────────────────────────────────
B) In your Tables page (Sessions tab) — add session bill button:
──────────────────────────────────────────────────────────────────────────────

import { SessionBillModal } from '@/components/admin/BillModals'

// Add state:
const [sessionBillId, setSessionBillId] = useState(null)

// In your session row/card, add:
<button onClick={() => setSessionBillId(session._id)}
  className="btn-secondary text-xs px-3 py-1.5 gap-1">
  <Receipt className="w-3.5 h-3.5" /> Session Bill
</button>

// Render at page level:
<SessionBillModal
  sessionId={sessionBillId}
  curr={curr}
  onClose={() => setSessionBillId(null)}
/>

──────────────────────────────────────────────────────────────────────────────
C) "Come back tomorrow = new session" — already handled!
──────────────────────────────────────────────────────────────────────────────
Your existing closeSession endpoint closes the TableSession when the table
is cleared. Next day when the customer scans the QR, scanQR creates a NEW
TableSession with a new _id. So the session bill for tomorrow will only
include tomorrow's orders. Nothing extra needed.

──────────────────────────────────────────────────────────────────────────────
D) API service additions (in your api.js adminApiService object):
──────────────────────────────────────────────────────────────────────────────

  getOrderBill:    (id) => adminApi.get(`/admin/orders/${id}/bill`),
  getSessionBill:  (id) => adminApi.get(`/admin/tables/sessions/${id}/bill`),

*/
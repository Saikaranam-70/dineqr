import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search, QrCode, Download, Star, RefreshCw, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { adminApiService } from '@/services/api'
import { useAdminStore } from '@/store'
import { fmt, cn, STATUS_COLORS, debounce } from '@/utils/helpers'
import { Spinner, Modal, Empty, SkeletonRow, StatusBadge, StarRating, Select, Toggle, Confirm } from '@/components/ui'

// ═══════════════════════════════════════════════════════════════════════════════
// MENU PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const MenuPage = () => {
  const { restaurant } = useAdminStore()
  const curr = restaurant?.settings?.currencySymbol || '₹'

  const [categories, setCats]  = useState([])
  const [products, setProducts]= useState([])
  const [loading, setLoading]  = useState(true)
  const [tab, setTab]          = useState('products')
  const [catFilter, setCatF]   = useState('')
  const [search, setSearch]    = useState('')
  const [editProduct, setEditP] = useState(null)   // null | 'new' | product
  const [editCat, setEditC]     = useState(null)
  const [deleteTarget, setDel]  = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [catRes, prodRes] = await Promise.all([
        adminApiService.getCategories(),
        adminApiService.getProducts({ limit: 200 }),
      ])
      setCats(catRes.data.data.categories)
      setProducts(prodRes.data.data.products)
    } catch { toast.error('Failed to load menu') }
    finally { setLoading(false) }
  }

  const filteredProducts = products.filter(p => {
    if (catFilter && p.categoryId?._id !== catFilter && p.categoryId !== catFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleAvailability = async (id) => {
    try {
      const { data } = await adminApiService.toggleProduct(id)
      setProducts(prev => prev.map(p => p._id === id ? { ...p, isAvailable: data.data.isAvailable } : p))
      toast.success(data.message)
    } catch { toast.error('Failed to update') }
  }

  const deleteProduct = async (id) => {
    try {
      await adminApiService.deleteProduct(id)
      setProducts(prev => prev.filter(p => p._id !== id))
      toast.success('Product deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-surface-100 p-1 rounded-xl">
          {['products','categories'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2 text-sm rounded-lg font-medium capitalize transition-all',
                tab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500')}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => tab === 'products' ? setEditP('new') : setEditC('new')} className="btn-primary">
          <Plus className="w-4 h-4" /> Add {tab === 'products' ? 'Product' : 'Category'}
        </button>
      </div>

      {tab === 'products' && (
        <>
          <div className="card p-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input className="input pl-9" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={catFilter} onChange={setCatF} placeholder="All Categories"
              options={categories.map(c => ({ value: c._id, label: c.name }))} className="w-48" />
          </div>

          <div className="card overflow-hidden">
            {loading ? <div className="divide-y">{[...Array(6)].map((_,i) => <SkeletonRow key={i} />)}</div>
            : filteredProducts.length === 0 ? <Empty icon="🍽️" title="No products" />
            : (
              <div className="divide-y divide-surface-50">
                {filteredProducts.map(p => (
                  <div key={p._id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
                      {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">{p.type==='veg'?'🥗':'🍗'}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-surface-900 text-sm truncate">{p.name}</p>
                        {p.isFeatured && <span className="badge bg-brand-50 text-brand-600 border border-brand-200 text-[10px]">⭐ Featured</span>}
                        {p.tags?.includes('bestseller') && <span className="badge bg-orange-50 text-orange-600 border border-orange-200 text-[10px]">🔥 Best</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-surface-400">{p.categoryId?.name}</span>
                        {p.avgRating > 0 && <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star className="w-3 h-3 fill-current" />{p.avgRating}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <p className="font-semibold text-surface-900 text-sm">{fmt.currency(p.discountedPrice || p.price, curr)}</p>
                      {p.discountedPrice && <p className="text-xs text-surface-400 line-through">{fmt.currency(p.price, curr)}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Toggle checked={p.isAvailable} onChange={() => toggleAvailability(p._id)} />
                      <button onClick={() => setEditP(p)} className="btn-ghost p-1.5"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDel({ type: 'product', id: p._id, name: p.name })} className="btn-ghost p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat._id} className="card p-4 flex items-center gap-3">
              <span className="text-3xl">{cat.icon || '🍽️'}</span>
              <div className="flex-1">
                <p className="font-semibold text-surface-900">{cat.name}</p>
                <p className="text-xs text-surface-400">{products.filter(p => p.categoryId?._id === cat._id || p.categoryId === cat._id).length} items</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditC(cat)} className="btn-ghost p-1.5"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDel({ type: 'category', id: cat._id, name: cat.name })} className="btn-ghost p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          <button onClick={() => setEditC('new')} className="card p-4 border-2 border-dashed border-surface-200 flex flex-col items-center justify-center gap-2 text-surface-400 hover:border-brand-300 hover:text-brand-500 transition-all cursor-pointer h-24">
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Add Category</span>
          </button>
        </div>
      )}

      <ProductFormModal product={editProduct} categories={categories} onClose={() => setEditP(null)} onSave={(p) => { setEditP(null); loadAll() }} />
      <CategoryFormModal category={editCat} onClose={() => setEditC(null)} onSave={() => { setEditC(null); loadAll() }} />
      <Confirm open={!!deleteTarget} onClose={() => setDel(null)} danger
        title={`Delete ${deleteTarget?.type}?`}
        message={`"${deleteTarget?.name}" will be permanently removed.`}
        confirmText="Delete"
        onConfirm={() => { if(deleteTarget?.type==='product') deleteProduct(deleteTarget.id); else adminApiService.deleteCategory(deleteTarget.id).then(loadAll) }}
      />
    </div>
  )
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
const ProductFormModal = ({ product, categories, onClose, onSave }) => {
  const isNew = product === 'new'
  const [form, setForm] = useState({ name: '', price: '', type: 'veg', spiceLevel: 'none', isAvailable: true, isFeatured: false, preparationTime: 15, description: '' })
  const [loading, setSaving] = useState(false)

  useEffect(() => {
    if (product && product !== 'new') {
      setForm({ name: product.name, price: product.price, discountedPrice: product.discountedPrice || '', type: product.type, spiceLevel: product.spiceLevel, isAvailable: product.isAvailable, isFeatured: product.isFeatured, preparationTime: product.preparationTime, description: product.description || '', categoryId: product.categoryId?._id || product.categoryId })
    } else {
      setForm({ name: '', price: '', type: 'veg', spiceLevel: 'none', isAvailable: true, isFeatured: false, preparationTime: 15, description: '', categoryId: categories[0]?._id })
    }
  }, [product])

  const save = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v) })
      if (isNew) await adminApiService.createProduct(fd)
      else await adminApiService.updateProduct(product._id, fd)
      toast.success(isNew ? 'Product created' : 'Product updated')
      onSave()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <Modal open={!!product} onClose={onClose} title={isNew ? 'Add Product' : 'Edit Product'} size="xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-surface-500 mb-1 block">Product Name *</label>
            <input className="input" value={form.name} onChange={e => f('name')(e.target.value)} placeholder="e.g. Butter Chicken" />
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Category *</label>
            <Select value={form.categoryId} onChange={f('categoryId')} options={categories.map(c => ({ value: c._id, label: c.name }))} />
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Type</label>
            <Select value={form.type} onChange={f('type')} options={['veg','non-veg','vegan','egg'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))} />
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Price (₹) *</label>
            <input className="input" type="number" min={0} value={form.price} onChange={e => f('price')(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Discounted Price (₹)</label>
            <input className="input" type="number" min={0} value={form.discountedPrice || ''} onChange={e => f('discountedPrice')(e.target.value)} placeholder="Leave empty for no discount" />
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Spice Level</label>
            <Select value={form.spiceLevel} onChange={f('spiceLevel')} options={['none','mild','medium','hot','extra-hot'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))} />
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Prep Time (min)</label>
            <input className="input" type="number" min={1} value={form.preparationTime} onChange={e => f('preparationTime')(parseInt(e.target.value))} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-surface-500 mb-1 block">Description</label>
            <textarea className="input resize-none h-20" value={form.description} onChange={e => f('description')(e.target.value)} placeholder="Describe this dish…" />
          </div>
        </div>
        <div className="flex gap-6">
          <Toggle checked={form.isAvailable} onChange={f('isAvailable')} label="Available now" />
          <Toggle checked={form.isFeatured} onChange={f('isFeatured')} label="Featured / Chef's Special" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={loading} className="btn-primary flex-1">
            {loading ? <Spinner size="sm" /> : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Category Form Modal ──────────────────────────────────────────────────────
const CategoryFormModal = ({ category, onClose, onSave }) => {
  const isNew = category === 'new'
  const [form, setForm] = useState({ name: '', icon: '', sortOrder: 0 })
  const [loading, setSaving] = useState(false)

  useEffect(() => {
    if (category && category !== 'new') setForm({ name: category.name, icon: category.icon || '', sortOrder: category.sortOrder || 0 })
    else setForm({ name: '', icon: '', sortOrder: 0 })
  }, [category])

  const save = async () => {
    if (!form.name) { toast.error('Name required'); return }
    setSaving(true)
    try {
      if (isNew) await adminApiService.createCategory(form)
      else await adminApiService.updateCategory(category._id, form)
      toast.success(isNew ? 'Category created' : 'Category updated')
      onSave()
    } catch (e) { toast.error('Failed') }
    finally { setSaving(false) }
  }

  return (
    <Modal open={!!category} onClose={onClose} title={isNew ? 'Add Category' : 'Edit Category'} size="sm">
      <div className="p-5 space-y-3">
        <div>
          <label className="text-xs text-surface-500 mb-1 block">Name *</label>
          <input className="input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Starters" />
        </div>
        <div>
          <label className="text-xs text-surface-500 mb-1 block">Icon (emoji)</label>
          <input className="input text-2xl" value={form.icon} onChange={e => setForm(f=>({...f,icon:e.target.value}))} placeholder="🍽️" />
        </div>
        <div>
          <label className="text-xs text-surface-500 mb-1 block">Sort Order</label>
          <input className="input" type="number" value={form.sortOrder} onChange={e => setForm(f=>({...f,sortOrder:parseInt(e.target.value)||0}))} />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={loading} className="btn-primary flex-1">
            {loading ? <Spinner size="sm" /> : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLES PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const TablesPage = () => {
  const [tables, setTables]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editTable, setEdit]  = useState(null)
  const [qrModal, setQR]      = useState(null)

  useEffect(() => { loadTables() }, [])

  const loadTables = async () => {
    setLoading(true)
    try {
      const { data } = await adminApiService.getTables()
      setTables(data.data.tables)
    } catch { toast.error('Failed to load tables') }
    finally { setLoading(false) }
  }

  const regenQR = async (id) => {
    try {
      const { data } = await adminApiService.regenerateQR(id)
      setTables(prev => prev.map(t => t._id === id ? data.data.table : t))
      toast.success('QR code regenerated')
    } catch { toast.error('Failed') }
  }

  const closeSession = async (sessionId) => {
    try {
      await adminApiService.closeSession(sessionId)
      toast.success('Table cleared')
      loadTables()
    } catch { toast.error('Failed') }
  }

  const sectionGroups = tables.reduce((acc, t) => {
    const s = t.section || 'Main'
    if (!acc[s]) acc[s] = []
    acc[s].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {[['occupied','text-red-600'], ['available','text-green-600']].map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5 text-sm">
              <div className={cn('w-2.5 h-2.5 rounded-full', s==='occupied'?'bg-red-400':'bg-green-400')} />
              <span className={cn('font-medium capitalize', c)}>{tables.filter(t=>t.status===s).length} {s}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setEdit('new')} className="btn-primary"><Plus className="w-4 h-4" /> Add Table</button>
      </div>

      {Object.entries(sectionGroups).map(([section, ts]) => (
        <div key={section}>
          <h3 className="font-semibold text-surface-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-brand-500 rounded-full" />{section}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {ts.map(t => (
              <motion.div key={t._id} layout className={cn('card p-4 space-y-3 cursor-pointer hover:shadow-card-lg transition-all border-2',
                t.status === 'occupied' ? 'border-red-200 bg-red-50/30' : 'border-transparent')}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-surface-900 text-lg">{t.tableNumber}</p>
                    <p className="text-xs text-surface-400">{t.capacity} seats</p>
                  </div>
                  <div className={cn('w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0',
                    t.status === 'occupied' ? 'bg-red-400 animate-pulse' :
                    t.status === 'available' ? 'bg-green-400' : 'bg-surface-300')} />
                </div>
                {t.activeSession && (
                  <div className="bg-red-50 rounded-lg p-2 text-xs text-red-700">
                    <p>{t.activeSession.customerName || 'Guest'} · {t.activeSession.guestCount} pax</p>
                    <p>{fmt.currency(t.activeSession.totalAmount)} ordered</p>
                  </div>
                )}
                <div className="flex gap-1">
                  <button onClick={() => setQR(t)} className="btn-ghost p-1.5 flex-1 justify-center text-xs gap-1">
                    <QrCode className="w-3.5 h-3.5" /> QR
                  </button>
                  <button onClick={() => setEdit(t)} className="btn-ghost p-1.5 flex-1 justify-center">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {t.activeSession && t.status === 'occupied' && (
                    <button onClick={() => closeSession(t.currentSessionId)} className="btn-ghost p-1.5 text-green-600 hover:bg-green-50 text-xs">✓</button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* QR Modal */}
      <Modal open={!!qrModal} onClose={() => setQR(null)} title={`Table ${qrModal?.tableNumber} - QR Code`} size="sm">
        {qrModal && (
          <div className="p-6 space-y-4 text-center">
            {qrModal.qrCode?.image && <img src={qrModal.qrCode.image} alt="QR" className="w-48 h-48 mx-auto rounded-xl" />}
            <p className="text-xs text-surface-400 break-all">{qrModal.qrCode?.url}</p>
            <div className="flex gap-2">
              <a href={qrModal.qrCode?.image} download={`table-${qrModal.tableNumber}-qr.png`} className="btn-secondary flex-1 justify-center text-sm">
                <Download className="w-4 h-4" /> Download
              </a>
              <button onClick={() => regenQR(qrModal._id)} className="btn-primary flex-1 text-sm">
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Table form */}
      <TableFormModal table={editTable} onClose={() => setEdit(null)} onSave={() => { setEdit(null); loadTables() }} />
    </div>
  )
}

const TableFormModal = ({ table, onClose, onSave }) => {
  const isNew = table === 'new'
  const [form, setForm] = useState({ tableNumber: '', displayName: '', capacity: 4, section: 'Main Hall' })
  const [loading, setSaving] = useState(false)

  useEffect(() => {
    if (table && table !== 'new') setForm({ tableNumber: table.tableNumber, displayName: table.displayName || '', capacity: table.capacity, section: table.section })
    else setForm({ tableNumber: '', displayName: '', capacity: 4, section: 'Main Hall' })
  }, [table])

  const save = async () => {
    if (!form.tableNumber) { toast.error('Table number required'); return }
    setSaving(true)
    try {
      if (isNew) await adminApiService.createTable(form)
      else await adminApiService.updateTable(table._id, form)
      toast.success(isNew ? 'Table created with QR code' : 'Table updated')
      onSave()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <Modal open={!!table} onClose={onClose} title={isNew ? 'Add Table' : 'Edit Table'} size="sm">
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Table Number *</label>
            <input className="input" value={form.tableNumber} onChange={e => setForm(f=>({...f,tableNumber:e.target.value}))} placeholder="T1" />
          </div>
          <div>
            <label className="text-xs text-surface-500 mb-1 block">Capacity</label>
            <input className="input" type="number" min={1} value={form.capacity} onChange={e => setForm(f=>({...f,capacity:parseInt(e.target.value)||1}))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-surface-500 mb-1 block">Display Name</label>
          <input className="input" value={form.displayName} onChange={e => setForm(f=>({...f,displayName:e.target.value}))} placeholder="e.g. Window Table" />
        </div>
        <div>
          <label className="text-xs text-surface-500 mb-1 block">Section</label>
          <Select value={form.section} onChange={v => setForm(f=>({...f,section:v}))}
            options={['Main Hall','Window','VIP','Outdoor','Bar','Private'].map(s=>({value:s,label:s}))} />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={loading} className="btn-primary flex-1">
            {loading ? <Spinner size="sm" /> : isNew ? 'Create + QR Code' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const AnalyticsPage = () => {
  const { restaurant } = useAdminStore()
  const curr = restaurant?.settings?.currencySymbol || '₹'
  const [data, setData]   = useState(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [period])

  const load = async () => {
    setLoading(true)
    try {
      const { data: d } = await adminApiService.getSales({ period, groupBy: period === 'today' ? 'hour' : 'day' })
      setData(d.data)
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  const downloadReport = () => {
    const url = `/api/admin/analytics/report?format=pdf&period=${period}`
    window.open(url, '_blank')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="xl" /></div>

  const t = data?.totals || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
          {['today','week','month','3months'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-3 py-1.5 text-sm rounded-lg font-medium transition-all capitalize',
                period === p ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500')}>
              {p === '3months' ? '3 Months' : p}
            </button>
          ))}
        </div>
        <button onClick={downloadReport} className="btn-secondary gap-1.5 text-sm">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue',    value: fmt.currency(t.revenue, curr),  icon: '💰' },
          { label: 'Net Revenue',      value: fmt.currency(t.netRevenue, curr),icon: '📈' },
          { label: 'Total Orders',     value: fmt.number(t.orders),           icon: '📦' },
          { label: 'Avg Order Value',  value: fmt.currency(t.avgOrderValue, curr), icon: '📊' },
          { label: 'Total Tax',        value: fmt.currency(t.tax, curr),      icon: '🏛️' },
          { label: 'Total Discounts',  value: fmt.currency(t.discounts, curr),icon: '🎟️' },
          { label: 'Total Tips',       value: fmt.currency(t.tips, curr),     icon: '🙏' },
          { label: 'Cancellations',    value: data?.timeline?.reduce((s,d)=>s+(d.cancelledCount||0),0) || 0, icon: '❌' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <span className="text-2xl">{s.icon}</span>
            <p className="font-display text-xl font-bold text-surface-900">{s.value}</p>
            <p className="text-xs text-surface-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-surface-800 mb-4">Revenue & Orders Over Time</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data?.timeline || []}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
              <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
            </defs>
            <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="l" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={v=>`${curr}${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: '#78716c' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
            <Area yAxisId="l" type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#rg)" name="Revenue" />
            <Area yAxisId="r" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fill="url(#og)" name="Orders" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top products + Peak hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 mb-4">Top Products</h3>
          <div className="space-y-3">
            {(data?.topProducts || []).slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-surface-400">#{i+1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-800">{p.name}</p>
                  <div className="h-1.5 bg-surface-100 rounded-full mt-1">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(p.revenue / (data.topProducts[0]?.revenue || 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{fmt.currency(p.revenue, curr)}</p>
                  <p className="text-xs text-surface-400">{p.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-surface-800 mb-4">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.peakHours || []}>
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={h => `${h}:00`} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v, n) => [v, 'Orders']} contentStyle={{ borderRadius: '8px', fontSize: 11 }} />
              <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]}>
                {(data?.peakHours || []).map((entry, i) => (
                  <Cell key={i} fill={entry.orders === Math.max(...(data?.peakHours?.map(h=>h.orders)||[0])) ? '#ea580c' : '#f97316'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const ReviewsPage = () => {
  const [reviews, setReviews]   = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [replyModal, setReply]  = useState(null)
  const [page, setPage]         = useState(1)
  const [ratingFilter, setRating] = useState('')

  useEffect(() => { load() }, [page, ratingFilter])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminApiService.getReviews({ page, limit: 20, rating: ratingFilter || undefined })
      setReviews(data.data.reviews)
      setTotal(data.pagination.total)
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  const approve = async (id) => {
    try { await adminApiService.approveReview(id); toast.success('Review approved'); load() }
    catch { toast.error('Failed') }
  }

  const del = async (id) => {
    try { await adminApiService.deleteReview(id); setReviews(prev => prev.filter(r => r._id !== id)); toast.success('Review deleted') }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={ratingFilter} onChange={setRating} placeholder="All Ratings"
          options={[5,4,3,2,1].map(v=>({value:String(v), label:`${v} ★`}))} className="w-36" />
        <button onClick={load} className="btn-ghost p-2.5"><RefreshCw className="w-4 h-4" /></button>
        <span className="text-sm text-surface-500 ml-auto">{total} reviews total</span>
      </div>

      <div className="card divide-y divide-surface-50">
        {loading ? [...Array(6)].map((_,i) => <SkeletonRow key={i} />)
        : reviews.length === 0 ? <Empty icon="⭐" title="No reviews yet" />
        : reviews.map(r => (
          <div key={r._id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StarRating value={r.rating} size="sm" />
                  <span className="font-medium text-sm text-surface-800">{r.customerName}</span>
                  {r.isVerified && <span className="badge bg-green-50 text-green-700 border border-green-200 text-[10px]">✓ Verified</span>}
                  {!r.isApproved && <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">Pending</span>}
                  <span className="text-xs text-surface-400">{fmt.relTime(r.createdAt)}</span>
                </div>
                {r.productId && <p className="text-xs text-surface-400 mt-0.5">On: {r.productId.name}</p>}
                {r.review && <p className="text-sm text-surface-600 mt-1">{r.review}</p>}
                {r.adminReply?.text && (
                  <div className="mt-2 bg-brand-50 rounded-xl p-3 text-sm border border-brand-100">
                    <p className="text-xs text-brand-500 font-medium mb-0.5">Your reply:</p>
                    <p className="text-surface-700">{r.adminReply.text}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!r.isApproved && <button onClick={() => approve(r._id)} className="btn-ghost p-1.5 text-green-600 hover:bg-green-50"><CheckCircle className="w-4 h-4" /></button>}
                <button onClick={() => setReply(r)} className="btn-ghost p-1.5 text-brand-500 hover:bg-brand-50 text-xs">Reply</button>
                <button onClick={() => del(r._id)} className="btn-ghost p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!replyModal} onClose={() => setReply(null)} title="Reply to Review" size="sm">
        {replyModal && <ReplyForm review={replyModal} onClose={() => setReply(null)} onSave={() => { setReply(null); load() }} />}
      </Modal>
    </div>
  )
}

const ReplyForm = ({ review, onClose, onSave }) => {
  const [text, setText] = useState(review.adminReply?.text || '')
  const [loading, setLoading] = useState(false)
  const save = async () => {
    if (!text.trim()) return
    setLoading(true)
    try { await adminApiService.replyReview(review._id, { text }); toast.success('Reply saved'); onSave() }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="p-5 space-y-3">
      <div className="bg-surface-50 rounded-xl p-3">
        <StarRating value={review.rating} size="sm" />
        <p className="text-sm text-surface-600 mt-1">{review.review}</p>
      </div>
      <textarea className="input resize-none h-24 text-sm" placeholder="Write your reply…" value={text} onChange={e => setText(e.target.value)} />
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={save} disabled={loading} className="btn-primary flex-1">{loading ? <Spinner size="sm" /> : 'Post Reply'}</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const StaffPage = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [editStaff, setEdit]  = useState(null)
  const [delTarget, setDel]   = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => { setLoading(true); try { const {data} = await adminApiService.getStaff(); setStaff(data.data.staff) } catch {} finally { setLoading(false) } }

  const toggle = async (id) => { try { await adminApiService.toggleStaff(id); load() } catch { toast.error('Failed') } }

  const ROLE_COLORS = { restaurant_owner: 'bg-brand-100 text-brand-700', manager: 'bg-blue-100 text-blue-700', cashier: 'bg-green-100 text-green-700', kitchen_staff: 'bg-amber-100 text-amber-700' }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEdit('new')} className="btn-primary"><Plus className="w-4 h-4" /> Add Staff</button>
      </div>
      <div className="card divide-y divide-surface-50">
        {loading ? [...Array(4)].map((_,i) => <SkeletonRow key={i} />)
        : staff.length === 0 ? <Empty icon="👥" title="No staff members" />
        : staff.map(s => (
          <div key={s._id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-sm">{s.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-surface-900 text-sm">{s.name}</p>
                <span className={cn('badge text-xs', ROLE_COLORS[s.role] || 'bg-surface-100 text-surface-600')}>{s.role?.replace('_',' ')}</span>
                {!s.isActive && <span className="badge bg-red-50 text-red-600 text-xs">Inactive</span>}
              </div>
              <p className="text-xs text-surface-400">{s.email}</p>
            </div>
            <div className="flex gap-1">
              <Toggle checked={s.isActive} onChange={() => toggle(s._id)} />
              <button onClick={() => setEdit(s)} className="btn-ghost p-1.5"><Edit className="w-3.5 h-3.5" /></button>
              <button onClick={() => setDel(s)} className="btn-ghost p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <StaffFormModal staff={editStaff} onClose={() => setEdit(null)} onSave={() => { setEdit(null); load() }} />
      <Confirm open={!!delTarget} onClose={() => setDel(null)} danger title="Remove Staff?" message={`${delTarget?.name} will be removed.`} confirmText="Remove"
        onConfirm={() => adminApiService.deleteStaff(delTarget._id).then(load).catch(() => toast.error('Failed'))} />
    </div>
  )
}

const StaffFormModal = ({ staff, onClose, onSave }) => {
  const isNew = staff === 'new'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' })
  const [loading, setSaving] = useState(false)

  useEffect(() => {
    if (staff && staff !== 'new') setForm({ name: staff.name, email: staff.email, password: '', role: staff.role })
    else setForm({ name: '', email: '', password: '', role: 'cashier' })
  }, [staff])

  const save = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return }
    if (isNew && !form.password) { toast.error('Password required'); return }
    setSaving(true)
    try {
      if (isNew) await adminApiService.createStaff(form)
      else await adminApiService.updateStaff(staff._id, { name: form.name, role: form.role })
      toast.success(isNew ? 'Staff created' : 'Staff updated')
      onSave()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const f = k => v => setForm(p => ({...p, [k]: v}))

  return (
    <Modal open={!!staff} onClose={onClose} title={isNew ? 'Add Staff' : 'Edit Staff'} size="sm">
      <div className="p-5 space-y-3">
        <div><label className="text-xs text-surface-500 mb-1 block">Full Name *</label><input className="input" value={form.name} onChange={e => f('name')(e.target.value)} /></div>
        {isNew && <><div><label className="text-xs text-surface-500 mb-1 block">Email *</label><input type="email" className="input" value={form.email} onChange={e => f('email')(e.target.value)} /></div>
        <div><label className="text-xs text-surface-500 mb-1 block">Password *</label><input type="password" className="input" value={form.password} onChange={e => f('password')(e.target.value)} /></div></>}
        <div><label className="text-xs text-surface-500 mb-1 block">Role</label><Select value={form.role} onChange={f('role')} options={['manager','cashier','kitchen_staff'].map(r=>({value:r,label:r.replace('_',' ')}))} /></div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={loading} className="btn-primary flex-1">{loading ? <Spinner size="sm" /> : isNew ? 'Create' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUPONS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const CouponsPage = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCoupon, setEdit] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => { setLoading(true); try { const {data} = await adminApiService.getCoupons(); setCoupons(data.data.coupons) } catch {} finally { setLoading(false) } }

  const toggle = async (id) => { try { await adminApiService.toggleCoupon(id); load() } catch { toast.error('Failed') } }
  const del    = async (id) => { try { await adminApiService.deleteCoupon(id); load(); toast.success('Deleted') } catch { toast.error('Failed') } }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEdit('new')} className="btn-primary"><Plus className="w-4 h-4" /> Add Coupon</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(3)].map((_,i) => <SkeletonCard key={i} />) : coupons.map(c => (
          <div key={c._id} className="card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono font-bold text-lg text-surface-900">{c.code}</p>
                <p className="text-xs text-surface-400 mt-0.5">{c.description}</p>
              </div>
              <Toggle checked={c.isActive} onChange={() => toggle(c._id)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="badge bg-brand-50 text-brand-700 border border-brand-200">
                {c.type === 'percentage' ? `${c.value}% OFF` : c.type === 'fixed' ? `₹${c.value} OFF` : c.type.toUpperCase()}
              </span>
              {c.minOrderAmount > 0 && <span className="text-xs text-surface-400">Min ₹{c.minOrderAmount}</span>}
            </div>
            <div className="flex justify-between text-xs text-surface-400">
              <span>Used: {c.usedCount}/{c.usageLimit || '∞'}</span>
              {c.validTo && <span>Until {fmt.date(c.validTo)}</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEdit(c)} className="btn-secondary flex-1 text-xs py-1.5"><Edit className="w-3 h-3" /> Edit</button>
              <button onClick={() => del(c._id)} className="btn-ghost text-red-400 hover:bg-red-50 px-3 py-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <CouponFormModal coupon={editCoupon} onClose={() => setEdit(null)} onSave={() => { setEdit(null); load() }} />
    </div>
  )
}

const CouponFormModal = ({ coupon, onClose, onSave }) => {
  const isNew = coupon === 'new'
  const [form, setForm] = useState({ code: '', description: '', type: 'percentage', value: '', minOrderAmount: '', usageLimit: '', validTo: '' })
  const [loading, setSaving] = useState(false)

  useEffect(() => {
    if (coupon && coupon !== 'new') setForm({ code: coupon.code, description: coupon.description||'', type: coupon.type, value: coupon.value, minOrderAmount: coupon.minOrderAmount||'', usageLimit: coupon.usageLimit||'', validTo: coupon.validTo ? coupon.validTo.split('T')[0] : '' })
    else setForm({ code: '', description: '', type: 'percentage', value: '', minOrderAmount: '', usageLimit: '', validTo: '' })
  }, [coupon])

  const f = k => v => setForm(p => ({...p, [k]: v}))

  const save = async () => {
    if (!form.code || !form.value) { toast.error('Code and value required'); return }
    setSaving(true)
    try {
      const payload = { ...form, value: parseFloat(form.value), minOrderAmount: parseFloat(form.minOrderAmount)||0, usageLimit: parseInt(form.usageLimit)||undefined }
      if (isNew) await adminApiService.createCoupon(payload)
      else await adminApiService.updateCoupon(coupon._id, payload)
      toast.success(isNew ? 'Coupon created' : 'Coupon updated')
      onSave()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <Modal open={!!coupon} onClose={onClose} title={isNew ? 'Create Coupon' : 'Edit Coupon'} size="md">
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs text-surface-500 mb-1 block">Coupon Code *</label><input className="input font-mono uppercase" value={form.code} onChange={e => f('code')(e.target.value.toUpperCase())} placeholder="WELCOME10" /></div>
          <div><label className="text-xs text-surface-500 mb-1 block">Type</label><Select value={form.type} onChange={f('type')} options={['percentage','fixed'].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))} /></div>
          <div><label className="text-xs text-surface-500 mb-1 block">Value * ({form.type==='percentage'?'%':'₹'})</label><input type="number" className="input" value={form.value} onChange={e => f('value')(e.target.value)} /></div>
          <div><label className="text-xs text-surface-500 mb-1 block">Min Order (₹)</label><input type="number" className="input" value={form.minOrderAmount} onChange={e => f('minOrderAmount')(e.target.value)} /></div>
          <div><label className="text-xs text-surface-500 mb-1 block">Usage Limit</label><input type="number" className="input" value={form.usageLimit} onChange={e => f('usageLimit')(e.target.value)} /></div>
          <div className="col-span-2"><label className="text-xs text-surface-500 mb-1 block">Valid Until</label><input type="date" className="input" value={form.validTo} onChange={e => f('validTo')(e.target.value)} /></div>
          <div className="col-span-2"><label className="text-xs text-surface-500 mb-1 block">Description</label><input className="input" value={form.description} onChange={e => f('description')(e.target.value)} /></div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={loading} className="btn-primary flex-1">{loading ? <Spinner size="sm" /> : isNew ? 'Create' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const NotificationsPage = () => {
  const { setUnreadCount } = useAdminStore()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminApiService.getNotifications()
      setNotifs(data.data.notifications)
      setUnreadCount(data.data.unreadCount)
    } catch {} finally { setLoading(false) }
  }

  const markAll = async () => { await adminApiService.markAllRead(); setUnreadCount(0); load() }

  const ICONS = { new_order: '🆕', order_update: '📦', payment: '💳', review: '⭐', low_stock: '⚠️', system: 'ℹ️' }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={markAll} className="btn-secondary text-sm">Mark all read</button>
      </div>
      <div className="card divide-y divide-surface-50">
        {loading ? [...Array(5)].map((_,i) => <SkeletonRow key={i} />)
        : notifs.length === 0 ? <Empty icon="🔔" title="No notifications" />
        : notifs.map(n => (
          <div key={n._id} className={cn('flex items-start gap-3 px-4 py-3', !n.isRead && 'bg-brand-50/30')}>
            <span className="text-xl mt-0.5">{ICONS[n.type] || '🔔'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-surface-900">{n.title}</p>
              <p className="text-xs text-surface-500">{n.message}</p>
              <p className="text-xs text-surface-400 mt-0.5">{fmt.relTime(n.createdAt)}</p>
            </div>
            {!n.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const SettingsPage = () => {
  const { restaurant, setRestaurant } = useAdminStore()
  const [form, setForm]   = useState({})
  const [loading, setSaving] = useState(false)

  useEffect(() => {
    if (restaurant) setForm({ name: restaurant.name||'', contact: restaurant.contact||{}, settings: restaurant.settings||{} })
  }, [restaurant])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await adminApiService.updateRestaurant(form)
      setRestaurant(data.data.restaurant)
      toast.success('Settings saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const sf = (section, key) => (value) => setForm(p => ({ ...p, [section]: { ...p[section], [key]: value } }))

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-surface-800">Restaurant Info</h2>
        <div><label className="text-xs text-surface-500 mb-1 block">Restaurant Name</label><input className="input" value={form.name||''} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-surface-500 mb-1 block">Phone</label><input className="input" value={form.contact?.phone||''} onChange={e => sf('contact','phone')(e.target.value)} /></div>
          <div><label className="text-xs text-surface-500 mb-1 block">Email</label><input className="input" value={form.contact?.email||''} onChange={e => sf('contact','email')(e.target.value)} /></div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-surface-800">Order Settings</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-surface-500 mb-1 block">GST (%)</label><input type="number" className="input" value={form.settings?.taxRate||18} onChange={e => sf('settings','taxRate')(parseFloat(e.target.value))} /></div>
          <div><label className="text-xs text-surface-500 mb-1 block">Service Charge (%)</label><input type="number" className="input" value={form.settings?.serviceCharge||0} onChange={e => sf('settings','serviceCharge')(parseFloat(e.target.value))} /></div>
          <div><label className="text-xs text-surface-500 mb-1 block">Min Order Amount (₹)</label><input type="number" className="input" value={form.settings?.minOrderAmount||0} onChange={e => sf('settings','minOrderAmount')(parseFloat(e.target.value))} /></div>
          <div><label className="text-xs text-surface-500 mb-1 block">Default Prep Time (min)</label><input type="number" className="input" value={form.settings?.preparationTimeDefault||20} onChange={e => sf('settings','preparationTimeDefault')(parseInt(e.target.value))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Toggle checked={form.settings?.allowCashPayment} onChange={sf('settings','allowCashPayment')} label="Allow Cash Payment" />
          <Toggle checked={form.settings?.allowOnlinePayment} onChange={sf('settings','allowOnlinePayment')} label="Allow Online Payment" />
          <Toggle checked={form.settings?.autoAcceptOrders} onChange={sf('settings','autoAcceptOrders')} label="Auto-accept Orders" />
          <Toggle checked={form.settings?.allowReviews} onChange={sf('settings','allowReviews')} label="Allow Reviews" />
        </div>
      </div>

      <button onClick={save} disabled={loading} className="btn-primary px-8">
        {loading ? <Spinner size="sm" /> : 'Save Settings'}
      </button>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Search, Star, Plus, Minus, X, ChevronRight,
  Clock, CheckCircle, Bell, FileText,
  ArrowLeft, Package,
} from 'lucide-react'
import { customerApi } from '@/services/api'
import { useCustomerStore } from '@/store'
import { fmt, cn, SPICE_ICONS, TYPE_ICONS, debounce } from '@/utils/helpers'
import {
  Spinner, FullPageLoader, Empty, StatusBadge, StarRating,
  Modal, SkeletonCard, Alert,
} from '@/components/ui'

// ═══════════════════════════════════════════════════════════════════════════════
// SCAN PAGE — QR entry point
// ═══════════════════════════════════════════════════════════════════════════════
export const ScanPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const setSession = useCustomerStore(s => s.setSession)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const scan = async () => {
      try {
        const { data } = await customerApi.scanQR(token)
        sessionStorage.setItem('sessionToken', data.data.sessionToken)
        setSession(data.data)
        const rid = data.data.restaurant?._id || data.data.restaurant?.slug
        navigate(`/menu/${rid}`, { replace: true })
      } catch (e) {
        setError(e.response?.data?.message || 'Invalid QR code. Please scan again.')
      } finally {
        setLoading(false)
      }
    }
    scan()
  }, [token])

  if (loading) return <FullPageLoader text="Setting up your table…" />

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
        <div className="text-6xl">❌</div>
        <h1 className="font-display text-2xl font-bold text-surface-900">Invalid QR Code</h1>
        <p className="text-surface-500 text-sm">{error}</p>
        <p className="text-xs text-surface-400">Please ask your server for assistance or scan the QR code on your table.</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENU PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const MenuPage = () => {
  const { restaurantId } = useParams()
  const store = useCustomerStore()
  const navigate = useNavigate()

  const [restaurant, setRestaurant] = useState(null)
  const [categories, setCategories] = useState([])
  const [products, setProducts]     = useState([])
  const [featured, setFeatured]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeCategory, setActive] = useState('all')
  const [search, setSearch]         = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [selectedProduct, setSelected]    = useState(null)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    loadMenu()
  }, [restaurantId])

  const loadMenu = async () => {
    try {
      setLoading(true)
      const [catRes, prodRes, featRes] = await Promise.all([
        customerApi.getCategories(restaurantId),
        customerApi.getProducts(restaurantId, { limit: 100 }),
        customerApi.getFeatured(restaurantId),
      ])
      setCategories(catRes.data.data.categories)
      setProducts(prodRes.data.data.products)
      setFeatured(featRes.data.data.products)
    } catch (e) {
      toast.error('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  const doSearch = useCallback(debounce(async (q) => {
    if (!q.trim()) { setSearchResults(null); return }
    try {
      const { data } = await customerApi.searchProducts(restaurantId, q)
      setSearchResults(data.data.products)
    } catch { setSearchResults([]) }
  }, 400), [restaurantId])

  const filtered = (searchResults ?? products).filter(p => {
    if (activeCategory !== 'all' && p.categoryId?._id !== activeCategory && p.categoryId !== activeCategory) return false
    if (typeFilter && p.type !== typeFilter) return false
    return true
  })

  const cartCount = store.cartCount()

  if (loading) return <FullPageLoader text="Loading delicious menu…" />

  return (
    <div className="min-h-screen bg-surface-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-surface-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-display text-xl font-bold text-surface-900">
                {store.restaurantInfo?.name || 'Menu'}
              </h1>
              <p className="text-xs text-surface-500">Table {store.tableNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/orders`)} className="btn-ghost px-3 py-2 text-xs gap-1.5">
                <Package className="w-4 h-4" /> Orders
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              className="input pl-9 bg-surface-50"
              placeholder="Search dishes…"
              value={search}
              onChange={e => { setSearch(e.target.value); doSearch(e.target.value) }}
            />
          </div>
        </div>
        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[{ _id: 'all', name: 'All', icon: '🍽️' }, ...categories].map(cat => (
            <button
              key={cat._id}
              onClick={() => setActive(cat._id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                activeCategory === cat._id
                  ? 'bg-brand-500 text-white shadow-brand'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {cat.icon && <span className="text-base">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Featured */}
        {activeCategory === 'all' && !searchResults && featured.length > 0 && (
          <section>
            <h2 className="section-title mb-3 flex items-center gap-2">⭐ Chef's Specials</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {featured.map(p => (
                <FeaturedCard key={p._id} product={p} onClick={() => setSelected(p)} onAdd={(e) => { e.stopPropagation(); store.addToCart(p); toast.success(`Added ${p.name}`) }} />
              ))}
            </div>
          </section>
        )}

        {/* Product grid */}
        <section>
          {activeCategory !== 'all' && (
            <h2 className="section-title mb-3">
              {categories.find(c => c._id === activeCategory)?.icon} {categories.find(c => c._id === activeCategory)?.name}
            </h2>
          )}
          {filtered.length === 0
            ? <Empty icon="🔍" title="No items found" desc={search ? `No results for "${search}"` : 'No items in this category'} />
            : (
              <div className="grid grid-cols-1 gap-3">
                {filtered.map((p, i) => (
                  <motion.div key={p._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ProductCard product={p} onClick={() => setSelected(p)} onAdd={() => { store.addToCart(p); toast.success(`Added ${p.name}`) }} />
                  </motion.div>
                ))}
              </div>
            )}
        </section>
      </div>

      {/* Cart FAB */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4"
          >
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-4 bg-surface-900 text-white px-6 py-4 rounded-2xl shadow-xl max-w-sm w-full"
            >
              <span className="bg-brand-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{cartCount}</span>
              <span className="font-medium flex-1 text-left">View Cart</span>
              <span className="font-semibold">{fmt.currency(store.cartTotal())}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product detail modal */}
      <ProductModal product={selectedProduct} onClose={() => setSelected(null)} onAdd={(qty, variants, addOns, note) => {
        store.addToCart(selectedProduct, qty, variants, addOns, note)
        toast.success(`${selectedProduct.name} added to cart`)
        setSelected(null)
      }} />
    </div>
  )
}

// ─── Featured Card ────────────────────────────────────────────────────────────
const FeaturedCard = ({ product: p, onClick, onAdd }) => (
  <div onClick={onClick} className="flex-shrink-0 w-44 card overflow-hidden cursor-pointer hover:shadow-card-lg transition-all duration-200 hover:-translate-y-0.5">
    <div className="h-28 bg-gradient-to-br from-brand-100 to-brand-200 relative overflow-hidden">
      {p.images?.[0]
        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-4xl">{p.type === 'veg' ? '🥗' : '🍖'}</div>}
      <span className={cn('absolute top-2 left-2 text-xs', p.type === 'veg' ? 'tag-veg' : p.type === 'vegan' ? 'tag-vegan' : 'tag-nonveg')}>
        {TYPE_ICONS[p.type]}
      </span>
      {p.tags?.includes('bestseller') && (
        <span className="absolute top-2 right-2 badge bg-brand-500 text-white text-[10px]">🔥 Best</span>
      )}
    </div>
    <div className="p-3 space-y-1.5">
      <p className="font-medium text-sm text-surface-900 line-clamp-1">{p.name}</p>
      <div className="flex items-center justify-between">
        <p className="text-brand-600 font-semibold text-sm">{fmt.currency(p.discountedPrice || p.price)}</p>
        <button onClick={onAdd} className="w-7 h-7 bg-brand-500 text-white rounded-lg flex items-center justify-center hover:bg-brand-600 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
)

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product: p, onClick, onAdd }) => {
  const cart = useCustomerStore(s => s.cart)
  const update = useCustomerStore(s => s.updateQty)
  const remove = useCustomerStore(s => s.removeFromCart)
  const inCart = cart.find(i => i.product._id === p._id)

  return (
    <div className="card p-4 flex gap-3 cursor-pointer hover:shadow-card-lg transition-all duration-200 group" onClick={onClick}>
      {/* Image */}
      <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-surface-100">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-3xl">{p.type === 'veg' ? '🥦' : '🍗'}</div>}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-sm">{TYPE_ICONS[p.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-surface-900 text-sm leading-tight line-clamp-2">{p.name}</p>
            {p.description && <p className="text-surface-400 text-xs mt-0.5 line-clamp-2">{p.description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {p.spiceLevel && p.spiceLevel !== 'none' && (
            <span className="text-xs text-surface-500">{SPICE_ICONS[p.spiceLevel]}</span>
          )}
          {p.tags?.map(t => (
            <span key={t} className="badge bg-surface-50 text-surface-500 border border-surface-200 text-[10px]">{t}</span>
          ))}
          {p.preparationTime && (
            <span className="flex items-center gap-0.5 text-xs text-surface-400">
              <Clock className="w-3 h-3" />{p.preparationTime}m
            </span>
          )}
        </div>
        {p.avgRating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-surface-600 font-medium">{p.avgRating}</span>
            <span className="text-xs text-surface-400">({p.totalRatings})</span>
          </div>
        )}
        {/* Price + Add */}
        <div className="flex items-center justify-between pt-1" onClick={e => e.stopPropagation()}>
          <div>
            <span className="font-bold text-surface-900 text-sm">{fmt.currency(p.discountedPrice || p.price)}</span>
            {p.discountedPrice && (
              <span className="text-xs text-surface-400 line-through ml-1.5">{fmt.currency(p.price)}</span>
            )}
          </div>
          {inCart
            ? (
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-2 py-1">
                <button onClick={() => { if (inCart.quantity === 1) remove(inCart.key); else update(inCart.key, inCart.quantity - 1) }}
                  className="w-5 h-5 flex items-center justify-center text-brand-600 hover:text-brand-800">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold text-brand-700 w-4 text-center">{inCart.quantity}</span>
                <button onClick={() => update(inCart.key, inCart.quantity + 1)}
                  className="w-5 h-5 flex items-center justify-center text-brand-600 hover:text-brand-800">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )
            : (
              <button onClick={() => {
                if (p.variants?.length || p.addOns?.length) { /* open modal via parent onClick */ }
                else { onAdd() }
              }}
                className="btn-primary px-4 py-2 text-xs">
                Add +
              </button>
            )}
        </div>
      </div>
    </div>
  )
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
const ProductModal = ({ product: p, onClose, onAdd }) => {
  const [qty, setQty]             = useState(1)
  const [variants, setVariants]   = useState({})
  const [addOns, setAddOns]       = useState({})
  const [note, setNote]           = useState('')
  const [reviews, setReviews]     = useState(null)

  useEffect(() => {
    if (!p) return
    setQty(1); setVariants({}); setAddOns({}); setNote('')
    loadReviews()
  }, [p?._id])

  const loadReviews = async () => {
    try {
      const { data } = await customerApi.getReviews(p._id, { limit: 5 })
      setReviews(data.data.reviews)
    } catch { setReviews([]) }
  }

  if (!p) return null

  const selectedAddOnTotal = Object.values(addOns).flat().reduce((s, opt) => s + (opt.price || 0), 0)
  const selectedVariantTotal = Object.values(variants).reduce((s, opt) => s + (opt?.priceAddOn || 0), 0)
  const unitPrice = (p.discountedPrice || p.price) + selectedAddOnTotal + selectedVariantTotal
  const total = unitPrice * qty

  const handleAdd = () => {
    const varArr = Object.entries(variants).map(([name, opt]) => ({ name, selected: opt.label, priceAddOn: opt.priceAddOn || 0 }))
    const aoArr  = Object.entries(addOns).map(([name, opts]) => ({ name, selected: opts.map(o => o.label), price: opts.reduce((s,o)=>s+(o.price||0),0) }))
    onAdd(qty, varArr, aoArr, note)
  }

  return (
    <Modal open={!!p} onClose={onClose} size="lg">
      {/* Hero image */}
      <div className="h-52 bg-gradient-to-br from-brand-100 to-brand-200 relative overflow-hidden">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-7xl">{p.type === 'veg' ? '🥗' : '🍖'}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(p.type === 'veg' ? 'tag-veg' : p.type === 'vegan' ? 'tag-vegan' : 'tag-nonveg')}>{TYPE_ICONS[p.type]} {p.type}</span>
            {p.tags?.includes('bestseller') && <span className="badge bg-brand-500 text-white">🔥 Bestseller</span>}
          </div>
          <h2 className="font-display text-xl font-bold text-white">{p.name}</h2>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Description */}
        {p.description && <p className="text-surface-500 text-sm">{p.description}</p>}

        <div className="flex items-center gap-4 text-sm text-surface-500">
          {p.preparationTime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{p.preparationTime} min</span>}
          {p.spiceLevel !== 'none' && <span>{SPICE_ICONS[p.spiceLevel]} {p.spiceLevel}</span>}
          {p.avgRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />{p.avgRating} ({p.totalRatings})
            </span>
          )}
        </div>

        {/* Variants */}
        {p.variants?.map(v => (
          <div key={v.name} className="space-y-2">
            <p className="font-semibold text-sm text-surface-800">{v.name} <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-2">
              {v.options.map(opt => (
                <button key={opt.label}
                  onClick={() => setVariants(prev => ({ ...prev, [v.name]: opt }))}
                  className={cn('px-3 py-2 rounded-xl border text-sm font-medium transition-all text-left',
                    variants[v.name]?.label === opt.label
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 text-surface-600 hover:border-surface-300')}
                >
                  {opt.label} {opt.priceAddOn > 0 && <span className="text-xs text-brand-500">+{fmt.currency(opt.priceAddOn)}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Add-ons */}
        {p.addOns?.map(ao => (
          <div key={ao.name} className="space-y-2">
            <p className="font-semibold text-sm text-surface-800">{ao.name}</p>
            <div className="grid grid-cols-2 gap-2">
              {ao.options.map(opt => {
                const sel = addOns[ao.name] || []
                const isSelected = sel.find(o => o.label === opt.label)
                return (
                  <button key={opt.label}
                    onClick={() => {
                      const curr = addOns[ao.name] || []
                      setAddOns(prev => ({
                        ...prev,
                        [ao.name]: isSelected ? curr.filter(o => o.label !== opt.label) : [...curr, opt],
                      }))
                    }}
                    className={cn('px-3 py-2 rounded-xl border text-sm transition-all text-left',
                      isSelected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-surface-600 hover:border-surface-300')}
                  >
                    {opt.label} {opt.price > 0 && <span className="text-xs text-brand-500">+{fmt.currency(opt.price)}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Special note */}
        <div>
          <p className="font-semibold text-sm text-surface-800 mb-1.5">Special Instructions</p>
          <input className="input text-sm" placeholder="e.g. less spicy, no onions…" value={note} onChange={e => setNote(e.target.value)} />
        </div>

        {/* Reviews preview */}
        {reviews?.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-sm text-surface-800">Recent Reviews</p>
            {reviews.slice(0, 2).map(r => (
              <div key={r._id} className="bg-surface-50 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size="sm" />
                  <span className="text-xs text-surface-500">{r.customerName}</span>
                </div>
                {r.review && <p className="text-xs text-surface-600">{r.review}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Qty + Add */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-3 bg-surface-100 rounded-xl px-3 py-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-200"><Minus className="w-4 h-4" /></button>
            <span className="font-bold w-6 text-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-200"><Plus className="w-4 h-4" /></button>
          </div>
          <button onClick={handleAdd} className="btn-primary flex-1 justify-between">
            <span>Add to Cart</span>
            <span>{fmt.currency(total)}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CART PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const CartPage = () => {
  const navigate = useNavigate()
  const store = useCustomerStore()
  const { cart, updateQty, removeFromCart, clearCart, restaurantInfo, restaurantId } = store

  const [coupon, setCoupon]         = useState('')
  const [couponData, setCouponData] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [placing, setPlacing]       = useState(false)
  const [customerName, setName]     = useState(store.customerName || '')
  const [guestCount, setGuests]     = useState(store.guestCount || 1)
  const [note, setNote]             = useState('')

  const subtotal = store.cartTotal()
  const discount  = couponData?.discount || 0
  const taxRate   = restaurantInfo?.settings?.taxRate || 18
  const tax       = ((subtotal - discount) * taxRate) / 100
  const total     = subtotal - discount + tax

  const applyCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true)
    try {
      const { data } = await customerApi.applyCoupon({ code: coupon, orderAmount: subtotal })
      setCouponData(data.data)
      toast.success(`Coupon applied! Saving ${fmt.currency(data.data.discount)}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid coupon')
      setCouponData(null)
    } finally { setCouponLoading(false) }
  }

  const placeOrder = async () => {
    if (!customerName.trim()) { toast.error('Please enter your name'); return }
    setPlacing(true)
    try {
      const items = cart.map(i => ({
        productId: i.product._id,
        quantity: i.quantity,
        selectedVariants: i.variants,
        selectedAddOns: i.addOns,
        specialInstructions: i.note,
        categoryName: i.product.categoryId?.name,
      }))
      const { data } = await customerApi.placeOrder({
        items, customerName, guestCount: guestCount || 1,
        specialInstructions: note,
        couponCode: couponData?.coupon?.code,
      })
      store.setCustomerName(customerName)
      store.setGuestCount(guestCount)
      clearCart()
      toast.success('Order placed! 🎉')
      navigate(`/orders`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order')
    } finally { setPlacing(false) }
  }

  if (cart.length === 0) return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center gap-4 p-6">
      <Empty icon="🛒" title="Your cart is empty" desc="Add some delicious items from the menu" action={
        <button onClick={() => navigate(-1)} className="btn-primary mt-2"><ArrowLeft className="w-4 h-4" /> Back to Menu</button>
      } />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50 pb-32">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-surface-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-display text-xl font-bold">Your Cart</h1>
          <span className="badge bg-brand-100 text-brand-700 ml-auto">{store.cartCount()} items</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Customer info */}
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-surface-800">Your Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-surface-500 mb-1 block">Your Name *</label>
              <input className="input" placeholder="Enter name" value={customerName} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-surface-500 mb-1 block">Guests</label>
              <input type="number" min={1} max={20} className="input" value={guestCount === '' ? '' : guestCount} onChange={e => {
  const value = e.target.value

  if (value === '') {
    setGuests('')
  } else {
    const num = parseInt(value)
    if (!isNaN(num)) setGuests(num)
  }
}} />
            </div>
          </div>
        </div>

        {/* Cart items */}
        <div className="card divide-y divide-surface-50">
          {cart.map(item => {
            const price = ((item.product.discountedPrice || item.product.price) +
              item.variants.reduce((s,v)=>s+(v.priceAddOn||0),0) +
              item.addOns.reduce((s,a)=>s+(a.price||0),0))
            return (
              <div key={item.key} className="p-4 flex gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
                  {item.product.images?.[0]
                    ? <img src={item.product.images[0]} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">{item.product.type === 'veg' ? '🥗' : '🍗'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 text-sm">{item.product.name}</p>
                  {item.variants.length > 0 && <p className="text-xs text-surface-400">{item.variants.map(v=>`${v.name}: ${v.selected}`).join(', ')}</p>}
                  {item.addOns.length > 0 && <p className="text-xs text-surface-400">{item.addOns.flatMap(a=>a.selected).join(', ')}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-surface-100 rounded-lg px-2 py-1">
                      <button onClick={() => { if(item.quantity===1) removeFromCart(item.key); else updateQty(item.key, item.quantity-1) }} className="text-surface-600"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.key, item.quantity+1)} className="text-surface-600"><Plus className="w-3 h-3" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{fmt.currency(price * item.quantity)}</span>
                      <button onClick={() => removeFromCart(item.key)} className="text-surface-300 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Coupon */}
        <div className="card p-4 space-y-2">
          <h2 className="font-semibold text-surface-800 text-sm">Promo Code</h2>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Enter coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} />
            <button onClick={applyCoupon} disabled={couponLoading} className="btn-primary px-4">
              {couponLoading ? <Spinner size="sm" /> : 'Apply'}
            </button>
          </div>
          {couponData && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>{couponData.coupon.code} — saving {fmt.currency(couponData.discount)}</span>
              <button onClick={() => setCouponData(null)} className="ml-auto"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        {/* Special note */}
        <div className="card p-4 space-y-2">
          <h2 className="font-semibold text-surface-800 text-sm">Order Instructions</h2>
          <textarea className="input resize-none h-20 text-sm" placeholder="Any special instructions for your order…" value={note} onChange={e => setNote(e.target.value)} />
        </div>

        {/* Bill summary */}
        <div className="card p-4 space-y-2">
          <h2 className="font-semibold text-surface-800">Bill Summary</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-surface-600"><span>Subtotal</span><span>{fmt.currency(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{fmt.currency(discount)}</span></div>}
            <div className="flex justify-between text-surface-600"><span>GST ({taxRate}%)</span><span>{fmt.currency(tax)}</span></div>
            <div className="border-t border-surface-100 pt-2 flex justify-between font-bold text-surface-900">
              <span>Total</span><span>{fmt.currency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Place order button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-100 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button onClick={placeOrder} disabled={placing} className="btn-primary w-full py-4 text-base justify-between">
            {placing ? <><Spinner size="sm" /> Placing Order…</> : <><span>Place Order</span><span>{fmt.currency(total)}</span></>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export const OrdersPage = () => {
  const navigate = useNavigate()
  const { restaurantInfo } = useCustomerStore()
  const [orders, setOrders]     = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [reviewOrder, setReview]= useState(null)
  const [billModal, setBill]    = useState(null)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      const { data } = await customerApi.getOrders()
      setOrders(data.data.orders)
      setSummary(data.data.summary)
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  const requestBill = async () => {
    try {
      await customerApi.requestBill({ paymentPreference: 'cash' })
      toast.success('Staff will bring your bill shortly!')
    } catch { toast.error('Failed to request bill') }
  }

  const callWaiter = async () => {
    try {
      await customerApi.callWaiter({ reason: 'General assistance' })
      toast.success('Waiter notified! 🔔')
    } catch { toast.error('Could not reach staff') }
  }

  if (loading) return <FullPageLoader text="Loading your orders…" />

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-surface-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-display text-xl font-bold">My Orders</h1>
          <button
    onClick={() => navigate(-1)}
    className="btn-primary ml-auto text-xs px-4 py-2 gap-1.5"
  >
    <Plus className="w-3.5 h-3.5" /> Order More
  </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={callWaiter} className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-lg transition-all">
            <Bell className="w-6 h-6 text-brand-500" />
            <span className="text-sm font-medium text-surface-700">Call Waiter</span>
          </button>
          <button onClick={requestBill} className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-lg transition-all">
            <FileText className="w-6 h-6 text-brand-500" />
            <span className="text-sm font-medium text-surface-700">Request Bill</span>
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="card p-4 grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xl font-bold text-surface-900">{summary.totalOrders}</p><p className="text-xs text-surface-500">Orders</p></div>
            <div><p className="text-xl font-bold text-surface-900">{fmt.currency(summary.totalAmount)}</p><p className="text-xs text-surface-500">Total</p></div>
            <div>
              <p className={cn('text-xl font-bold', summary.isPaid ? 'text-green-600' : 'text-amber-600')}>
                {summary.isPaid ? '✅' : fmt.currency(summary.totalAmount)}
              </p>
              <p className="text-xs text-surface-500">{summary.isPaid ? 'Paid' : 'Due'}</p>
            </div>
          </div>
        )}

        {orders.length === 0
          ? <Empty icon="📋" title="No orders yet" desc="Order something delicious!" action={<button onClick={() => navigate(-1)} className="btn-primary mt-2">View Menu</button>} />
          : orders.map(order => (
            <div key={order._id} className="card overflow-hidden">
              <div className="p-4 border-b border-surface-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-surface-900 text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-surface-400">{fmt.datetime(order.createdAt)} · {order.items?.length} item(s)</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="p-4 space-y-2">
                {order.items?.slice(0, 3).map(item => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-surface-600">{item.productName} × {item.quantity}</span>
                    <span className="font-medium">{fmt.currency(item.total)}</span>
                  </div>
                ))}
                {order.items?.length > 3 && <p className="text-xs text-surface-400">+{order.items.length - 3} more items</p>}
              </div>
              <div className="bg-surface-50 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-surface-900">{fmt.currency(order.pricing?.grandTotal)}</span>
                <div className="flex gap-2">
                  {order.status === 'served' && !order.isRated && (
                    <button onClick={() => setReview(order)} className="btn-secondary text-xs px-3 py-1.5">⭐ Rate</button>
                  )}
                  <button onClick={() => setBill(order)} className="btn-secondary text-xs px-3 py-1.5">📄 Bill</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Review modal */}
      <ReviewModal order={reviewOrder} onClose={() => setReview(null)} onSubmit={loadOrders} />
      {/* Bill modal */}
      <BillModal order={billModal} restaurant={restaurantInfo} onClose={() => setBill(null)} />
    </div>
  )
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ order, onClose, onSubmit }) => {
  const [ratings, setRatings]   = useState({})
  const [reviews, setReviews]   = useState({})
  const [name, setName]         = useState('')
  const [submitting, setSub]    = useState(false)

  const submitAll = async () => {
    const items = order?.items?.filter(i => ratings[i.productId])
    if (!items?.length) { toast.error('Please rate at least one item'); return }
    setSub(true)
    try {
      await Promise.all(items.map(item =>
        customerApi.submitReview({
          productId   : item.productId,
          orderId     : order._id,
          rating      : ratings[item.productId],
          review      : reviews[item.productId],
          customerName: name || 'Anonymous',
          type        : 'product',
        })
      ))
      toast.success('Thank you for your feedback! 🙏')
      onSubmit(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit review')
    } finally { setSub(false) }
  }

  return (
    <Modal open={!!order} onClose={onClose} title="Rate Your Food" size="md">
      <div className="p-5 space-y-4">
        <input className="input" placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} />
        {order?.items?.map(item => (
          <div key={item._id} className="space-y-2 p-3 bg-surface-50 rounded-xl">
            <p className="font-medium text-sm">{item.productName}</p>
            <StarRating value={ratings[item.productId] || 0} interactive onChange={v => setRatings(prev => ({ ...prev, [item.productId]: v }))} size="md" />
            {ratings[item.productId] > 0 && (
              <input className="input text-sm" placeholder="Write a review…" value={reviews[item.productId] || ''}
                onChange={e => setReviews(prev => ({ ...prev, [item.productId]: e.target.value }))} />
            )}
          </div>
        ))}
        <button onClick={submitAll} disabled={submitting} className="btn-primary w-full">
          {submitting ? <Spinner size="sm" /> : 'Submit Reviews'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Bill Modal ───────────────────────────────────────────────────────────────
const BillModal = ({ order, restaurant, onClose }) => {
  if (!order) return null
  const p = order.pricing || {}
  return (
    <Modal open={!!order} onClose={onClose} title="Bill Receipt" size="sm">
      <div className="p-5 space-y-4">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold">{restaurant?.name}</h2>
          <p className="text-xs text-surface-500">{restaurant?.address?.street}, {restaurant?.address?.city}</p>
          <p className="text-xs text-surface-400 mt-1">Table {order.tableNumber} · {fmt.datetime(order.createdAt)}</p>
          <p className="text-xs font-mono text-surface-500">#{order.orderNumber}</p>
        </div>
        <div className="border-t border-dashed border-surface-200 pt-3 space-y-1.5">
          {order.items?.map(item => (
            <div key={item._id} className="flex justify-between text-sm">
              <span className="text-surface-600">{item.productName} × {item.quantity}</span>
              <span>{fmt.currency(item.total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-surface-200 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-surface-500"><span>Subtotal</span><span>{fmt.currency(p.subtotal)}</span></div>
          {p.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{fmt.currency(p.discount)}</span></div>}
          <div className="flex justify-between text-surface-500"><span>GST ({p.taxRate}%)</span><span>{fmt.currency(p.tax)}</span></div>
          {p.serviceCharge > 0 && <div className="flex justify-between text-surface-500"><span>Service Charge</span><span>{fmt.currency(p.serviceCharge)}</span></div>}
          {p.tip > 0 && <div className="flex justify-between text-surface-500"><span>Tip</span><span>{fmt.currency(p.tip)}</span></div>}
          <div className="border-t border-surface-200 pt-2 flex justify-between font-bold text-base">
            <span>TOTAL</span><span>{fmt.currency(p.grandTotal)}</span>
          </div>
        </div>
        <div className="text-center text-xs text-surface-400 border-t border-dashed border-surface-200 pt-3">
          <p>Thank you for dining with us! 🙏</p>
          <p>Please visit again</p>
        </div>
        <a href={`/api/bills/${order._id}/download`} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center">
          📥 Download PDF
        </a>
      </div>
    </Modal>
  )
}

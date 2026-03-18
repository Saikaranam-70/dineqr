import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Customer Store ──────────────────────────────────────────────────────────
export const useCustomerStore = create(
  persist(
    (set, get) => ({
      sessionToken : null,
      restaurantId : null,
      tableId      : null,
      tableNumber  : null,
      restaurantInfo: null,
      cart         : [],        // { product, quantity, variants, addOns, note }
      orders       : [],
      customerName : '',
      guestCount   : 1,

      setSession: (data) => set({
        sessionToken  : data.sessionToken,
        restaurantId  : data.restaurant?._id,
        tableId       : data.table?.id,
        tableNumber   : data.table?.tableNumber,
        restaurantInfo: data.restaurant,
      }),

      clearSession: () => set({
        sessionToken: null, restaurantId: null,
        tableId: null, tableNumber: null,
        restaurantInfo: null, cart: [], orders: [],
      }),

      // Cart actions
      addToCart: (product, qty = 1, variants = [], addOns = [], note = '') => {
        const cart = get().cart
        const key  = `${product._id}-${JSON.stringify(variants)}-${JSON.stringify(addOns)}`
        const idx  = cart.findIndex(i => i.key === key)
        if (idx >= 0) {
          const updated = [...cart]
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty }
          set({ cart: updated })
        } else {
          set({ cart: [...cart, { key, product, quantity: qty, variants, addOns, note }] })
        }
      },

      removeFromCart: (key) => set({ cart: get().cart.filter(i => i.key !== key) }),

      updateQty: (key, qty) => {
        if (qty <= 0) return get().removeFromCart(key)
        set({ cart: get().cart.map(i => i.key === key ? { ...i, quantity: qty } : i) })
      },

      clearCart: () => set({ cart: [] }),

      setOrders:      (orders) => set({ orders }),
      setCustomerName:(name)   => set({ customerName: name }),
      setGuestCount:  (n)      => set({ guestCount: n }),

      cartTotal: () => get().cart.reduce((sum, i) => {
        const base = i.product.discountedPrice || i.product.price
        const addOnTotal = i.addOns.reduce((s, a) => s + (a.price || 0), 0)
        const varTotal   = i.variants.reduce((s, v) => s + (v.priceAddOn || 0), 0)
        return sum + (base + addOnTotal + varTotal) * i.quantity
      }, 0),

      cartCount: () => get().cart.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'customer-store', partialize: (s) => ({ sessionToken: s.sessionToken, restaurantId: s.restaurantId, tableId: s.tableId, tableNumber: s.tableNumber, restaurantInfo: s.restaurantInfo, customerName: s.customerName }) }
  )
)

// ─── Admin Store ─────────────────────────────────────────────────────────────
export const useAdminStore = create(
  persist(
    (set, get) => ({
      token        : null,
      refreshToken : null,
      admin        : null,
      restaurant   : null,
      notifications: [],
      unreadCount  : 0,
      liveOrders   : [],

      setAuth: (data) => set({
        token       : data.accessToken,
        refreshToken: data.refreshToken,
        admin       : data.admin,
        restaurant  : data.admin?.restaurant,
      }),

      setRestaurant:    (r) => set({ restaurant: r }),
      clearAuth:        ()  => set({ token: null, refreshToken: null, admin: null, restaurant: null }),
      setNotifications: (n) => set({ notifications: n }),
      setUnreadCount:   (c) => set({ unreadCount: c }),

      addNotification: (n) => set(s => ({
        notifications: [n, ...s.notifications].slice(0, 50),
        unreadCount  : s.unreadCount + 1,
      })),

      setLiveOrders:  (orders) => set({ liveOrders: orders }),
      addLiveOrder:   (order)  => set(s => ({ liveOrders: [order, ...s.liveOrders] })),
      updateLiveOrder:(id, upd) => set(s => ({
        liveOrders: s.liveOrders.map(o => o._id === id ? { ...o, ...upd } : o),
      })),
      removeLiveOrder:(id) => set(s => ({ liveOrders: s.liveOrders.filter(o => o._id !== id) })),

      isAuthenticated: () => !!get().token,
      hasPermission:   (p) => {
        const a = get().admin
        if (!a) return false
        if (['super_admin','restaurant_owner'].includes(a.role)) return true
        return a.permissions?.includes(p)
      },
    }),
    { name: 'admin-store', partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken, admin: s.admin, restaurant: s.restaurant }) }
  )
)

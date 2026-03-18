import axios from 'axios'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'

// ── Axios instances ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export const adminApi = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptors ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sessionToken')
  if (token) config.headers['X-Session-Token'] = token
  return config
})

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ── Response interceptors ────────────────────────────────────────────────────
const handleError = (error) => {
  if (error.response?.status === 401) {
    if (window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      window.location.href = '/admin/login'
    }
  }
  return Promise.reject(error)
}

api.interceptors.response.use((r) => r, handleError)
adminApi.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refreshToken')
        const { data } = await axios.post(`${BASE}/admin/auth/refresh`, { refreshToken: refresh })
        localStorage.setItem('adminToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        original.headers['Authorization'] = `Bearer ${data.data.accessToken}`
        return adminApi(original)
      } catch {
        localStorage.clear()
        window.location.href = '/admin/login'
      }
    }
    return handleError(error)
  },
)

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const customerApi = {
  // Table & session
  scanQR:         (token)          => api.get(`/tables/scan/${token}`),
  updateSession:  (data)           => api.patch('/tables/session', data),
  getSession:     ()               => api.get('/tables/session/summary'),
  requestBill:    (data)           => api.post('/tables/session/request-bill', data),
  callWaiter:     (data)           => api.post('/tables/session/call-waiter', data),

  // Menu
  getRestaurant:  (slug)           => api.get(`/restaurants/${slug}`),
  getCategories:  (rid)            => api.get(`/menu/${rid}/categories`),
  getProducts:    (rid, params)    => api.get(`/menu/${rid}/products`, { params }),
  getFeatured:    (rid)            => api.get(`/menu/${rid}/products/featured`),
  getProduct:     (rid, pid)       => api.get(`/menu/${rid}/products/${pid}`),
  searchProducts: (rid, q)         => api.get(`/menu/${rid}/products/search`, { params: { q } }),

  // Orders
  placeOrder:     (data)           => api.post('/orders', data),
  getOrders:      ()               => api.get('/orders'),
  getOrderStatus: (id)             => api.get(`/orders/${id}/status`),

  // Payments
  initiatePayment:(data)           => api.post('/payments/initiate', data),
  verifyPayment:  (data)           => api.post('/payments/verify/razorpay', data),
  applyCoupon:    (data)           => api.post('/payments/apply-coupon', data),

  // Reviews
  submitReview:   (data)           => api.post('/reviews', data),
  getReviews:     (pid, params)    => api.get(`/reviews/products/${pid}`, { params }),

  // Bill
  getReceipt:     (id)             => api.get(`/bills/${id}/receipt`),
  downloadBill:   (id)             => `${BASE}/bills/${id}/download`,
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const adminApiService = {
  // Auth
  login:          (data)           => adminApi.post('/admin/auth/login', data),
  logout:         ()               => adminApi.post('/admin/auth/logout'),
  getMe:          ()               => adminApi.get('/admin/auth/me'),
  changePassword: (data)           => adminApi.patch('/admin/auth/change-password', data),

  // Restaurant
  getRestaurant:  ()               => adminApi.get('/admin/restaurant'),
  updateRestaurant:(data)          => adminApi.put('/admin/restaurant', data),

  // Dashboard
  getDashboard:   ()               => adminApi.get('/admin/analytics/dashboard'),
  getSales:       (params)         => adminApi.get('/admin/analytics/sales', { params }),
  getProductAnalytics:(params)     => adminApi.get('/admin/analytics/products', { params }),
  getReport:      (params)         => adminApi.get('/admin/analytics/report', { params }),

  // Menu
  getCategories:  ()               => adminApi.get('/admin/menu/categories'),
  createCategory: (data)           => adminApi.post('/admin/menu/categories', data),
  updateCategory: (id, data)       => adminApi.put(`/admin/menu/categories/${id}`, data),
  deleteCategory: (id)             => adminApi.delete(`/admin/menu/categories/${id}`),

  getProducts:    (params)         => adminApi.get('/admin/menu/products', { params }),
  createProduct:  (data)           => adminApi.post('/admin/menu/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct:  (id, data)       => adminApi.put(`/admin/menu/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct:  (id)             => adminApi.delete(`/admin/menu/products/${id}`),
  toggleProduct:  (id)             => adminApi.patch(`/admin/menu/products/${id}/toggle`),

  // Tables
  getTables:      ()               => adminApi.get('/admin/tables'),
  createTable:    (data)           => adminApi.post('/admin/tables', data),
  updateTable:    (id, data)       => adminApi.put(`/admin/tables/${id}`, data),
  deleteTable:    (id)             => adminApi.delete(`/admin/tables/${id}`),
  regenerateQR:   (id)             => adminApi.post(`/admin/tables/${id}/regenerate-qr`),
  getSessions:    (params)         => adminApi.get('/admin/tables/sessions', { params }),
  closeSession:   (id)             => adminApi.post(`/admin/tables/sessions/${id}/close`),

  // Orders
  getOrders:      (params)         => adminApi.get('/admin/orders', { params }),
  getLiveOrders:  ()               => adminApi.get('/admin/orders/live'),
  getOrder:       (id)             => adminApi.get(`/admin/orders/${id}`),
  updateStatus:   (id, data)       => adminApi.patch(`/admin/orders/${id}/status`, data),
  cancelOrder:    (id, data)       => adminApi.patch(`/admin/orders/${id}/cancel`, data),
  markPayment:    (id, data)       => adminApi.patch(`/admin/orders/${id}/payment`, data),
  generateBill:   (id)             => adminApi.post(`/admin/orders/${id}/bill`),

  // Reviews
  getReviews:     (params)         => adminApi.get('/admin/reviews', { params }),
  replyReview:    (id, data)       => adminApi.patch(`/admin/reviews/${id}/reply`, data),
  approveReview:  (id)             => adminApi.patch(`/admin/reviews/${id}/approve`),
  deleteReview:   (id)             => adminApi.delete(`/admin/reviews/${id}`),

  // Staff
  getStaff:       ()               => adminApi.get('/admin/staff'),
  createStaff:    (data)           => adminApi.post('/admin/staff', data),
  updateStaff:    (id, data)       => adminApi.put(`/admin/staff/${id}`, data),
  deleteStaff:    (id)             => adminApi.delete(`/admin/staff/${id}`),
  toggleStaff:    (id)             => adminApi.patch(`/admin/staff/${id}/toggle`),

  // Coupons
  getCoupons:     ()               => adminApi.get('/admin/coupons'),
  createCoupon:   (data)           => adminApi.post('/admin/coupons', data),
  updateCoupon:   (id, data)       => adminApi.put(`/admin/coupons/${id}`, data),
  deleteCoupon:   (id)             => adminApi.delete(`/admin/coupons/${id}`),
  toggleCoupon:   (id)             => adminApi.patch(`/admin/coupons/${id}/toggle`),

  // Notifications
  getNotifications: ()             => adminApi.get('/admin/notifications'),
  markRead:       (id)             => adminApi.patch(`/admin/notifications/${id}/read`),
  markAllRead:    ()               => adminApi.patch('/admin/notifications/read-all'),

  getOrderBill:   (id) => adminApi.get(`/admin/orders/${id}/bill`),
getSessionBill: (id) => adminApi.get(`/admin/tables/sessions/${id}/bill`),

  // Payments
  refund:         (data)           => adminApi.post('/admin/payments/refund', data),
}

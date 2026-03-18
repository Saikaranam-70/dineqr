import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAdminStore } from '@/store'

// Customer pages
import {
  ScanPage,
  MenuPage,
  CartPage,
  OrdersPage,
} from '@/pages/CustomerPages'

// Admin pages
import { AdminLogin, AdminLayout } from '@/pages/AdminLayout'
import { DashboardPage }           from '@/pages/AdminDashboard'
import { OrdersPage as AdminOrdersPage } from '@/pages/AdminOrders'
import {
  MenuPage        as AdminMenuPage,
  TablesPage,
  AnalyticsPage,
  ReviewsPage,
  StaffPage,
  CouponsPage,
  NotificationsPage,
  SettingsPage,
} from '@/pages/AdminPages'

// ── Auth guard ────────────────────────────────────────────────────────────────
const RequireAuth = ({ children }) => {
  const token    = useAdminStore(s => s.token)
  const location = useLocation()
  if (!token) return <Navigate to="/admin/login" state={{ from: location }} replace />
  return children
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* ── Customer routes ── */}
      <Route path="/scan/:token"          element={<ScanPage />} />
      <Route path="/menu/:restaurantId"   element={<MenuPage />} />
      <Route path="/cart"                 element={<CartPage />} />
      <Route path="/orders"               element={<OrdersPage />} />

      {/* ── Admin routes ── */}
      <Route path="/admin/login"          element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index                      element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"           element={<DashboardPage />} />
        <Route path="orders"              element={<AdminOrdersPage />} />
        <Route path="menu"                element={<AdminMenuPage />} />
        <Route path="tables"              element={<TablesPage />} />
        <Route path="analytics"           element={<AnalyticsPage />} />
        <Route path="reviews"             element={<ReviewsPage />} />
        <Route path="staff"               element={<StaffPage />} />
        <Route path="coupons"             element={<CouponsPage />} />
        <Route path="notifications"       element={<NotificationsPage />} />
        <Route path="settings"            element={<SettingsPage />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="/"                     element={<Navigate to="/admin/login" replace />} />
      <Route path="*"                     element={<NotFound />} />
    </Routes>
  )
}

const NotFound = () => (
  <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center gap-4 text-center p-6">
    <span className="text-7xl">🍽️</span>
    <h1 className="font-display text-3xl font-bold text-surface-900">Page Not Found</h1>
    <p className="text-surface-500">The page you're looking for doesn't exist.</p>
    <a href="/admin/login" className="btn-primary mt-2">Go to Dashboard</a>
  </div>
)

import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

/**
 * مسیر محافظت‌شده. به‌صورت route چیدمانی استفاده می‌شود:
 *
 *   <Route element={<ProtectedRoute />}>…</Route>
 *   <Route element={<ProtectedRoute roles={['librarian', 'admin']} />}>…</Route>
 *
 * توجه: این فقط تجربه کاربری است. کنترل واقعی دسترسی همیشه با سرور است.
 */
export default function ProtectedRoute({ roles }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <p role="status" className="page-status">
        در حال بررسی ورود…
      </p>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <section className="page-status">
        <h1>دسترسی ندارید</h1>
        <p>حساب شما اجازه دیدن این بخش را ندارد.</p>
        <Link to="/">بازگشت به فهرست منابع</Link>
      </section>
    )
  }

  return <Outlet />
}

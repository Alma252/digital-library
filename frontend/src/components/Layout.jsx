import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import './layout.css'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          کتابخانه دیجیتال
        </Link>
        <nav aria-label="منوی اصلی">
          {user ? (
            <>
              <span className="header__user">{user.username}</span>
              <button type="button" className="header__logout" onClick={logout}>
                خروج
              </button>
            </>
          ) : (
            <>
              <Link to="/login">ورود</Link>
              <Link to="/register">ثبت‌نام</Link>
            </>
          )}
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}

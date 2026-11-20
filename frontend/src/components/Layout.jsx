import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          کتابخانه دیجیتال
        </Link>
        <nav>
          <Link to="/login">ورود</Link>
          <Link to="/register">ثبت‌نام</Link>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

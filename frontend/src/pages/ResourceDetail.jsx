import { Link } from 'react-router-dom'

// جای‌نگهدار. در مرحله بعد با صفحه جزئیات واقعی جایگزین می‌شود.
export default function ResourceDetail() {
  return (
    <section>
      <h1>جزئیات منبع</h1>
      <p>این صفحه در مرحله بعد ساخته می‌شود.</p>
      <Link to="/">بازگشت به فهرست منابع</Link>
    </section>
  )
}

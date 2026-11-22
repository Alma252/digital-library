import { Link } from 'react-router-dom'
import './forms.css'
import './resource-detail.css'

const ACTIONS = [
  { key: 'preview', label: 'پیش‌نمایش' },
  { key: 'read', label: 'مطالعه آنلاین' },
  { key: 'download', label: 'دانلود' },
]

/**
 * سه عملیات مستقل (پیش‌نمایش، مطالعه، دانلود). فقط بر اساس permissions سرور فعال می‌شوند.
 * کنترل نهایی همیشه با سرور است؛ این فقط تجربه کاربری است (RBAC-11).
 */
export default function ResourceActions({ permissions, accessStatus, isAuthenticated, onAction }) {
  const allowedCount = ACTIONS.filter(({ key }) => permissions[key]).length

  return (
    <section className="actions" aria-label="عملیات">
      <ul className="actions__list">
        {ACTIONS.map(({ key, label }) => (
          <li key={key}>
            <button type="button" className="btn-submit btn-submit--inline" disabled={!permissions[key]} onClick={() => onAction(key)}>
              {label}
            </button>
            {!permissions[key] && <span className="actions__reason">مجاز نیست</span>}
          </li>
        ))}
      </ul>

      {allowedCount === 0 && isAuthenticated && (
        <p className="actions__hint">حساب شما مجوز مطالعه یا دانلود این منبع را ندارد.</p>
      )}
      {accessStatus !== 'full' && !isAuthenticated && (
        <p className="actions__hint">
          با ورود به حساب ممکن است دسترسی بیشتری داشته باشید. <Link to="/login">وارد شوید</Link>
        </p>
      )}
    </section>
  )
}

import './resource-list.css'

/**
 * پیام وضعیت برای حالت‌های جدا از هم: خطای سرور، بدون نتیجه، بدون مجوز.
 * tone: 'error' | 'empty' | 'forbidden'  (فقط برای ظاهر؛ متن همیشه وضعیت را می‌گوید)
 */
export default function StateMessage({ tone = 'empty', title, children, action }) {
  return (
    <section className={`state state--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <h2 className="state__title">{title}</h2>
      {children && <p className="state__text">{children}</p>}
      {action && <div className="state__action">{action}</div>}
    </section>
  )
}

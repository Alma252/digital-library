import './resource-list.css'

// اسکلت بارگذاری اولیه. برای صفحه‌خوان‌ها فقط یک پیام «در حال بارگذاری» خوانده می‌شود.
export default function ResourceListSkeleton({ count = 6 }) {
  return (
    <div>
      <p role="status" className="visually-hidden">
        در حال بارگذاری منابع…
      </p>
      <ul className="resource-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="resource-card resource-card--skeleton">
            <span className="skeleton skeleton--title" />
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--tags" />
          </li>
        ))}
      </ul>
    </div>
  )
}

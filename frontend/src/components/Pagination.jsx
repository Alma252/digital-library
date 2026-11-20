import { faNumber } from '../utils/format.js'
import './resource-list.css'

// برای ۲۰ صفحه: ۱ … ۴ ۵ ۶ … ۲۰
function pageItems(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const items = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(total - 1, page + 1)
  if (start > 2) items.push('gap-start')
  for (let number = start; number <= end; number += 1) items.push(number)
  if (end < total - 1) items.push('gap-end')
  items.push(total)
  return items
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="صفحه‌بندی">
      <ul>
        <li>
          <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            قبلی
          </button>
        </li>
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'string' ? (
            <li key={item} className="pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                aria-label={`صفحه ${faNumber(item)}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => item !== page && onChange(item)}
              >
                {faNumber(item)}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
            بعدی
          </button>
        </li>
      </ul>
    </nav>
  )
}

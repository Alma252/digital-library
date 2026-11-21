import { useEffect, useState } from 'react'
import { FILE_TYPE_LABELS, LANGUAGE_LABELS } from '../utils/labels.js'
import './forms.css'
import './resource-list.css'

/**
 * نوار جست‌وجو و فیلتر. مقدارها از URL می‌آیند (values) و تغییرها با onChange به صفحه برمی‌گردند.
 * تغییر هر فیلتر صفحه را به ۱ برمی‌گرداند (page: '').
 */
export default function ResourceFilters({ values, categories, hasFilters, onChange, onClear }) {
  const [searchText, setSearchText] = useState(values.search)
  const [syncedSearch, setSyncedSearch] = useState(values.search)

  // وقتی URL عوض شد (دکمه برگشت مرورگر، پاک‌کردن فیلترها)، کادر جست‌وجو هم هماهنگ شود
  if (values.search !== syncedSearch) {
    setSyncedSearch(values.search)
    setSearchText(values.search)
  }

  // جست‌وجو ۴۰۰ میلی‌ثانیه بعد از آخرین تایپ اعمال می‌شود (Enter فوراً اعمال می‌کند)
  useEffect(() => {
    if (searchText.trim() === values.search) return undefined
    const timer = setTimeout(() => onChange({ search: searchText.trim(), page: '' }), 400)
    return () => clearTimeout(timer)
  }, [searchText, values.search, onChange])

  function handleSubmit(event) {
    event.preventDefault()
    onChange({ search: searchText.trim(), page: '' })
  }

  function handleClear() {
    setSearchText('')
    onClear()
  }

  return (
    <div className="toolbar">
      <form className="toolbar__search field" role="search" onSubmit={handleSubmit}>
        <label className="field__label" htmlFor="filter-search">
          جست‌وجو در عنوان، نویسنده و کلیدواژه
        </label>
        <input
          id="filter-search"
          type="search"
          className="field__input"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          autoComplete="off"
        />
      </form>

      <div className="field">
        <label className="field__label" htmlFor="filter-category">
          دسته‌بندی
        </label>
        <select
          id="filter-category"
          className="field__input"
          value={values.category}
          onChange={(event) => onChange({ category: event.target.value, page: '' })}
        >
          <option value="">همه</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-language">
          زبان
        </label>
        <select
          id="filter-language"
          className="field__input"
          value={values.language}
          onChange={(event) => onChange({ language: event.target.value, page: '' })}
        >
          <option value="">همه</option>
          {Object.entries(LANGUAGE_LABELS).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-file-type">
          قالب فایل
        </label>
        <select
          id="filter-file-type"
          className="field__input"
          value={values.file_type}
          onChange={(event) => onChange({ file_type: event.target.value, page: '' })}
        >
          <option value="">همه</option>
          {Object.entries(FILE_TYPE_LABELS).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button type="button" className="link-button toolbar__clear" onClick={handleClear}>
          پاک‌کردن فیلترها
        </button>
      )}
    </div>
  )
}

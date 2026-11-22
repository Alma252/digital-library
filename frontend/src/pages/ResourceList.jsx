import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listCategories } from '../api/resources.js'
import Pagination from '../components/Pagination.jsx'
import ResourceCard from '../components/ResourceCard.jsx'
import ResourceFilters from '../components/ResourceFilters.jsx'
import ResourceListSkeleton from '../components/ResourceListSkeleton.jsx'
import StateMessage from '../components/StateMessage.jsx'
import { useAuth } from '../context/useAuth.js'
import useResourceList from '../hooks/useResourceList.js'
import { faNumber } from '../utils/format.js'
import '../components/resource-list.css'

const FILTER_KEYS = ['search', 'category', 'language', 'file_type']

/** پیام مناسب هر نوع خطا. چهار حالت (بارگذاری، خطای سرور، بدون نتیجه، بدون مجوز) از هم جدا هستند. */
function ErrorState({ error, onRetry, isAuthenticated }) {
  if (error.status === 403) {
    return (
      <StateMessage
        tone="forbidden"
        title="اجازه دیدن این فهرست را ندارید"
        action={!isAuthenticated && <Link to="/login">برای ادامه وارد شوید</Link>}
      >
        حساب شما به این بخش دسترسی ندارد.
      </StateMessage>
    )
  }

  const offline = error.code === 'network_error'
  return (
    <StateMessage
      tone="error"
      title={offline ? 'ارتباط با سرور برقرار نشد' : 'مشکلی در سرور پیش آمد'}
      action={
        <button type="button" className="btn-submit btn-submit--inline" onClick={onRetry}>
          تلاش دوباره
        </button>
      }
    >
      {offline ? 'اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.' : 'مشکل از شما نیست. کمی بعد دوباره تلاش کنید.'}
    </StateMessage>
  )
}

export default function ResourceList() {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])

  // همه‌چیز در URL نگه داشته می‌شود: دکمه برگشت، رفرش و اشتراک لینک درست کار می‌کنند.
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || '']))
  const hasFilters = FILTER_KEYS.some((key) => filters[key])

  const params = { page }
  for (const key of FILTER_KEYS) if (filters[key]) params[key] = filters[key]

  const { status, data, error, reload } = useResourceList(params)

  // دسته‌بندی‌ها فقط برای فیلتر هستند. اگر بارگذاری نشدند، بقیه صفحه کار می‌کند.
  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const update = useCallback(
    (changes, options) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      }, options)
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    update({ search: '', category: '', language: '', file_type: '', page: '' })
  }, [update])

  // شماره صفحه نامعتبر (مثلاً ?page=99): بی‌صدا به صفحه ۱ برمی‌گردیم (SRCH-13)
  useEffect(() => {
    if (status === 'error' && error.status === 404 && page > 1) update({ page: '' }, { replace: true })
  }, [status, error, page, update])

  function goToPage(next) {
    update({ page: next > 1 ? String(next) : '' })
    window.scrollTo({ top: 0 })
  }

  let content
  if (status === 'error') {
    content = <ErrorState error={error} onRetry={reload} isAuthenticated={isAuthenticated} />
  } else if (!data) {
    content = <ResourceListSkeleton />
  } else if (data.count === 0) {
    content = hasFilters ? (
      <StateMessage
        title="نتیجه‌ای پیدا نشد"
        action={
          <button type="button" className="btn-submit btn-submit--inline" onClick={clearFilters}>
            پاک‌کردن فیلترها
          </button>
        }
      >
        عبارت جست‌وجو یا فیلترها را تغییر دهید. مثلاً املای دیگری از کلمه را امتحان کنید.
      </StateMessage>
    ) : (
      <StateMessage title="هنوز منبعی ثبت نشده است">وقتی کتابدار منبع تازه‌ای منتشر کند، اینجا نمایش داده می‌شود.</StateMessage>
    )
  } else {
    content = (
      <>
        <p className="results-count" aria-live="polite">
          {faNumber(data.count, { grouping: true })} منبع
          {data.total_pages > 1 && ` · صفحه ${faNumber(data.page)} از ${faNumber(data.total_pages)}`}
        </p>
        <ul className="resource-grid">
          {data.results.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </ul>
        <Pagination page={data.page} totalPages={data.total_pages} onChange={goToPage} />
      </>
    )
  }

  return (
    <section aria-busy={status === 'loading'}>
      <h1>فهرست منابع</h1>
      <ResourceFilters
        values={filters}
        categories={categories}
        hasFilters={hasFilters}
        onChange={update}
        onClear={clearFilters}
      />
      <div className={status === 'loading' && data ? 'results results--loading' : 'results'}>{content}</div>
    </section>
  )
}

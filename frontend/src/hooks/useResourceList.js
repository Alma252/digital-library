import { useEffect, useState } from 'react'
import { listResources } from '../api/resources.js'
import { parseApiError } from '../utils/errors.js'

/**
 * فهرست منابع را برای params می‌گیرد.
 * status: 'loading' | 'success' | 'error'
 * هنگام بارگذاری دوباره (تغییر صفحه یا فیلتر) نتیجه قبلی در data نگه داشته می‌شود تا صفحه نپرد.
 */
export default function useResourceList(params) {
  const key = JSON.stringify(params)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ requestId: null, data: null, error: null })

  const requestId = `${key}#${attempt}`

  useEffect(() => {
    let ignore = false // پاسخ درخواست قدیمی نباید روی درخواست تازه‌تر بنشیند

    listResources(JSON.parse(key))
      .then((data) => {
        if (!ignore) setResult({ requestId, data, error: null })
      })
      .catch((error) => {
        if (!ignore) setResult({ requestId, data: null, error: parseApiError(error) })
      })

    return () => {
      ignore = true
    }
  }, [key, requestId])

  // اگر نتیجه برای درخواست فعلی نیست، هنوز در حال بارگذاری هستیم
  const settled = result.requestId === requestId
  const status = !settled ? 'loading' : result.error ? 'error' : 'success'

  return {
    status,
    data: result.data,
    error: settled ? result.error : null,
    reload: () => setAttempt((count) => count + 1),
  }
}

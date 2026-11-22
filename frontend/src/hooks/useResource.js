import { useEffect, useState } from 'react'
import { getResource } from '../api/resources.js'
import { parseApiError } from '../utils/errors.js'

/**
 * جزئیات یک منبع.
 * status: 'loading' | 'success' | 'error'
 * با عوض‌شدن id، داده منبع قبلی هرگز نشان داده نمی‌شود.
 */
export default function useResource(id) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ requestId: null, data: null, error: null })

  const requestId = `${id}#${attempt}`

  useEffect(() => {
    let ignore = false

    getResource(id)
      .then((data) => {
        if (!ignore) setResult({ requestId, data, error: null })
      })
      .catch((error) => {
        if (!ignore) setResult({ requestId, data: null, error: parseApiError(error) })
      })

    return () => {
      ignore = true
    }
  }, [id, requestId])

  const settled = result.requestId === requestId
  const status = !settled ? 'loading' : result.error ? 'error' : 'success'

  return {
    status,
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    reload: () => setAttempt((count) => count + 1),
  }
}

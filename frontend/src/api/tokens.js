// نگهداری توکن‌ها. اگر localStorage در دسترس نبود (مثلاً حالت خصوصی)، خطا نمی‌دهد.
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

function safe(fn) {
  try {
    return fn()
  } catch {
    return null
  }
}

export const getAccessToken = () => safe(() => localStorage.getItem(ACCESS_KEY))
export const getRefreshToken = () => safe(() => localStorage.getItem(REFRESH_KEY))

export function setTokens({ access, refresh }) {
  safe(() => {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  })
}

export function clearTokens() {
  safe(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  })
}

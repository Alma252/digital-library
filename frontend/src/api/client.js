import axios from 'axios'
import { API_URL } from './config.js'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokens.js'

// وقتی refresh هم شکست بخورد، این رویداد پخش می‌شود تا AuthContext کاربر را خارج کند.
export const AUTH_LOGOUT_EVENT = 'auth:logout'

const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// این آدرس‌ها هرگز refresh نمی‌شوند (خطای 401 در ورود یعنی رمز اشتباه، نه توکن منقضی)
const NO_REFRESH_URLS = ['/auth/login/', '/auth/register/', '/auth/refresh/']

// اگر چند درخواست همزمان 401 بگیرند، فقط یک refresh انجام می‌شود.
let refreshing = null

function refreshAccessToken() {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_URL}/auth/refresh/`, { refresh: getRefreshToken() })
      .then((res) => {
        setTokens({ access: res.data.access })
        return res.data.access
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const skip = NO_REFRESH_URLS.some((url) => original?.url?.includes(url))

    if (status !== 401 || !original || original._retried || skip || !getRefreshToken()) {
      return Promise.reject(error)
    }

    original._retried = true
    try {
      const access = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${access}`
      return client(original)
    } catch {
      clearTokens()
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
      return Promise.reject(error)
    }
  },
)

export default client

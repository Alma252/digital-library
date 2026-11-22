import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { AUTH_LOGOUT_EVENT } from '../api/client.js'
import { clearTokens, getAccessToken, setTokens } from '../api/tokens.js'
import { parseApiError } from '../utils/errors.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // اگر توکنی ذخیره شده، تا بازیابی کاربر منتظر می‌مانیم تا صفحه‌های محافظت‌شده اشتباهاً به /login نروند.
  const [initializing, setInitializing] = useState(() => Boolean(getAccessToken()))

  // بازیابی نشست بعد از رفرش صفحه
  useEffect(() => {
    if (!getAccessToken()) return undefined
    let cancelled = false
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch((error) => {
        // فقط وقتی سرور صراحتاً گفت نشست نامعتبر است توکن‌ها را دور بریز.
        // اگر فقط اینترنت قطع بود، توکن می‌ماند.
        if (parseApiError(error).status === 401) clearTokens()
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // وقتی refresh هم شکست بخورد (client.js)، کاربر خارج می‌شود.
  useEffect(() => {
    const onForcedLogout = () => setUser(null)
    window.addEventListener(AUTH_LOGOUT_EVENT, onForcedLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onForcedLogout)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials)
    setTokens({ access: data.access, refresh: data.refresh })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // حتی اگر سرور جواب نداد، خروج در مرورگر انجام می‌شود
    }
    clearTokens()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, initializing, isAuthenticated: Boolean(user), login, logout }),
    [user, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

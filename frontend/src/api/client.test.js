import axios, { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import client, { AUTH_LOGOUT_EVENT } from './client.js'
import { getAccessToken, getRefreshToken, setTokens } from './tokens.js'

// یک «سرور» ساختگی به‌جای شبکه. adapter هم برای client و هم برای axios خام (فراخوانی refresh) گذاشته می‌شود.
let calls
let refreshWorks

function reply(config, status, data) {
  const response = { data, status, statusText: '', headers: {}, config }
  if (status >= 200 && status < 300) return Promise.resolve(response)
  return Promise.reject(new AxiosError('خطا', 'ERR_BAD_REQUEST', config, null, response))
}

function fakeServer(config) {
  calls.push({ url: config.url, auth: config.headers?.Authorization })
  if (config.url.includes('/auth/refresh/')) {
    return refreshWorks ? reply(config, 200, { access: 'new-access' }) : reply(config, 401, { code: 'unauthorized' })
  }
  if (config.url.includes('/auth/login/')) return reply(config, 401, { code: 'unauthorized' })
  if (config.headers?.Authorization === 'Bearer new-access') return reply(config, 200, { ok: config.url })
  return reply(config, 401, { code: 'unauthorized' })
}

beforeEach(() => {
  calls = []
  refreshWorks = true
  client.defaults.adapter = fakeServer
  axios.defaults.adapter = fakeServer
})

describe('client: refresh خودکار توکن (قرارداد ۱.۱)', () => {
  it('توکن دسترسی را در هدر Authorization می‌فرستد', async () => {
    setTokens({ access: 'new-access', refresh: 'r1' })
    await client.get('/resources/')
    expect(calls[0].auth).toBe('Bearer new-access')
  })

  it('با 401: یک‌بار refresh می‌زند و همان درخواست را با توکن تازه تکرار می‌کند', async () => {
    setTokens({ access: 'old', refresh: 'r1' })
    const response = await client.get('/resources/')
    expect(response.data).toEqual({ ok: '/resources/' })
    expect(getAccessToken()).toBe('new-access')
    expect(calls.filter((call) => call.url.includes('/auth/refresh/'))).toHaveLength(1)
  })

  it('چند درخواست همزمان با 401: فقط یک refresh انجام می‌شود', async () => {
    setTokens({ access: 'old', refresh: 'r1' })
    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')])
    expect(results.every((response) => response.data.ok)).toBe(true)
    expect(calls.filter((call) => call.url.includes('/auth/refresh/'))).toHaveLength(1)
  })

  it('401 در ورود (رمز اشتباه) هرگز refresh نمی‌شود', async () => {
    setTokens({ access: 'old', refresh: 'r1' })
    await expect(client.post('/auth/login/', {})).rejects.toMatchObject({ response: { status: 401 } })
    expect(calls.some((call) => call.url.includes('/auth/refresh/'))).toBe(false)
  })

  it('اگر refresh هم شکست بخورد: توکن‌ها پاک و رویداد خروج پخش می‌شود', async () => {
    refreshWorks = false
    setTokens({ access: 'old', refresh: 'r1' })
    const onLogout = vi.fn()
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout)

    await expect(client.get('/resources/')).rejects.toMatchObject({ response: { status: 401 } })

    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout)
  })

  it('بدون refresh token، 401 مستقیم رد می‌شود و refresh نمی‌زند', async () => {
    setTokens({ access: 'old' })
    await expect(client.get('/resources/')).rejects.toMatchObject({ response: { status: 401 } })
    expect(calls.some((call) => call.url.includes('/auth/refresh/'))).toBe(false)
  })

  it('درخواست تکرارشده دوباره تکرار نمی‌شود (حلقه بی‌نهایت نداریم)', async () => {
    // سرور حتی با توکن تازه هم 401 می‌دهد
    const stubborn = (config) =>
      config.url.includes('/auth/refresh/') ? reply(config, 200, { access: 'x' }) : reply(config, 401, {})
    client.defaults.adapter = stubborn
    axios.defaults.adapter = stubborn
    setTokens({ access: 'old', refresh: 'r1' })
    await expect(client.get('/resources/')).rejects.toMatchObject({ response: { status: 401 } })
  })
})

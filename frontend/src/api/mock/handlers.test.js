import { describe, expect, it } from 'vitest'
import { parseApiError } from '../../utils/errors.js'
import { clearTokens, setTokens } from '../tokens.js'
import * as mock from './handlers.js'

const failure = async (run) => {
  try {
    await run()
  } catch (error) {
    return parseApiError(error)
  }
  throw new Error('انتظار خطا داشتیم ولی خطایی نیامد')
}

async function loginAs(username, password) {
  const data = await mock.login({ username, password })
  setTokens(data)
  return data
}

describe('mock: فهرست منابع (مطابق قرارداد)', () => {
  it('شکل پاسخ: صفحه‌بندی و فیلدهای هر آیتم', async () => {
    const data = await mock.listResources({})
    expect(data).toMatchObject({ page: 1, page_size: 10, total_pages: 3, previous: null })
    expect(data.next).toContain('page=2')
    expect(data.results).toHaveLength(10)
    expect(Object.keys(data.results[0]).sort()).toEqual(
      ['access_policy', 'access_status', 'authors', 'calendar', 'categories', 'file_type', 'id', 'language', 'publication_year', 'status', 'title'].sort(),
    )
  })

  it('هر منبع آرایه categories دارد و category قدیمی حذف شده', async () => {
    const { results } = await mock.listResources({})
    expect(results.every((item) => Array.isArray(item.categories) && item.categories.length > 0)).toBe(true)
    expect(results.some((item) => 'category' in item)).toBe(false)
    expect(results.some((item) => item.categories.length > 1)).toBe(true)
  })

  it('کاربر ناشناس فقط منتشرشده‌ها را می‌بیند (۲۳ از ۲۶)', async () => {
    const data = await mock.listResources({})
    expect(data.count).toBe(23)
    expect(data.results.every((item) => item.status === 'published')).toBe(true)
  })

  it('کتابدار همه ۲۶ منبع را می‌بیند', async () => {
    await loginAs('librarian', 'lib12345')
    expect((await mock.listResources({})).count).toBe(26)
    clearTokens()
  })

  it('صفحه آخر ۳ آیتم دارد و next خالی است', async () => {
    const data = await mock.listResources({ page: 3 })
    expect(data.results).toHaveLength(3)
    expect(data.next).toBeNull()
    expect(data.previous).toContain('page=2')
  })

  it('صفحه فراتر از آخر: 404 (SRCH-13)', async () => {
    expect((await failure(() => mock.listResources({ page: 4 }))).status).toBe(404)
  })

  it('page_size پیش‌فرض ۱۰ و حداکثر ۵۰ است', async () => {
    expect((await mock.listResources({ page_size: 500 })).page_size).toBe(50)
    expect((await mock.listResources({ page_size: 5 })).results).toHaveLength(5)
  })

  it('جست‌وجو «ي/ي» و «ك/ک» را یکی می‌گیرد (SRCH-10)', async () => {
    const data = await mock.listResources({ search: 'تاريخ' })
    expect(data.results.map((item) => item.title)).toContain('تاریخ معاصر ایران')
  })

  it('جست‌وجو در نام نویسنده هم انجام می‌شود', async () => {
    const data = await mock.listResources({ search: 'سارا' })
    expect(data.count).toBeGreaterThan(0)
    expect(data.results.every((item) => item.authors.some((author) => author.name.includes('سارا')))).toBe(true)
  })

  it('فیلتر دسته‌بندی: منبعی که این دسته را دارد (حتی اگر چند دسته داشته باشد)', async () => {
    // «فلسفه علم برای همه» هم در فلسفه (۴) و هم علوم پایه (۵) است
    const data = await mock.listResources({ category: 5, page_size: 50 })
    expect(data.results.length).toBeGreaterThan(0)
    expect(data.results.every((item) => item.categories.some((category) => category.id === 5))).toBe(true)
    expect(data.results.some((item) => item.title.startsWith('فلسفه علم'))).toBe(true)
  })

  it('فیلترهای مختلف با «و» ترکیب می‌شوند (SRCH-06)', async () => {
    const data = await mock.listResources({ language: 'fa', file_type: 'epub', category: 1, page_size: 50 })
    expect(data.results.length).toBeGreaterThan(0)
    expect(
      data.results.every(
        (item) => item.language === 'fa' && item.file_type === 'epub' && item.categories.some((category) => category.id === 1),
      ),
    ).toBe(true)
  })

  it('نتیجه خالی: count صفر و total_pages صفر (نه خطا)', async () => {
    const data = await mock.listResources({ search: 'zzzz' })
    expect(data).toMatchObject({ count: 0, total_pages: 0, results: [], next: null })
  })

  it('next فیلترها را نگه می‌دارد', async () => {
    const data = await mock.listResources({ search: 'کتاب', page_size: 1 })
    if (data.next) expect(data.next).toContain('search=')
  })

  it('کلیدهای تست خطا: 500، 403 و قطع ارتباط', async () => {
    expect((await failure(() => mock.listResources({ search: '__error__' }))).status).toBe(500)
    expect((await failure(() => mock.listResources({ search: '__forbidden__' }))).status).toBe(403)
    expect((await failure(() => mock.listResources({ search: '__offline__' }))).code).toBe('network_error')
  })
})

describe('mock: وضعیت دسترسی (SRCH-12، ACL)', () => {
  it('ناشناس: members ← partial، restricted ← none، public ← full', async () => {
    const { results } = await mock.listResources({ page_size: 50 })
    const status = (policy) => new Set(results.filter((item) => item.access_policy === policy).map((item) => item.access_status))
    expect(status('public')).toEqual(new Set(['full']))
    expect(status('members')).toEqual(new Set(['partial']))
    expect(status('restricted')).toEqual(new Set(['none']))
  })

  it('کاربر واردشده به منابع members دسترسی کامل دارد', async () => {
    await loginAs('user', 'user1234')
    const { results } = await mock.listResources({ page_size: 50 })
    expect(results.filter((item) => item.access_policy === 'members').every((item) => item.access_status === 'full')).toBe(true)
    clearTokens()
  })
})

describe('mock: جزئیات منبع', () => {
  it('شکل پاسخ شامل permissions، files و categories است', async () => {
    const { results } = await mock.listResources({})
    const detail = await mock.getResource(results[0].id)
    expect(detail.permissions).toEqual({ preview: true, read: true, download: true })
    expect(detail.files[0]).toMatchObject({ processing_status: 'ready' })
    expect(Array.isArray(detail.categories)).toBe(true)
    expect(detail).not.toHaveProperty('category')
  })

  it('منبع پیش‌نویس برای ناشناس 404 است (وجودش فاش نمی‌شود)', async () => {
    expect((await failure(() => mock.getResource('00000000-0000-4000-8000-000000000009'))).status).toBe(404)
  })

  it('شناسه ناموجود 404 است', async () => {
    expect((await failure(() => mock.getResource('nope'))).status).toBe(404)
  })
})

describe('mock: احراز هویت', () => {
  it('ورود با فیلد خالی: خطای هر فیلد', async () => {
    const error = await failure(() => mock.login({}))
    expect(error.status).toBe(400)
    expect(Object.keys(error.fieldErrors).sort()).toEqual(['password', 'username'])
  })

  it('رمز اشتباه: 400 با non_field_errors', async () => {
    const error = await failure(() => mock.login({ username: 'user', password: 'bad' }))
    expect(error.status).toBe(400)
    expect(error.formErrors).toEqual(['نام کاربری یا رمز عبور اشتباه است.'])
  })

  it('بعد از ۵ ورود اشتباه، 429 با retry_after (AUTH-06)', async () => {
    for (let i = 0; i < 5; i += 1) await failure(() => mock.login({ username: 'ali', password: `x${i}` }))
    const error = await failure(() => mock.login({ username: 'ali', password: 'y' }))
    expect(error).toMatchObject({ status: 429, code: 'throttled', retryAfter: 30 })
  })

  it('ورود موفق: access، refresh و کاربر (بدون رمز)', async () => {
    const data = await mock.login({ username: 'librarian', password: 'lib12345' })
    expect(data.access).toBeTruthy()
    expect(data.refresh).toBeTruthy()
    expect(data.user).toEqual({ id: 2, username: 'librarian', role: 'librarian' })
  })

  it('me: با توکن کاربر را می‌دهد و بدون توکن 401', async () => {
    expect((await failure(() => mock.me())).status).toBe(401)
    await loginAs('user', 'user1234')
    expect(await mock.me()).toMatchObject({ username: 'user', role: 'user' })
    clearTokens()
  })

  it('refresh: توکن معتبر access تازه می‌دهد، نامعتبر 401', async () => {
    const { refresh } = await mock.login({ username: 'user', password: 'user1234' })
    expect((await mock.refresh({ refresh })).access).toMatch(/^mock-access-3-/)
    expect((await failure(() => mock.refresh({ refresh: 'bad' }))).status).toBe(401)
  })

  it('ثبت‌نام: خطای هر فیلد (تکراری، ایمیل، رمز کوتاه)', async () => {
    const error = await failure(() => mock.register({ username: 'user', email: 'bad', password: '123' }))
    expect(Object.keys(error.fieldErrors).sort()).toEqual(['email', 'password', 'username'])
  })

  it('ثبت‌نام موفق: 201 با نقش user و بدون رمز', async () => {
    const data = await mock.register({ username: 'newbie', email: 'n@example.com', password: 'abcdefgh' })
    expect(data).toMatchObject({ username: 'newbie', email: 'n@example.com', role: 'user' })
    expect(data).not.toHaveProperty('password')
  })
})

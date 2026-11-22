import { normalizeFa } from '../../utils/normalizeFa.js'
import { getAccessToken } from '../tokens.js'
import { authors, categories, resources, users } from './data.js'

// ───────── ابزارها ─────────

// در تست‌ها تأخیر صفر است تا سریع اجرا شوند
const delay = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : ms))

// خطایی با همان شکل خطای axios می‌سازد تا parseApiError بدون تفاوت کار کند.
function apiError(status, body) {
  const error = new Error(body.message || 'خطا')
  error.response = { status, data: body }
  return error
}

const required = 'این فیلد الزامی است.'

function currentUser() {
  const token = getAccessToken() || ''
  const match = token.match(/^mock-access-(\d+)/)
  return match ? users.find((u) => u.id === Number(match[1])) || null : null
}

const isStaff = (user) => user?.role === 'admin' || user?.role === 'librarian'

function accessStatus(resource, user) {
  if (resource.access_policy === 'public') return 'full'
  if (resource.access_policy === 'members') return user ? 'full' : 'partial'
  return isStaff(user) ? 'full' : 'none'
}

function permissionsFor(status) {
  if (status === 'full') return { preview: true, read: true, download: true }
  if (status === 'partial') return { preview: true, read: false, download: false }
  return { preview: false, read: false, download: false }
}

function toListItem(resource, user) {
  return {
    id: resource.id,
    title: resource.title,
    authors: resource.authors,
    publication_year: resource.publication_year,
    calendar: resource.calendar,
    language: resource.language,
    categories: resource.categories,
    file_type: resource.file_type,
    status: resource.status,
    access_policy: resource.access_policy,
    access_status: accessStatus(resource, user),
  }
}

function toDetail(resource, user) {
  const status = accessStatus(resource, user)
  const { file_type: _fileType, ...rest } = resource
  return { ...rest, access_status: status, permissions: permissionsFor(status) }
}

// ───────── منابع ─────────

export async function listResources(params = {}) {
  await delay()

  // برای تست حالت‌های خطا در صفحه فهرست، در کادر جست‌وجو یکی از این‌ها را بنویسید:
  //   __error__      خطای سرور (500)
  //   __forbidden__  نبود مجوز (403)
  //   __offline__    قطع ارتباط با سرور
  if (params.search === '__error__') {
    throw apiError(500, { code: 'server_error', message: 'خطای داخلی سرور.' })
  }
  if (params.search === '__forbidden__') {
    throw apiError(403, { code: 'forbidden', message: 'شما اجازه دیدن این فهرست را ندارید.' })
  }
  if (params.search === '__offline__') {
    throw new Error('Network Error')
  }

  const user = currentUser()
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(params.page_size) || 10))
  const query = normalizeFa(params.search || '')

  const filtered = resources.filter((r) => {
    if (!isStaff(user) && r.status !== 'published') return false
    if (params.category && !r.categories.some((c) => String(c.id) === String(params.category))) return false
    if (params.language && r.language !== params.language) return false
    if (params.file_type && r.file_type !== params.file_type) return false
    if (query) {
      const haystack = normalizeFa([r.title, r.keywords, ...r.authors.map((a) => a.name)].join(' '))
      if (!haystack.includes(query)) return false
    }
    return true
  })

  const count = filtered.length
  const totalPages = Math.ceil(count / pageSize)
  if (page > 1 && page > totalPages) {
    throw apiError(404, { code: 'not_found', message: 'صفحه نامعتبر است.' })
  }

  const link = (target) => {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries({ ...params, page: target, page_size: pageSize })) {
      if (value !== undefined && value !== '') qs.set(key, value)
    }
    return `/api/resources/?${qs.toString()}`
  }

  const start = (page - 1) * pageSize
  return {
    count,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    next: page < totalPages ? link(page + 1) : null,
    previous: page > 1 ? link(page - 1) : null,
    results: filtered.slice(start, start + pageSize).map((r) => toListItem(r, user)),
  }
}

export async function getResource(id) {
  await delay(300)

  // برای تست حالت‌های خطا در صفحه جزئیات، این‌ها را در آدرس بنویسید:
  //   /resources/__error__   /resources/__forbidden__   /resources/__offline__
  if (id === '__error__') throw apiError(500, { code: 'server_error', message: 'خطای داخلی سرور.' })
  if (id === '__forbidden__') throw apiError(403, { code: 'forbidden', message: 'مجوز ندارید.' })
  if (id === '__offline__') throw new Error('Network Error')

  const user = currentUser()
  const resource = resources.find((r) => r.id === id)
  if (!resource || (!isStaff(user) && resource.status !== 'published')) {
    throw apiError(404, { code: 'not_found', message: 'منبع پیدا نشد.' })
  }
  return toDetail(resource, user)
}

export async function listCategories() {
  await delay(150)
  return categories
}

export async function listAuthors(params = {}) {
  await delay(150)
  const query = normalizeFa(params.search || '')
  return authors.filter((a) => !query || normalizeFa(a.name).includes(query))
}

// ───────── احراز هویت ─────────

// برای تست خطای 429: بعد از ۵ ورود اشتباه پشت‌سرهم با یک نام کاربری
const failedLogins = {}

export async function login({ username, password } = {}) {
  await delay()

  const errors = {}
  if (!username) errors.username = [required]
  if (!password) errors.password = [required]
  if (Object.keys(errors).length) {
    throw apiError(400, { code: 'validation_error', message: 'ورودی نامعتبر است.', errors })
  }

  if ((failedLogins[username] || 0) >= 5) {
    throw apiError(429, {
      code: 'throttled',
      message: 'تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.',
      retry_after: 30,
    })
  }

  const user = users.find((u) => u.username === username && u.password === password)
  if (!user) {
    failedLogins[username] = (failedLogins[username] || 0) + 1
    throw apiError(400, {
      code: 'validation_error',
      message: 'ورود ناموفق بود.',
      errors: { non_field_errors: ['نام کاربری یا رمز عبور اشتباه است.'] },
    })
  }

  failedLogins[username] = 0
  return {
    access: `mock-access-${user.id}-${Date.now()}`,
    refresh: `mock-refresh-${user.id}`,
    user: { id: user.id, username: user.username, role: user.role },
  }
}

export async function register({ username, email, password } = {}) {
  await delay()

  const errors = {}
  if (!username) errors.username = [required]
  else if (users.some((u) => u.username === username)) errors.username = ['این نام کاربری قبلاً ثبت شده است.']

  if (!email) errors.email = [required]
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = ['ایمیل معتبر وارد کنید.']
  else if (users.some((u) => u.email === email)) errors.email = ['این ایمیل قبلاً ثبت شده است.']

  if (!password) errors.password = [required]
  else if (password.length < 8) errors.password = ['رمز عبور باید حداقل ۸ نویسه باشد.']

  if (Object.keys(errors).length) {
    throw apiError(400, { code: 'validation_error', message: 'ورودی نامعتبر است.', errors })
  }

  const user = { id: users.length + 1, username, email, password, role: 'user' }
  users.push(user) // فقط تا رفرش صفحه می‌ماند
  return { id: user.id, username, email, role: 'user' }
}

export async function refresh({ refresh: token } = {}) {
  await delay(150)
  const match = String(token || '').match(/^mock-refresh-(\d+)$/)
  if (!match) {
    throw apiError(401, { code: 'unauthorized', message: 'نشست شما منقضی شده است. دوباره وارد شوید.' })
  }
  return { access: `mock-access-${match[1]}-${Date.now()}` }
}

export async function logout() {
  await delay(100)
}

export async function me() {
  await delay(200)
  const user = currentUser()
  if (!user) {
    throw apiError(401, { code: 'unauthorized', message: 'برای ادامه باید وارد شوید.' })
  }
  return { id: user.id, username: user.username, email: user.email, role: user.role }
}

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '../context/AuthContext.jsx'
import { login } from '../api/auth.js'
import { clearTokens, setTokens } from '../api/tokens.js'
import ResourceDetail from './ResourceDetail.jsx'

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

function renderDetail(resourceId, state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/resources/${resourceId}`, state }]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>فهرست</p>} />
          <Route path="/resources/:id" element={<ResourceDetail />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => clearTokens())

describe('صفحه جزئیات منبع', () => {
  it('اول اسکلت، بعد عنوان و اطلاعات و فایل‌ها', async () => {
    renderDetail(id(1))
    expect(screen.getByRole('status')).toHaveTextContent('در حال بارگذاری')
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'فایل‌ها' })).toBeInTheDocument()
    expect(screen.getByText('ناشر')).toBeInTheDocument()
  })

  it('منبع عمومی: هر سه عملیات برای ناشناس فعال است', async () => {
    renderDetail(id(1))
    await screen.findByRole('heading', { level: 1 })
    for (const name of ['پیش‌نمایش', 'مطالعه آنلاین', 'دانلود']) {
      expect(screen.getByRole('button', { name })).toBeEnabled()
    }
  })

  it('کلیک روی عملیات، پیام «بعد از آماده‌شدن API» را نشان می‌دهد', async () => {
    renderDetail(id(1))
    await userEvent.click(await screen.findByRole('button', { name: 'دانلود' }))
    expect(screen.getByRole('status')).toHaveTextContent('API فایل')
  })

  it('منبع محدود برای ناشناس: دکمه غیرفعال با متن «مجاز نیست» و لینک ورود', async () => {
    renderDetail(id(10))
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: 'دانلود' })).toBeDisabled()
    expect(screen.getAllByText('مجاز نیست').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'وارد شوید' })).toBeInTheDocument()
  })

  it('منبع پیش‌نویس برای ناشناس: پیام «منبع پیدا نشد»', async () => {
    renderDetail(id(9))
    expect(await screen.findByText('منبع پیدا نشد')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'برای ادامه وارد شوید' })).toBeInTheDocument()
  })

  it('403 و 404 یک پیام یکسان دارند (ACL-12)', async () => {
    const a = renderDetail('__forbidden__')
    await screen.findByText('منبع پیدا نشد')
    const forbidden = document.body.textContent
    a.unmount()
    renderDetail(id(9))
    await screen.findByText('منبع پیدا نشد')
    expect(document.body.textContent).toBe(forbidden)
  })

  it('خطای سرور: پیام و دکمه تلاش دوباره', async () => {
    renderDetail('__error__')
    expect(await screen.findByText('مشکلی در سرور پیش آمد')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'تلاش دوباره' })).toBeInTheDocument()
  })

  it('قطع شبکه: پیام ارتباط', async () => {
    renderDetail('__offline__')
    expect(await screen.findByText('ارتباط با سرور برقرار نشد')).toBeInTheDocument()
  })

  it('لینک بازگشت آدرس فهرست (جست‌وجو و صفحه) را نگه می‌دارد', async () => {
    renderDetail(id(1), { listSearch: '?page=2&language=fa' })
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('link', { name: 'بازگشت به فهرست منابع' })).toHaveAttribute('href', '/?page=2&language=fa')
  })

  it('کاربر واردشده و پیش‌نویس: کتابدار می‌تواند ببیند', async () => {
    const { access, refresh } = await login({ username: 'librarian', password: 'lib12345' })
    setTokens({ access, refresh })
    renderDetail(id(9))
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('پیش‌نویس')).toBeInTheDocument()
  })
})

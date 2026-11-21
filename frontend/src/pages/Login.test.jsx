import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../context/AuthContext.jsx'
import Login from './Login.jsx'
import Register from './Register.jsx'

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>صفحه اصلی</p>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('صفحه ورود (AUTH-09، UX-04)', () => {
  it('خطای فیلد فقط بعد از خروج از فیلد نشان داده می‌شود و با درست‌شدن فوراً می‌رود', async () => {
    renderApp('/login')
    const username = screen.getByLabelText(/نام کاربری/)

    await userEvent.type(username, 'a')
    await userEvent.clear(username)
    expect(screen.queryByText('نام کاربری را وارد کنید.')).not.toBeInTheDocument()

    await userEvent.tab()
    expect(screen.getByText('نام کاربری را وارد کنید.')).toBeInTheDocument()
    expect(username).toHaveAttribute('aria-invalid', 'true')

    await userEvent.type(username, 'a')
    expect(screen.queryByText('نام کاربری را وارد کنید.')).not.toBeInTheDocument()
  })

  it('ارسال خالی: خطای هر دو فیلد و فوکوس روی اولین فیلد', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: 'وارد شوید' }))
    expect(screen.getByText('نام کاربری را وارد کنید.')).toBeInTheDocument()
    expect(screen.getByText('رمز عبور را وارد کنید.')).toBeInTheDocument()
    expect(screen.getByLabelText(/نام کاربری/)).toHaveFocus()
  })

  it('رمز اشتباه: پیام بالای فرم می‌آید و داده‌های واردشده حفظ می‌شوند', async () => {
    renderApp('/login')
    await userEvent.type(screen.getByLabelText(/نام کاربری/), 'user')
    await userEvent.type(screen.getByLabelText(/رمز عبور/), 'bad-pass')
    await userEvent.click(screen.getByRole('button', { name: 'وارد شوید' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('نام کاربری یا رمز عبور اشتباه است.')
    expect(screen.getByLabelText(/نام کاربری/)).toHaveValue('user')
    expect(screen.getByLabelText(/رمز عبور/)).toHaveValue('bad-pass')
    expect(screen.getByRole('button', { name: 'وارد شوید' })).toBeEnabled()
  })

  it('ورود موفق: توکن ذخیره می‌شود و کاربر به صفحه اصلی می‌رود', async () => {
    renderApp('/login')
    await userEvent.type(screen.getByLabelText(/نام کاربری/), 'user')
    await userEvent.type(screen.getByLabelText(/رمز عبور/), 'user1234')
    await userEvent.click(screen.getByRole('button', { name: 'وارد شوید' }))

    expect(await screen.findByText('صفحه اصلی')).toBeInTheDocument()
    expect(localStorage.getItem('access_token')).toBeTruthy()
    expect(localStorage.getItem('refresh_token')).toBeTruthy()
  })

  it('دکمه نمایش/پنهان رمز نوع فیلد را عوض می‌کند', async () => {
    renderApp('/login')
    const password = screen.getByLabelText(/رمز عبور/)
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'نمایش' }))
    expect(password).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'پنهان' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('بعد از ۵ ورود اشتباه، پیام محدودیت با تعداد ثانیه (فارسی) نشان داده می‌شود', async () => {
    renderApp('/login')
    await userEvent.type(screen.getByLabelText(/نام کاربری/), 'victim')
    await userEvent.type(screen.getByLabelText(/رمز عبور/), 'x')
    for (let i = 0; i < 6; i += 1) {
      await userEvent.click(screen.getByRole('button', { name: 'وارد شوید' }))
      await screen.findByRole('alert')
      await screen.findByRole('button', { name: 'وارد شوید' })
    }
    expect(screen.getByRole('alert')).toHaveTextContent('۳۰ ثانیه')
  })
})

describe('صفحه ثبت‌نام', () => {
  it('خطای سرور (نام کاربری تکراری) کنار همان فیلد می‌آید و بقیه داده‌ها می‌مانند', async () => {
    renderApp('/register')
    await userEvent.type(screen.getByLabelText(/نام کاربری/), 'user')
    await userEvent.type(screen.getByLabelText(/ایمیل/), 'fresh@example.com')
    await userEvent.type(screen.getByLabelText(/رمز عبور/), 'abcdefgh')
    await userEvent.click(screen.getByRole('button', { name: 'ایجاد حساب' }))

    expect(await screen.findByText('این نام کاربری قبلاً ثبت شده است.')).toBeInTheDocument()
    expect(screen.getByLabelText(/ایمیل/)).toHaveValue('fresh@example.com')
    expect(screen.getByLabelText(/رمز عبور/)).toHaveValue('abcdefgh')
  })

  it('رمز کوتاه و ایمیل نامعتبر قبل از ارسال به سرور رد می‌شوند', async () => {
    renderApp('/register')
    await userEvent.type(screen.getByLabelText(/نام کاربری/), 'sara')
    await userEvent.type(screen.getByLabelText(/ایمیل/), 'bad')
    await userEvent.type(screen.getByLabelText(/رمز عبور/), '123')
    await userEvent.click(screen.getByRole('button', { name: 'ایجاد حساب' }))

    expect(screen.getByText(/ایمیل معتبر وارد کنید/)).toBeInTheDocument()
    expect(screen.getByText('رمز عبور باید حداقل ۸ نویسه باشد.')).toBeInTheDocument()
  })

  it('ثبت‌نام موفق: به ورود می‌رود، پیام موفقیت و نام کاربری پر شده', async () => {
    renderApp('/register')
    await userEvent.type(screen.getByLabelText(/نام کاربری/), 'sara')
    await userEvent.type(screen.getByLabelText(/ایمیل/), 'sara@example.com')
    await userEvent.type(screen.getByLabelText(/رمز عبور/), 'abcdefgh')
    await userEvent.click(screen.getByRole('button', { name: 'ایجاد حساب' }))

    expect(await screen.findByText('حساب شما ساخته شد. برای ادامه وارد شوید.')).toBeInTheDocument()
    expect(screen.getByLabelText(/نام کاربری/)).toHaveValue('sara')
  })
})

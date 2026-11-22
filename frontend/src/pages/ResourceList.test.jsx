import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../context/AuthContext.jsx'
import ResourceList from './ResourceList.jsx'

// آدرس فعلی را در صفحه نشان می‌دهد تا بتوانیم «حالت در URL» را بررسی کنیم
function Where() {
  const location = useLocation()
  return <span data-testid="where">{location.pathname + location.search}</span>
}

function renderList(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ResourceList />
        <Where />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const cards = () => screen.queryAllByRole('listitem').filter((item) => item.classList.contains('resource-card'))
const where = () => screen.getByTestId('where').textContent

describe('صفحه فهرست منابع (VIEW-01، VIEW-04، SRCH)', () => {
  it('اول اسکلت بارگذاری، بعد ۱۰ کارت و شمارنده', async () => {
    renderList()
    expect(screen.getByRole('status')).toHaveTextContent('در حال بارگذاری')
    expect(await screen.findByText('۲۳ منبع · صفحه ۱ از ۳')).toBeInTheDocument()
    expect(cards()).toHaveLength(10)
  })

  it('صفحه‌بندی: صفحه در URL می‌آید و صفحه ۳ سه کارت دارد', async () => {
    renderList()
    await screen.findByText(/صفحه ۱ از ۳/)
    await userEvent.click(screen.getByRole('button', { name: 'صفحه ۳' }))
    await screen.findByText(/صفحه ۳ از ۳/)
    expect(where()).toBe('/?page=3')
    expect(cards()).toHaveLength(3)
  })

  it('هنگام بارگذاری دوباره، نتیجه قبلی می‌ماند (صفحه نمی‌پرد)', async () => {
    renderList()
    await screen.findByText(/صفحه ۱ از ۳/)
    await userEvent.click(screen.getByRole('button', { name: 'صفحه ۲' }))
    expect(cards().length).toBeGreaterThan(0)
    await screen.findByText(/صفحه ۲ از ۳/)
  })

  it('فیلتر زبان در URL ذخیره و صفحه به ۱ برمی‌گردد', async () => {
    renderList('/?page=2')
    await screen.findByText(/صفحه ۲ از ۳/)
    await userEvent.selectOptions(screen.getByLabelText('زبان'), 'en')
    await screen.findByText('۳ منبع')
    expect(where()).toBe('/?language=en')
    expect(cards().every((card) => within(card).queryByText('انگلیسی'))).toBe(true)
  })

  it('فیلترها از URL خوانده می‌شوند (لینک قابل اشتراک)', async () => {
    renderList('/?language=en&category=3')
    await screen.findByText('۳ منبع')
    expect(screen.getByLabelText('زبان')).toHaveValue('en')
    expect(screen.getByLabelText('دسته‌بندی')).toHaveValue('3')
  })

  it('جست‌وجو بعد از مکث تایپ اعمال می‌شود و «ي» عربی هم پیدا می‌کند', async () => {
    renderList()
    await screen.findByText(/صفحه ۱ از ۳/)
    await userEvent.type(screen.getByRole('searchbox'), 'تاريخ')
    await waitFor(() => expect(where()).toContain('search='), { timeout: 2000 })
    expect(await screen.findByRole('link', { name: /تاریخ معاصر ایران/ })).toBeInTheDocument()
  })

  it('بدون نتیجه: پیام جدا + دکمه پاک‌کردن فیلترها که لیست را برمی‌گرداند', async () => {
    renderList('/?search=zzzz')
    expect(await screen.findByText('نتیجه‌ای پیدا نشد')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const state = screen.getByText('نتیجه‌ای پیدا نشد').closest('section')
    await userEvent.click(within(state).getByRole('button', { name: 'پاک‌کردن فیلترها' }))

    await screen.findByText(/صفحه ۱ از ۳/)
    expect(where()).toBe('/')
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('خطای سرور: پیام جدا با «تلاش دوباره»', async () => {
    renderList('/?search=__error__')
    expect(await screen.findByRole('alert')).toHaveTextContent('مشکلی در سرور پیش آمد')
    expect(screen.getByRole('button', { name: 'تلاش دوباره' })).toBeInTheDocument()
  })

  it('نبود مجوز (403): پیام جدا، بدون تلاش دوباره، با لینک ورود برای ناشناس', async () => {
    renderList('/?search=__forbidden__')
    expect(await screen.findByText('اجازه دیدن این فهرست را ندارید')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'تلاش دوباره' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'برای ادامه وارد شوید' })).toHaveAttribute('href', '/login')
  })

  it('قطع ارتباط: پیام مخصوص خودش', async () => {
    renderList('/?search=__offline__')
    expect(await screen.findByText('ارتباط با سرور برقرار نشد')).toBeInTheDocument()
  })

  it('شماره صفحه نامعتبر بی‌صدا به صفحه ۱ برمی‌گردد (SRCH-13)', async () => {
    renderList('/?page=99')
    await screen.findByText(/صفحه ۱ از ۳/)
    expect(where()).toBe('/')
  })
})

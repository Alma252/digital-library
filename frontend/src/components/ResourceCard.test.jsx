import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ResourceCard from './ResourceCard.jsx'

const base = {
  id: 'abc-123',
  title: 'تاریخ معاصر ایران',
  authors: [{ id: 1, name: 'سارا محمدی' }],
  publication_year: 1395,
  calendar: 'shamsi',
  language: 'fa',
  categories: [{ id: 2, name: 'تاریخ' }],
  file_type: 'pdf',
  status: 'published',
  access_policy: 'public',
  access_status: 'full',
}

const renderCard = (overrides = {}) =>
  render(
    <MemoryRouter>
      <ul>
        <ResourceCard resource={{ ...base, ...overrides }} />
      </ul>
    </MemoryRouter>,
  )

describe('ResourceCard (SRCH-12، SRCH-11)', () => {
  it('عنوان، نویسنده، سال با تقویم، دسته، زبان، قالب و دسترسی را نشان می‌دهد', () => {
    renderCard()
    expect(screen.getByRole('link', { name: 'تاریخ معاصر ایران' })).toHaveAttribute('href', '/resources/abc-123')
    expect(screen.getByText('سارا محمدی')).toBeInTheDocument()
    expect(screen.getByText('۱۳۹۵ (شمسی)')).toBeInTheDocument()
    expect(screen.getByText('تاریخ')).toBeInTheDocument()
    expect(screen.getByText('فارسی')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
    expect(screen.getByText('دسترسی کامل')).toBeInTheDocument()
  })

  it('چند دسته‌بندی را کنار هم نشان می‌دهد', () => {
    renderCard({ categories: [{ id: 4, name: 'فلسفه' }, { id: 5, name: 'علوم پایه' }] })
    expect(screen.getByText('فلسفه، علوم پایه')).toBeInTheDocument()
  })

  it('بدون دسته‌بندی، آیتم دسته نمایش داده نمی‌شود', () => {
    renderCard({ categories: [] })
    expect(screen.queryByText('تاریخ', { selector: 'li' })).not.toBeInTheDocument()
  })

  it('چند نویسنده را با «،» جدا می‌کند و بدون نویسنده «نامشخص» می‌نویسد', () => {
    const { unmount } = renderCard({ authors: [{ id: 1, name: 'الف' }, { id: 2, name: 'ب' }] })
    expect(screen.getByText('الف', { exact: false }).closest('p')).toHaveTextContent('الف، ب')
    unmount()
    renderCard({ authors: [] })
    expect(screen.getByText('نویسنده نامشخص')).toBeInTheDocument()
  })

  it('تقویم میلادی و سال نامشخص (SRCH-11)', () => {
    const { unmount } = renderCard({ publication_year: 2019, calendar: 'gregorian' })
    expect(screen.getByText('۲۰۱۹ (میلادی)')).toBeInTheDocument()
    unmount()
    renderCard({ publication_year: null })
    expect(screen.getByText('سال نامشخص')).toBeInTheDocument()
  })

  it('وضعیت دسترسی با متن نوشته می‌شود (partial و none)', () => {
    const { unmount } = renderCard({ access_status: 'partial' })
    expect(screen.getByText('دسترسی محدود')).toBeInTheDocument()
    unmount()
    renderCard({ access_status: 'none' })
    expect(screen.getByText('بدون دسترسی')).toBeInTheDocument()
  })

  it('منبع پیش‌نویس یا بایگانی‌شده برچسب وضعیت دارد، منتشرشده ندارد', () => {
    const { unmount } = renderCard({ status: 'draft' })
    expect(screen.getByText('پیش‌نویس')).toBeInTheDocument()
    unmount()
    renderCard({ status: 'published' })
    expect(screen.queryByText('منتشرشده')).not.toBeInTheDocument()
  })
})

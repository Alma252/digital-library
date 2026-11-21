import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Pagination from './Pagination.jsx'

describe('Pagination', () => {
  it('برای یک صفحه یا کمتر چیزی نمایش نمی‌دهد', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('صفحه فعلی aria-current دارد و «قبلی» در صفحه اول غیرفعال است', () => {
    render(<Pagination page={1} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'صفحه ۱' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'صفحه ۲' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'قبلی' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'بعدی' })).toBeEnabled()
  })

  it('«بعدی» در صفحه آخر غیرفعال است', () => {
    render(<Pagination page={3} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'بعدی' })).toBeDisabled()
  })

  it('برای صفحه‌های زیاد فقط اول، آخر و همسایه‌های فعلی را نشان می‌دهد', () => {
    render(<Pagination page={10} totalPages={20} onChange={() => {}} />)
    for (const number of ['۱', '۹', '۱۰', '۱۱', '۲۰']) {
      expect(screen.getByRole('button', { name: `صفحه ${number}` })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: 'صفحه ۵' })).not.toBeInTheDocument()
    expect(screen.getAllByText('…')).toHaveLength(2)
  })

  it('با کلیک شماره صفحه درست به onChange می‌رسد', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'صفحه ۳' }))
    await userEvent.click(screen.getByRole('button', { name: 'قبلی' }))
    expect(onChange).toHaveBeenNthCalledWith(1, 3)
    expect(onChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('کلیک روی صفحه فعلی onChange را صدا نمی‌زند', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'صفحه ۲' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})

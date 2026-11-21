import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useForm from './useForm.js'

const rules = { name: (value) => (value ? '' : 'الزامی است.') }
const field = (value) => ({ target: { name: 'name', value } })

function setup() {
  return renderHook(() => useForm({ name: '' }, rules))
}

describe('useForm (UX-04، AUTH-09)', () => {
  it('موقع تایپ خطای تازه نشان نمی‌دهد (فقط بعد از blur)', () => {
    const { result } = setup()
    act(() => result.current.handleChange(field('')))
    expect(result.current.errors).toEqual({})
  })

  it('بعد از blur روی فیلد نامعتبر خطا نشان می‌دهد', () => {
    const { result } = setup()
    act(() => result.current.handleBlur(field('')))
    expect(result.current.errors.name).toBe('الزامی است.')
  })

  it('به‌محض درست‌شدن مقدار، خطا فوراً پاک می‌شود', () => {
    const { result } = setup()
    act(() => result.current.handleBlur(field('')))
    act(() => result.current.handleChange(field('الف')))
    expect(result.current.errors.name).toBe('')
    expect(result.current.values.name).toBe('الف')
  })

  it('خطای سرور با blur (بدون تغییر مقدار) پاک نمی‌شود، ولی با ویرایش پاک می‌شود', () => {
    const { result } = setup()
    act(() => result.current.handleChange(field('sara')))
    act(() => result.current.setFieldErrors({ name: 'این نام قبلاً ثبت شده است.' }))
    act(() => result.current.handleBlur(field('sara')))
    expect(result.current.errors.name).toBe('این نام قبلاً ثبت شده است.')
    act(() => result.current.handleChange(field('sara2')))
    expect(result.current.errors.name).toBe('')
  })

  it('ارسال نامعتبر: onValid صدا زده نمی‌شود و فوکوس به اولین فیلد خطادار می‌رود', () => {
    const { result } = setup()
    const onValid = vi.fn()
    const focus = vi.fn()
    const event = { preventDefault: vi.fn(), currentTarget: { elements: { name: { focus } } } }

    act(() => {
      result.current.submit(onValid)(event)
    })

    expect(event.preventDefault).toHaveBeenCalled()
    expect(onValid).not.toHaveBeenCalled()
    expect(focus).toHaveBeenCalled()
    expect(result.current.errors.name).toBe('الزامی است.')
  })

  it('ارسال معتبر: onValid با مقدارها صدا زده می‌شود و داده‌ها حفظ می‌شوند', () => {
    const { result } = setup()
    const onValid = vi.fn()
    act(() => result.current.handleChange(field('الف')))
    act(() => {
      result.current.submit(onValid)({ preventDefault: vi.fn(), currentTarget: { elements: {} } })
    })
    expect(onValid).toHaveBeenCalledWith({ name: 'الف' })
    expect(result.current.values.name).toBe('الف')
  })
})

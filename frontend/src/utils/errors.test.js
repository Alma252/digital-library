import { describe, expect, it } from 'vitest'
import { formMessage, parseApiError } from './errors.js'

const apiError = (status, data) => ({ response: { status, data } })

describe('parseApiError', () => {
  it('خطای بدون پاسخ را قطع ارتباط می‌داند', () => {
    const error = parseApiError(new Error('Network Error'))
    expect(error).toMatchObject({ status: 0, code: 'network_error', fieldErrors: {}, formErrors: [] })
    expect(error.message).toContain('ارتباط')
  })

  it('خطای هر فیلد را جدا و فقط پیام اول را برمی‌دارد', () => {
    const error = parseApiError(
      apiError(400, {
        code: 'validation_error',
        message: 'ورودی نامعتبر است.',
        errors: { username: ['اول', 'دوم'], email: ['ایمیل نامعتبر است.'] },
      }),
    )
    expect(error.status).toBe(400)
    expect(error.code).toBe('validation_error')
    expect(error.fieldErrors).toEqual({ username: 'اول', email: 'ایمیل نامعتبر است.' })
    expect(error.formErrors).toEqual([])
  })

  it('non_field_errors را به formErrors می‌برد، نه به فیلدها', () => {
    const error = parseApiError(
      apiError(400, {
        code: 'validation_error',
        message: 'ورود ناموفق بود.',
        errors: { non_field_errors: ['نام کاربری یا رمز عبور اشتباه است.'] },
      }),
    )
    expect(error.fieldErrors).toEqual({})
    expect(error.formErrors).toEqual(['نام کاربری یا رمز عبور اشتباه است.'])
  })

  it('retry_after را در 429 برمی‌گرداند', () => {
    const error = parseApiError(apiError(429, { code: 'throttled', message: 'زیاد', retry_after: 30 }))
    expect(error.code).toBe('throttled')
    expect(error.retryAfter).toBe(30)
  })

  it('پاسخ غیر JSON (مثلاً صفحه HTML خطای 500) را درست می‌خواند', () => {
    const error = parseApiError(apiError(500, '<html>Server Error</html>'))
    expect(error.code).toBe('server_error')
    expect(error.message).toContain('سرور')
    expect(error.fieldErrors).toEqual({})
  })

  it('اگر سرور پیام نداد، پیام پیش‌فرض فارسی می‌دهد', () => {
    expect(parseApiError(apiError(403, {})).message).toContain('اجازه')
    expect(parseApiError(apiError(404, {})).message).toContain('پیدا نشد')
  })

  it('کل بدنه را برای فیلدهای ویژه (مثل existing_resource_id) نگه می‌دارد', () => {
    const error = parseApiError(apiError(409, { code: 'duplicate_file', message: 'تکراری', existing_resource_id: 'abc' }))
    expect(error.data.existing_resource_id).toBe('abc')
  })
})

describe('formMessage', () => {
  it('خطاهای فرم را به هم می‌چسباند', () => {
    expect(formMessage({ formErrors: ['الف', 'ب'], fieldErrors: {}, code: 'x' })).toBe('الف ب')
  })

  it('پیام 429 ثانیه را با ارقام فارسی نشان می‌دهد', () => {
    const message = formMessage({ formErrors: [], fieldErrors: {}, code: 'throttled', retryAfter: 30 })
    expect(message).toContain('۳۰ ثانیه')
  })

  it('اگر خطای فیلد هست، پیام بالای فرم خالی است (خطا کنار فیلد نمایش داده می‌شود)', () => {
    expect(formMessage({ formErrors: [], fieldErrors: { username: 'x' }, code: 'validation_error', message: 'm' })).toBe('')
  })

  it('در بقیه موارد پیام خود خطا را برمی‌گرداند', () => {
    expect(formMessage({ formErrors: [], fieldErrors: {}, code: 'server_error', message: 'مشکل سرور' })).toBe('مشکل سرور')
  })
})

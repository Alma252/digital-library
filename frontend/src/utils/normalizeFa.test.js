import { describe, expect, it } from 'vitest'
import { normalizeFa } from './normalizeFa.js'

describe('normalizeFa (SRCH-10)', () => {
  it('«ي» و «ك» عربی را فارسی می‌کند', () => {
    expect(normalizeFa('كتاب تاريخ')).toBe('کتاب تاریخ')
  })

  it('ارقام فارسی و عربی را لاتین می‌کند', () => {
    expect(normalizeFa('۱۳۹۵')).toBe('1395')
    expect(normalizeFa('٢٠٢٠')).toBe('2020')
  })

  it('نیم‌فاصله را فاصله می‌کند', () => {
    expect(normalizeFa('کتاب‌ها')).toBe('کتاب ها')
  })

  it('اعراب و کشیده را حذف می‌کند', () => {
    expect(normalizeFa('كِتَابٌ')).toBe('کتاب')
    expect(normalizeFa('کـتـاب')).toBe('کتاب')
  })

  it('حروف لاتین را کوچک و فاصله‌های اضافی را یکی می‌کند', () => {
    expect(normalizeFa('  Learning   REACT ')).toBe('learning react')
  })

  it('مقدار خالی یا undefined رشته خالی می‌دهد', () => {
    expect(normalizeFa()).toBe('')
    expect(normalizeFa('')).toBe('')
  })
})

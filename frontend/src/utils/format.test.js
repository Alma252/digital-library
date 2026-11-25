import { describe, expect, it } from 'vitest'
import { formatDate, formatFileSize } from './format.js'

describe('formatFileSize', () => {
  it('بایت، کیلوبایت، مگابایت', () => {
    expect(formatFileSize(500)).toBe('۵۰۰ بایت')
    expect(formatFileSize(2048)).toBe('۲ کیلوبایت')
    expect(formatFileSize(2 * 1024 * 1024)).toBe('۲ مگابایت')
  })
  it('حداکثر یک رقم اعشار', () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toMatch(/^۱[٫.]۵ مگابایت$/)
  })
})

describe('formatDate', () => {
  it('تاریخ شمسی به وقت تهران', () => {
    expect(formatDate('2026-11-20T10:30:00Z')).toBe('۲۹ آبان ۱۴۰۵')
  })
})

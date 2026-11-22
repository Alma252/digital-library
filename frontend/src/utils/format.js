// نمایش عدد با ارقام فارسی
export const faNumber = (value, { grouping = false } = {}) =>
  Number(value).toLocaleString('fa-IR', { useGrouping: grouping })

const SIZE_UNITS = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت']

// ۱۰۴۸۵۷۶ ← «۱ مگابایت»
export function formatFileSize(bytes) {
  let value = Number(bytes)
  let unit = 0
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toLocaleString('fa-IR', { maximumFractionDigits: 1 })} ${SIZE_UNITS[unit]}`
}

// تاریخ ISO ← «۲۹ آبان ۱۴۰۵» (تقویم شمسی، به وقت تهران). تاریخ مطلق، نه «۳۴۰ روز پیش».
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fa-IR', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

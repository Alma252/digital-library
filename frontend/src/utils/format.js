// نمایش عدد با ارقام فارسی
export const faNumber = (value, { grouping = false } = {}) =>
  Number(value).toLocaleString('fa-IR', { useGrouping: grouping })

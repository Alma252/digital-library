// یکسان‌سازی متن فارسی برای جست‌وجو: ی/ي، ک/ك، ارقام فارسی و عربی، اعراب، نیم‌فاصله.
export function normalizeFa(text = '') {
  return String(text)
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/‌/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

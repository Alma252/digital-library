// برچسب‌های فارسی مقادیر قرارداد API. اگر مقدار ناشناخته بیاید، خود مقدار نمایش داده می‌شود.

export const LANGUAGE_LABELS = { fa: 'فارسی', en: 'انگلیسی' }
export const FILE_TYPE_LABELS = { pdf: 'PDF', epub: 'EPUB' }
export const CALENDAR_LABELS = { shamsi: 'شمسی', gregorian: 'میلادی' }
export const ACCESS_LABELS = { full: 'دسترسی کامل', partial: 'دسترسی محدود', none: 'بدون دسترسی' }
export const STATUS_LABELS = { draft: 'پیش‌نویس', published: 'منتشرشده', archived: 'بایگانی‌شده' }

export const label = (map, key) => map[key] ?? key

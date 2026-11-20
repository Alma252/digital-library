// تنظیمات API. تنها جایی که متغیرهای محیطی خوانده می‌شوند.
export const API_URL = import.meta.env.VITE_API_URL || '/api'

// true یعنی به‌جای بک‌اند، داده ساختگی (src/api/mock) استفاده شود.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

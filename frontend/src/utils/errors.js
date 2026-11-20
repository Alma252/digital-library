const DEFAULT_MESSAGES = {
  0: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.',
  401: 'برای ادامه باید وارد شوید.',
  403: 'شما اجازه دسترسی به این بخش را ندارید.',
  404: 'مورد درخواستی پیدا نشد.',
  429: 'تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.',
  500: 'خطایی در سرور رخ داد. کمی بعد دوباره تلاش کنید.',
}

function defaultMessage(status) {
  if (status >= 500) return DEFAULT_MESSAGES[500]
  return DEFAULT_MESSAGES[status] || 'خطای ناشناخته رخ داد.'
}

/**
 * هر خطای axios (یا خطای mock) را به یک شکل ثابت تبدیل می‌کند:
 * {
 *   status,        // 0 = ارتباط قطع بود
 *   code,          // validation_error، forbidden، ... یا network_error / server_error
 *   message,       // پیام فارسی برای نمایش
 *   fieldErrors,   // { username: 'پیام' }  (اولین پیام هر فیلد)
 *   formErrors,    // پیام‌های غیرمرتبط با یک فیلد (non_field_errors)
 *   retryAfter,    // ثانیه، فقط در 429
 *   data,          // کل بدنه پاسخ (مثلاً existing_resource_id)
 * }
 */
export function parseApiError(error) {
  const response = error?.response

  if (!response) {
    return {
      status: 0,
      code: 'network_error',
      message: DEFAULT_MESSAGES[0],
      fieldErrors: {},
      formErrors: [],
      retryAfter: null,
      data: null,
    }
  }

  const status = response.status
  const data = response.data && typeof response.data === 'object' ? response.data : {}
  const { non_field_errors: formErrors = [], ...rawFields } = data.errors || {}

  const fieldErrors = {}
  for (const [field, messages] of Object.entries(rawFields)) {
    fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
  }

  return {
    status,
    code: data.code || (status >= 500 ? 'server_error' : 'unknown'),
    message: data.message || defaultMessage(status),
    fieldErrors,
    formErrors,
    retryAfter: data.retry_after ?? null,
    data,
  }
}

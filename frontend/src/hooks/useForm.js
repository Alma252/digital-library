import { useState } from 'react'

/**
 * مدیریت فرم با اعتبارسنجی «اول blur»:
 * - خطا بعد از خروج از فیلد (blur) نشان داده می‌شود، نه موقع تایپ.
 * - به‌محض اینکه مقدار فیلدِ دارای خطا درست شد، خطا فوراً پاک می‌شود.
 * - موقع خطا هیچ مقداری پاک نمی‌شود (UX-04).
 *
 * rules: { نام‌فیلد: (مقدار) => 'پیام خطا' یا '' }
 */
export default function useForm(initialValues, rules) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const check = (name, value) => (rules[name] ? rules[name](value) : '')

  function handleChange(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    // فقط فیلدی که خطا دارد دوباره بررسی می‌شود (پیام جدید یا پاک‌شدن)
    setErrors((previous) => (previous[name] ? { ...previous, [name]: check(name, value) } : previous))
  }

  function handleBlur(event) {
    const { name, value } = event.target
    const message = check(name, value)
    // اگر مقدار درست است، خطای موجود (مثلاً خطای سرور) را فقط با تغییر مقدار پاک می‌کنیم
    if (message) setErrors((previous) => ({ ...previous, [name]: message }))
  }

  function setFieldErrors(fieldErrors) {
    setErrors((previous) => ({ ...previous, ...fieldErrors }))
  }

  // submit(onValid) یک handler برای onSubmit برمی‌گرداند
  const submit = (onValid) => (event) => {
    event.preventDefault()
    const form = event.currentTarget

    const found = {}
    for (const name of Object.keys(rules)) {
      const message = check(name, values[name])
      if (message) found[name] = message
    }

    if (Object.keys(found).length > 0) {
      setErrors(found)
      form.elements[Object.keys(found)[0]]?.focus()
      return undefined
    }
    return onValid(values)
  }

  return { values, errors, handleChange, handleBlur, setFieldErrors, submit }
}

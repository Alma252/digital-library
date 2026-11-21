import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/useAuth.js'
import useForm from '../hooks/useForm.js'
import { formMessage, parseApiError } from '../utils/errors.js'

const rules = {
  username: (value) => (value.trim() ? '' : 'نام کاربری را وارد کنید.'),
  password: (value) => (value ? '' : 'رمز عبور را وارد کنید.'),
}

export default function Login() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const { values, errors, handleChange, handleBlur, setFieldErrors, submit } = useForm(
    { username: location.state?.username || '', password: '' },
    rules,
  )

  // بعد از ورود موفق، user پر می‌شود و کاربر به صفحه‌ای که می‌خواست برمی‌گردد.
  if (user) {
    const from = location.state?.from
    return <Navigate to={from ? from.pathname + from.search : '/'} replace />
  }

  async function onValid({ username, password }) {
    setSubmitting(true)
    setFormError('')
    try {
      await login({ username: username.trim(), password })
    } catch (error) {
      const parsed = parseApiError(error)
      setFieldErrors(parsed.fieldErrors)
      setFormError(formMessage(parsed))
      setSubmitting(false)
    }
  }

  return (
    <section className="auth">
      <h1>ورود به حساب</h1>
      <p className="auth__note">فیلدهای دارای * الزامی‌اند.</p>

      {location.state?.registered && (
        <p className="form-alert form-alert--success" role="status">
          حساب شما ساخته شد. برای ادامه وارد شوید.
        </p>
      )}
      {formError && (
        <p className="form-alert" role="alert">
          {formError}
        </p>
      )}

      <form onSubmit={submit(onValid)} noValidate>
        <FormField
          label="نام کاربری"
          name="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.username}
          autoComplete="username"
          required
          ltr
        />
        <FormField
          label="رمز عبور"
          type="password"
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          autoComplete="current-password"
          required
          ltr
        />
        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? 'در حال ورود…' : 'وارد شوید'}
        </button>
      </form>

      <p className="auth__alt">
        حساب ندارید؟ <Link to="/register">ثبت‌نام کنید</Link>
      </p>
    </section>
  )
}

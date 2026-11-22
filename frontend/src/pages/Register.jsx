import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { register } from '../api/auth.js'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/useAuth.js'
import useForm from '../hooks/useForm.js'
import { formMessage, parseApiError } from '../utils/errors.js'

const rules = {
  username: (value) => {
    if (!value.trim()) return 'نام کاربری را وارد کنید.'
    if (value.trim().length < 3) return 'نام کاربری باید حداقل ۳ نویسه باشد.'
    return ''
  },
  email: (value) => {
    if (!value.trim()) return 'ایمیل را وارد کنید.'
    if (!/^\S+@\S+\.\S+$/.test(value.trim())) return 'ایمیل معتبر وارد کنید. مثال: name@example.com'
    return ''
  },
  password: (value) => {
    if (!value) return 'رمز عبور را وارد کنید.'
    if (value.length < 8) return 'رمز عبور باید حداقل ۸ نویسه باشد.'
    return ''
  },
}

export default function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const { values, errors, handleChange, handleBlur, setFieldErrors, submit } = useForm(
    { username: '', email: '', password: '' },
    rules,
  )

  if (user) return <Navigate to="/" replace />

  async function onValid({ username, email, password }) {
    setSubmitting(true)
    setFormError('')
    try {
      await register({ username: username.trim(), email: email.trim(), password })
      navigate('/login', { replace: true, state: { registered: true, username: username.trim() } })
    } catch (error) {
      const parsed = parseApiError(error)
      setFieldErrors(parsed.fieldErrors)
      setFormError(formMessage(parsed))
      setSubmitting(false)
    }
  }

  return (
    <section className="auth">
      <h1>ایجاد حساب</h1>
      <p className="auth__note">فیلدهای دارای * الزامی‌اند.</p>

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
          label="ایمیل"
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          autoComplete="email"
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
          hint="حداقل ۸ نویسه"
          autoComplete="new-password"
          required
          ltr
        />
        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? 'در حال ایجاد حساب…' : 'ایجاد حساب'}
        </button>
      </form>

      <p className="auth__alt">
        قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login">وارد شوید</Link>
      </p>
    </section>
  )
}

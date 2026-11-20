import { useId, useState } from 'react'
import './forms.css'

/**
 * یک فیلد فرم با برچسب همیشه‌نمایان، خطای کنار فیلد و (برای رمز) دکمه نمایش/پنهان.
 * بقیه propها (name, value, onChange, onBlur, autoComplete, ...) مستقیم به input می‌روند.
 */
export default function FormField({ label, error, hint, required = false, type = 'text', ltr = false, ...inputProps }) {
  const id = useId()
  const messageId = `${id}-message`
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const hasMessage = Boolean(error || hint)

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      <div className="field__control">
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          dir={ltr ? 'ltr' : undefined}
          className="field__input"
          aria-required={required || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? 'پنهان' : 'نمایش'}
          </button>
        )}
      </div>

      {error && (
        <p id={messageId} className="field__error" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={messageId} className="field__hint">
          {hint}
        </p>
      )}
    </div>
  )
}

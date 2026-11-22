import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom این متد را پیاده‌سازی نکرده
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

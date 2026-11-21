import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// تنظیمات تست جدا از vite.config.js است تا اجرای dev و build را تغییر ندهد.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
    // تست‌ها همیشه با داده ساختگی اجرا می‌شوند، مستقل از فایل .env
    env: { VITE_USE_MOCK: 'true', VITE_API_URL: '/api' },
  },
})

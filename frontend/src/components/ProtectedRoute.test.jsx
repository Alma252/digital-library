import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../context/auth-context.js'
import ProtectedRoute from './ProtectedRoute.jsx'

function renderAt(path, auth, roles) {
  return render(
    <AuthContext.Provider value={{ user: null, initializing: false, ...auth }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>صفحه ورود</p>} />
          <Route element={<ProtectedRoute roles={roles} />}>
            <Route path="/secret" element={<p>محتوای محافظت‌شده</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute (RBAC-11)', () => {
  it('کاربر ناشناس به صفحه ورود می‌رود', () => {
    renderAt('/secret', { user: null })
    expect(screen.getByText('صفحه ورود')).toBeInTheDocument()
    expect(screen.queryByText('محتوای محافظت‌شده')).not.toBeInTheDocument()
  })

  it('تا بازیابی نشست تمام نشود، به ورود نمی‌رود و پیام «در حال بررسی» می‌دهد', () => {
    renderAt('/secret', { user: null, initializing: true })
    expect(screen.getByRole('status')).toHaveTextContent('در حال بررسی ورود')
    expect(screen.queryByText('صفحه ورود')).not.toBeInTheDocument()
  })

  it('کاربر واردشده محتوا را می‌بیند', () => {
    renderAt('/secret', { user: { username: 'user', role: 'user' } })
    expect(screen.getByText('محتوای محافظت‌شده')).toBeInTheDocument()
  })

  it('نقش نامناسب: صفحه «دسترسی ندارید»، نه ورود', () => {
    renderAt('/secret', { user: { username: 'user', role: 'user' } }, ['librarian', 'admin'])
    expect(screen.getByRole('heading', { name: 'دسترسی ندارید' })).toBeInTheDocument()
    expect(screen.queryByText('محتوای محافظت‌شده')).not.toBeInTheDocument()
  })

  it('نقش مجاز محتوا را می‌بیند', () => {
    renderAt('/secret', { user: { username: 'lib', role: 'librarian' } }, ['librarian', 'admin'])
    expect(screen.getByText('محتوای محافظت‌شده')).toBeInTheDocument()
  })
})

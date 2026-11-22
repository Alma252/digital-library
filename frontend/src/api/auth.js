import client from './client.js'
import { USE_MOCK } from './config.js'
import * as mock from './mock/handlers.js'
import { getRefreshToken } from './tokens.js'

// همه توابع «داده» را برمی‌گردانند (نه پاسخ کامل axios)، چه mock باشد چه واقعی.
const data = (request) => request.then((response) => response.data)

export const login = (body) => (USE_MOCK ? mock.login(body) : data(client.post('/auth/login/', body)))

export const register = (body) => (USE_MOCK ? mock.register(body) : data(client.post('/auth/register/', body)))

export const me = () => (USE_MOCK ? mock.me() : data(client.get('/auth/me/')))

export const logout = () => {
  const body = { refresh: getRefreshToken() }
  return USE_MOCK ? mock.logout(body) : client.post('/auth/logout/', body).then(() => undefined)
}

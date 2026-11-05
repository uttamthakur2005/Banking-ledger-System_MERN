// All backend calls live here. The JWT is kept in memory only (never in
// localStorage), the server's cookie keeps the session across page reloads.
let token = null
let onUnauthorized = () => {}

export const setToken = (t) => {
  token = t
}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function request(path, { method = 'GET', body, guard = true, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError(
      'Cannot reach the server. Check your connection and make sure the backend is running on port 8000.',
      0
    )
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON error page (Express 5 default 500) */
  }

  if (!res.ok) {
    if (res.status === 401 && guard) onUnauthorized()
    const fallback =
      res.status >= 500
        ? 'The server could not process this request. Check the details and try again.'
        : `Request failed (${res.status})`
    throw new ApiError(data?.message || fallback, res.status, data)
  }
  return data
}

export const api = {
  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: { name, email, password }, guard: false }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, guard: false }),
  logout: () => request('/auth/logout', { method: 'POST', guard: false }),

  accounts: () => request('/accounts'),
  createAccount: () => request('/accounts', { method: 'POST' }),
  balance: (id) => request(`/accounts/balance/${encodeURIComponent(id)}`),

  transfer: (payload) => request('/transaction', { method: 'POST', body: payload }),
  fund: (payload) => request('/transaction/system/initial-funds', { method: 'POST', body: payload }),
}

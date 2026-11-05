import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, setToken, setUnauthorizedHandler } from './api'
import { navigate } from './router'
import { store } from './utils'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const USER_KEY = 'ledger.user'
const readUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}
const writeUser = (u) => {
  try {
    if (u) sessionStorage.setItem(USER_KEY, JSON.stringify(u))
    else sessionStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

// Preferences (per browser): hide balances by default, idle timeout in minutes.
export function usePrefs() {
  const { prefs, setPrefs } = useAuth()
  return [prefs, setPrefs]
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | anon | authed
  const [notice, setNotice] = useState('')
  const [prefs, setPrefsState] = useState(() => store.get('ledger.prefs', { hideBalances: false, idleMinutes: 5 }))
  const statusRef = useRef(status)
  statusRef.current = status

  const setPrefs = useCallback((patch) => {
    setPrefsState((p) => {
      const next = { ...p, ...patch }
      store.set('ledger.prefs', next)
      return next
    })
  }, [])

  const clearSession = useCallback((message = '') => {
    setToken(null)
    writeUser(null)
    setUser(null)
    setStatus('anon')
    setNotice(message)
  }, [])

  const signOut = useCallback(
    async (message = '') => {
      try {
        await api.logout() // blacklists the token server-side
      } catch {
        /* still clear locally */
      }
      clearSession(message)
      navigate('/login')
    },
    [clearSession]
  )

  // Any 401 from a protected call ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (statusRef.current !== 'authed') return
      clearSession('Your session expired. Sign in again to continue.')
      navigate('/login')
    })
  }, [clearSession])

  // Restore session after reload: the cookie is still valid if this call succeeds.
  useEffect(() => {
    const saved = readUser()
    if (!saved) {
      setStatus('anon')
      return
    }
    api
      .accounts()
      .then(() => {
        setUser(saved)
        setStatus('authed')
      })
      .catch(() => clearSession())
  }, [clearSession])

  const start = (res) => {
    setToken(res.token)
    writeUser(res.user)
    setUser(res.user)
    setNotice('')
    setStatus('authed')
  }

  const value = useMemo(
    () => ({
      user,
      status,
      notice,
      prefs,
      setPrefs,
      clearNotice: () => setNotice(''),
      login: async (email, password) => start(await api.login(email, password)),
      register: async (name, email, password) => start(await api.register(name, email, password)),
      signOut,
    }),
    [user, status, notice, prefs, setPrefs, signOut]
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

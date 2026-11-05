import { useEffect } from 'react'
import { matchRoute, navigate, usePath } from './router'
import { AuthProvider, useAuth } from './auth'
import { DataProvider } from './data'
import { ToastProvider } from './components/ui'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import AccountDetail from './pages/AccountDetail'
import Transfer from './pages/Transfer'
import Activity from './pages/Activity'
import Security from './pages/Security'

function Private({ path }) {
  let params
  let page
  if (path === '/app') page = <Dashboard />
  else if (path === '/app/transfer') page = <Transfer mode="transfer" />
  else if (path === '/app/fund') page = <Transfer mode="fund" />
  else if (path === '/app/activity') page = <Activity />
  else if (path === '/app/security') page = <Security />
  else if ((params = matchRoute('/app/accounts/:id', path))) page = <AccountDetail id={params.id} />
  else page = <Dashboard />
  return (
    <DataProvider>
      <Shell>
        <div key={path} className="page">
          {page}
        </div>
      </Shell>
    </DataProvider>
  )
}

function Router() {
  const path = usePath()
  const { status } = useAuth()
  const isPrivate = path.startsWith('/app')
  const isAuthPage = path === '/login' || path === '/register'

  useEffect(() => {
    if (status === 'loading') return
    if (isPrivate && status !== 'authed') navigate('/login')
    if (isAuthPage && status === 'authed') navigate('/app')
  }, [status, isPrivate, isAuthPage])

  if (status === 'loading')
    return (
      <div className="splash" role="status" aria-label="Loading">
        <span />
        <span />
        <span />
      </div>
    )
  if (isPrivate) return status === 'authed' ? <Private path={path} /> : null
  if (path === '/login') return <Login />
  if (path === '/register') return <Register />
  return <Landing />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </AuthProvider>
  )
}

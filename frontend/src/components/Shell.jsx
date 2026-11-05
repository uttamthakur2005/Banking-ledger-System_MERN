import { useEffect, useRef, useState } from 'react'
import { Link, usePath } from '../router'
import { useAuth } from '../auth'
import { Icon, Logo, Modal } from './ui'

const NAV = [
  { to: '/app', icon: 'home', label: 'Overview', exact: true },
  { to: '/app/transfer', icon: 'send', label: 'Transfer' },
  { to: '/app/activity', icon: 'list', label: 'Activity' },
  { to: '/app/fund', icon: 'wallet', label: 'Fund' },
  { to: '/app/security', icon: 'shield', label: 'Security' },
]

/* Signs the user out after inactivity; warns for the final 60 seconds. */
function IdleGuard() {
  const { prefs, signOut } = useAuth()
  const last = useRef(Date.now())
  const [left, setLeft] = useState(null)
  const limit = prefs.idleMinutes * 60

  useEffect(() => {
    let lastMark = 0
    const mark = () => {
      const now = Date.now()
      if (now - lastMark < 1000) return
      lastMark = now
      if (document.querySelector('[data-idle-warning]')) return // must answer the dialog
      last.current = now
    }
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    const timer = setInterval(() => {
      const idle = (Date.now() - last.current) / 1000
      if (idle >= limit) {
        signOut('You were signed out after a period of inactivity.')
      } else if (idle >= limit - 60) setLeft(Math.ceil(limit - idle))
      else setLeft(null)
    }, 1000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, mark))
      clearInterval(timer)
    }
  }, [limit, signOut])

  if (left === null) return null
  return (
    <Modal title="Still there?" dismissible={false}>
      <div data-idle-warning>
        <p>
          For your security you will be signed out in <strong className="num">{left}s</strong>.
        </p>
        <div className="row-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              last.current = Date.now()
              setLeft(null)
            }}
          >
            Stay signed in
          </button>
          <button className="btn btn-ghost" onClick={() => signOut()}>
            Sign out now
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Shell({ children }) {
  const path = usePath()
  const { user, signOut } = useAuth()
  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const active = (n) => (n.exact ? path === n.to : path.startsWith(n.to))

  return (
    <div className="shell">
      <aside className="side">
        <Link to="/app" className="side-logo" aria-label="Ledger System home">
          <Logo light />
        </Link>
        <nav aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={`nav-link ${active(n) ? 'active' : ''}`} aria-current={active(n) ? 'page' : undefined}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-user">
          <div className="avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="who">
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
          <button className="icon-btn on-dark" onClick={() => signOut()} aria-label="Sign out" title="Sign out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <main className="main" id="main">
        {children}
      </main>
      <IdleGuard />
    </div>
  )
}

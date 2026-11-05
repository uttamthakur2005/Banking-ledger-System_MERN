import { useEffect, useState } from 'react'
import { Link } from '../router'
import { Icon, Logo } from '../components/ui'
import { formatPlain } from '../utils'
import { useAuth } from '../auth'

const TXNS = [
  { memo: 'Initial funds', dr: ['Reserve', 50000], cr: ['Savings', 50000] },
  { memo: 'Rent, November', dr: ['Savings', 24000], cr: ['Landlord', 24000] },
  { memo: 'Salary advance', dr: ['Payroll', 8500], cr: ['Savings', 8500] },
]

/* The memorable moment: a ledger that writes itself and balances to zero. */
function LedgerDemo() {
  const rows = TXNS.flatMap((t) => [
    { memo: t.memo, acct: t.dr[0], dr: t.dr[1] },
    { memo: '', acct: t.cr[0], cr: t.cr[1] },
  ])
  const [n, setN] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return setN(rows.length + 1)
    const id = setInterval(() => setN((x) => (x > rows.length + 3 ? 0 : x + 1)), 900)
    return () => clearInterval(id)
  }, [rows.length])

  const shown = rows.slice(0, n)
  const dr = shown.reduce((s, r) => s + (r.dr || 0), 0)
  const cr = shown.reduce((s, r) => s + (r.cr || 0), 0)
  const balanced = n > rows.length

  return (
    <div className="demo" role="img" aria-label="A ledger where every debit is matched by an equal credit">
      <div className="demo-head">
        <span>Particulars</span>
        <span>Debit</span>
        <span>Credit</span>
      </div>
      <div className="demo-body">
        {rows.map((r, i) => (
          <div key={i} className={`demo-row ${i < n ? 'in' : ''} ${r.cr ? 'is-cr' : ''}`}>
            <span className="memo">
              {r.memo && <em>{r.memo}</em>}
              <span className={r.cr ? 'indent' : ''}>{r.cr ? `To ${r.acct}` : r.acct}</span>
            </span>
            <span className="num dr">{r.dr ? formatPlain(r.dr) : ''}</span>
            <span className="num cr">{r.cr ? formatPlain(r.cr) : ''}</span>
          </div>
        ))}
      </div>
      <div className="demo-foot">
        <span>Totals</span>
        <span className="num">{formatPlain(dr)}</span>
        <span className="num">{formatPlain(cr)}</span>
      </div>
      <div className={`demo-balance ${balanced ? 'ok' : ''}`}>
        <Icon name="check" size={16} />
        {balanced ? 'Book balanced. Difference ₹0.00' : 'Posting entries…'}
      </div>
    </div>
  )
}

const POINTS = [
  ['Entries can’t be edited', 'Ledger rows are immutable. A correction is a new entry, so your history always shows what really happened.'],
  ['Retries never double-charge', 'Every transfer carries a unique key. Tap twice or lose connection and the money still moves once.'],
  ['Your balance is the book', 'We don’t store a balance that can drift. It’s the sum of credits minus debits, recalculated every time.'],
]

export default function Landing() {
  const { status } = useAuth()
  return (
    <div className="landing">
      <header className="top">
        <Logo />
        <nav>
          {status === 'authed' ? (
            <Link to="/app" className="btn btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Open an account
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>Every rupee is written down twice.</h1>
          <p className="lede">
            Ledger System is built around a clear, reliable ledger. Each transfer posts a debit and a matching credit, so the books always balance and nothing disappears.
          </p>
          <div className="hero-cta">
            <Link to={status === 'authed' ? '/app' : '/register'} className="btn btn-primary btn-lg">
              {status === 'authed' ? 'Open dashboard' : 'Open an account'}
            </Link>
            {status !== 'authed' && (
              <Link to="/login" className="btn btn-ghost btn-lg">
                I already have one
              </Link>
            )}
          </div>
        </div>
        <LedgerDemo />
      </section>

      <section className="points">
        {POINTS.map(([t, d]) => (
          <div key={t} className="point">
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>

      <footer className="foot">
        <Logo />
        <p>Sessions end after inactivity, passwords are checked by bcrypt on the server, and signing out revokes your token.</p>
      </footer>
    </div>
  )
}

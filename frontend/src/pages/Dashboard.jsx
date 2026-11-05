import { useEffect, useState } from 'react'
import { navigate } from '../router'
import { useAuth } from '../auth'
import { useData } from '../data'
import { CopyButton, Empty, Icon, Money, Spinner, StatusChip, useToast } from '../components/ui'
import { formatDate, shortId } from '../utils'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  )
}

export default function Dashboard() {
  const { user, prefs, setPrefs } = useAuth()
  const { accounts, balances, total, error, refresh, refreshing, createAccount, history } = useData()
  const toast = useToast()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    refresh() // fresh balances whenever the overview opens
  }, [refresh])

  const create = async () => {
    setCreating(true)
    try {
      const acc = await createAccount()
      toast('Account opened')
      navigate(`/app/accounts/${acc._id}`)
    } catch (e) {
      toast(e.message, 'err')
    } finally {
      setCreating(false)
    }
  }

  const loading = accounts === null
  const recent = history.slice(0, 4)

  return (
    <>
      <PageHead title={`${greeting()}, ${user?.name?.split(' ')[0]}`} sub="Here is where your money stands right now.">
        <button className="btn btn-ghost" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Spinner size={16} /> : <Icon name="refresh" size={16} />} Refresh
        </button>
        <button className="btn btn-primary" onClick={create} disabled={creating}>
          {creating ? <Spinner size={16} /> : <Icon name="plus" size={16} />} Open account
        </button>
      </PageHead>

      <section className="total">
        <div>
          <span className="total-label">Total across {accounts?.length ?? 0} account{accounts?.length === 1 ? '' : 's'}</span>
          <div className="total-amount">{loading ? <span className="skeleton" style={{ width: 240, height: 48 }} /> : <Money value={total} count />}</div>
        </div>
        <button className="icon-btn on-dark" onClick={() => setPrefs({ hideBalances: !prefs.hideBalances })} aria-label={prefs.hideBalances ? 'Show balances' : 'Hide balances'} title={prefs.hideBalances ? 'Show balances' : 'Hide balances'}>
          <Icon name={prefs.hideBalances ? 'eye' : 'eyeOff'} size={20} />
        </button>
        <div className="total-rule" aria-hidden="true" />
      </section>

      {error && (
        <div className="banner banner-err" role="alert">
          {error}
        </div>
      )}

      <h2 className="section-title">Accounts</h2>
      {loading ? (
        <div className="folios">
          {[0, 1].map((i) => (
            <div key={i} className="folio skeleton" style={{ height: 150 }} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Empty title="No accounts yet">
          Open your first ledger account to receive and send money.
          <br />
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={create} disabled={creating}>
            Open account
          </button>
        </Empty>
      ) : (
        <div className="folios">
          {accounts.map((a, i) => (
            <article
              key={a._id}
              className="folio"
              style={{ '--i': i }}
              role="link"
              tabIndex={0}
              aria-label={`Open ${a.currency} account ${shortId(a._id)}`}
              onClick={() => navigate(`/app/accounts/${a._id}`)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/app/accounts/${a._id}`)
                }
              }}
            >
              <header>
                <span className="folio-id num">{shortId(a._id)}</span>
                <CopyButton text={a._id} />
                <StatusChip status={a.status} />
              </header>
              <div className="folio-bal">
                <Money value={balances[a._id]} count />
              </div>
              <footer>
                <span>{a.currency} account</span>
                <button className="link" style={{ background: 'none', border: 0, padding: 0 }} onClick={(e) => { e.stopPropagation(); navigate('/app/transfer') }}>
                  Send money <Icon name="arrow" size={14} />
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      <h2 className="section-title">Recent activity</h2>
      {recent.length === 0 ? (
        <p className="muted">Transfers you make on this device will appear here.</p>
      ) : (
        <ul className="recent">
          {recent.map((h) => (
            <li key={h.key}>
              <span className={`dot ${h.kind === 'funding' ? 'cr' : 'dr'}`} />
              <span className="grow">
                {h.kind === 'funding' ? 'Funded' : 'Sent to'} <span className="num">{shortId(h.to)}</span>
              </span>
              <span className="muted">{formatDate(h.at)}</span>
              <Money value={h.amount} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

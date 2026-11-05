import { useAuth } from '../auth'
import { Icon } from '../components/ui'
import { PageHead } from './Dashboard'

const PROTECTIONS = [
  ['Token stays in memory', 'Your session token is never written to browser storage, so injected scripts can’t read it from there.'],
  ['Revoked on sign-out', 'Signing out blacklists the token on the server. Copies of it stop working immediately.'],
  ['Idempotent transfers', 'Each transfer has a one-time key. Double clicks and retries can’t move money twice.'],
  ['Strict page policy', 'Production builds block inline scripts and any connection outside this site.'],
]

export default function Security() {
  const { user, prefs, setPrefs, signOut } = useAuth()
  return (
    <>
      <PageHead title="Security" sub="Control how Ledger System protects this session." />

      <section className="panel">
        <h2 className="panel-title">This session</h2>
        <dl className="review">
          <div>
            <dt>Signed in as</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>Session lifetime</dt>
            <dd>Up to 3 days, ends on sign-out</dd>
          </div>
        </dl>
        <div className="setting">
          <div>
            <strong>Sign out after inactivity</strong>
            <p className="muted">You get a 60 second warning first.</p>
          </div>
          <select aria-label="Inactivity timeout" value={prefs.idleMinutes} onChange={(e) => setPrefs({ idleMinutes: Number(e.target.value) })}>
            {[2, 5, 10, 15, 30].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </div>
        <div className="setting">
          <div>
            <strong>Hide balances by default</strong>
            <p className="muted">Useful in public places. Tap a hidden balance to reveal it.</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={prefs.hideBalances} onChange={(e) => setPrefs({ hideBalances: e.target.checked })} />
            <span aria-hidden="true" />
            <span className="sr">Hide balances by default</span>
          </label>
        </div>
        <button className="btn btn-ghost" onClick={() => signOut()}>
          <Icon name="logout" size={16} /> Sign out of this device
        </button>
      </section>

      <h2 className="section-title">What’s protecting you</h2>
      <ul className="protect">
        {PROTECTIONS.map(([t, d]) => (
          <li key={t}>
            <Icon name="shield" />
            <div>
              <strong>{t}</strong>
              <p className="muted">{d}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

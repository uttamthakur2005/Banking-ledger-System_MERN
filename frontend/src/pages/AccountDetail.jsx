import { useState } from 'react'
import { Link, navigate } from '../router'
import { useData } from '../data'
import { CopyButton, Empty, Icon, Money, Spinner, StatusChip } from '../components/ui'
import { formatDate, formatPlain } from '../utils'
import { PageHead } from './Dashboard'

export default function AccountDetail({ id }) {
  const { accounts, balances, refresh, refreshing, history } = useData()
  const [spin, setSpin] = useState(false)
  if (accounts === null) return <div className="skeleton" style={{ height: 220 }} />
  const acc = accounts.find((a) => a._id === id)
  if (!acc)
    return (
      <Empty icon="alert" title="Account not found">
        This account doesn’t exist or isn’t yours. <Link to="/app" className="link">Back to overview</Link>
      </Empty>
    )

  const rows = history
    .filter((h) => h.from === id || h.to === id)
    .map((h) => ({ ...h, side: h.to === id ? 'cr' : 'dr' }))

  return (
    <>
      <PageHead title="Ledger account" sub={`${acc.currency} · opened ${new Date(acc.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`}>
        <button
          className="btn btn-ghost"
          onClick={async () => {
            setSpin(true)
            await refresh()
            setSpin(false)
          }}
        >
          {spin || refreshing ? <Spinner size={16} /> : <Icon name="refresh" size={16} />} Refresh balance
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/app/transfer')} disabled={acc.status !== 'ACTIVE'}>
          <Icon name="send" size={16} /> Send money
        </button>
      </PageHead>

      <section className="total">
        <div>
          <span className="total-label">Available balance</span>
          <div className="total-amount">
            <Money value={balances[id]} count />
          </div>
        </div>
        <div className="total-meta">
          <StatusChip status={acc.status} />
        </div>
        <div className="total-rule" aria-hidden="true" />
      </section>

      <div className="idbox">
        <span className="muted">Account ID, share this to receive money</span>
        <code className="num">{acc._id}</code>
        <CopyButton text={acc._id} />
      </div>

      <h2 className="section-title">Entries on this device</h2>
      {rows.length === 0 ? (
        <p className="muted">No transfers from this browser touch this account yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Particulars</th>
                <th className="r">Debit</th>
                <th className="r">Credit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>{formatDate(r.at)}</td>
                  <td>{r.side === 'cr' ? `From ${r.from.slice(-6)}` : `To ${r.to.slice(-6)}`}</td>
                  <td className="r num dr">{r.side === 'dr' ? formatPlain(r.amount) : ''}</td>
                  <td className="r num cr">{r.side === 'cr' ? formatPlain(r.amount) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

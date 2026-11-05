import { useState } from 'react'
import { useData } from '../data'
import { Empty, Icon, useToast } from '../components/ui'
import { formatDate, formatPlain } from '../utils'
import { PageHead } from './Dashboard'

export default function Activity() {
  const { history, accounts } = useData()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const mine = new Set((accounts || []).map((a) => a._id))

  const rows = history
    .map((h) => ({ ...h, dir: h.kind === 'funding' || (mine.has(h.to) && !mine.has(h.from)) ? 'in' : mine.has(h.from) && mine.has(h.to) ? 'self' : 'out' }))
    .filter((h) => filter === 'all' || h.dir === filter)
    .filter((h) => {
      const term = query.trim().toLowerCase()
      return !term || [h.at, h.id, h.key, h.from, h.to, h.amount, h.status].some((value) => String(value || '').toLowerCase().includes(term))
    })

  const exportCsv = () => {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [['Date', 'Reference', 'From', 'To', 'Amount', 'Status'].join(',')].concat(
      rows.map((r) => [r.at, r.id || r.key, r.from, r.to, r.amount, r.status].map(esc).join(','))
    )
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'ledger-system-activity.csv' })
    a.click()
    URL.revokeObjectURL(url)
    toast('Activity exported')
  }

  return (
    <>
      <PageHead title="Activity" sub="Transfers made from this browser. Your balances are always read live from the ledger.">
        <button className="btn btn-ghost" onClick={exportCsv} disabled={rows.length === 0}>
          <Icon name="download" size={16} /> Export CSV
        </button>
      </PageHead>

      <div className="activity-controls">
        <div className="tabs" role="tablist" aria-label="Filter activity">
          {[['all', 'All'], ['out', 'Sent'], ['in', 'Received'], ['self', 'Between my accounts']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
              {l}
            </button>
          ))}
        </div>
        <label className="activity-search">
          <Icon name="search" size={17} />
          <span className="sr">Search activity</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search amount, account or date" />
        </label>
      </div>

      {rows.length === 0 ? (
        <Empty icon="list" title="Nothing here yet">
          {query ? 'No entries match your search. Try another amount, account or date.' : 'Completed transfers show up as ledger entries.'}
        </Empty>
      ) : (
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Particulars</th>
                <th>Status</th>
                <th className="r">Debit</th>
                <th className="r">Credit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>{formatDate(r.at)}</td>
                  <td>
                    {r.kind === 'funding' ? 'Funding to' : r.dir === 'in' ? 'From' : 'To'} <span className="num">…{(r.dir === 'in' && r.kind !== 'funding' ? r.from : r.to).slice(-8)}</span>
                  </td>
                  <td>
                    <span className="chip chip-active">{r.status}</span>
                  </td>
                  <td className="r num dr">{r.dir === 'out' || r.dir === 'self' ? formatPlain(r.amount) : ''}</td>
                  <td className="r num cr">{r.dir === 'in' || r.dir === 'self' ? formatPlain(r.amount) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

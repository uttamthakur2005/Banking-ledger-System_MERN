import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useData } from '../data'
import { Empty, Field, Icon, Money, Spinner, useToast } from '../components/ui'
import { formatINR, isObjectId, newKey, shortId } from '../utils'
import { navigate } from '../router'
import { PageHead } from './Dashboard'

const STEPS = ['Debiting your account', 'Crediting the recipient', 'Committing to the ledger']

/* Shared by Transfer and Fund. `mode` = 'transfer' | 'fund'. */
export default function Transfer({ mode = 'transfer' }) {
  const isFund = mode === 'fund'
  const { accounts, balances, refresh, addHistory, payees, addPayee, removePayee } = useData()
  const toast = useToast()

  const [phase, setPhase] = useState('form') // form | review | posting | done | failed
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [errors, setErrors] = useState({})
  const [key, setKey] = useState(newKey())
  const [result, setResult] = useState(null)
  const [failure, setFailure] = useState('')
  const [step, setStep] = useState(0)
  const [save, setSave] = useState(false)

  // Always start from the server's latest balances.
  useEffect(() => {
    refresh()
  }, [refresh])

  const active = useMemo(() => (accounts || []).filter((a) => a.status === 'ACTIVE'), [accounts])
  useEffect(() => {
    if (!isFund && !from && active.length) setFrom(active[0]._id)
  }, [active, from, isFund])

  // Backend holds the request ~15s while it posts; walk through the steps meanwhile.
  useEffect(() => {
    if (phase !== 'posting') return
    setStep(0)
    const a = setTimeout(() => setStep(1), 1800)
    const b = setTimeout(() => setStep(2), 9000)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'posting') return
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  const amt = Number(amount)
  const balance = balances[from]

  const validate = () => {
    const e = {}
    if (isFund) {
      if (!isObjectId(from)) e.from = 'Enter the 24-character system account ID'
    } else if (!from) e.from = 'Choose an account to pay from'
    if (!isObjectId(to)) e.to = 'Enter a valid 24-character account ID'
    else if (to.trim() === from) e.to = 'Choose a different account than the source'
    if (!amount || !(amt > 0)) e.amount = 'Enter an amount greater than zero'
    else if (!/^\d+(\.\d{1,2})?$/.test(amount)) e.amount = 'Use up to two decimal places'
    else if (amt > 10000000) e.amount = 'Maximum per transfer is ₹1,00,00,000'
    else if (!isFund && balance !== undefined && balance !== null && amt > balance) e.amount = `Insufficient balance. You have ${formatINR(balance)}`
    return e
  }

  const review = (ev) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length === 0) setPhase('review')
  }

  const post = async () => {
    setPhase('posting')
    setFailure('')
    const payload = { fromAccount: from.trim(), toAccount: to.trim(), amount: amt, idempotencyKey: key }
    try {
      const res = await (isFund ? api.fund(payload) : api.transfer(payload))
      const tx = res.transaction
      if (!tx) {
        // e.g. "still processing": outcome not final yet, keep the key and let the user check back
        setFailure(res.message || 'The transfer is still processing. Check your balance in a moment.')
        setPhase('failed')
        return
      }
      addHistory({ key: tx.idempotencyKey || key, id: tx._id, from: tx.fromAccount, to: tx.toAccount, amount: tx.amount, at: tx.createdAt || new Date().toISOString(), kind: isFund ? 'funding' : 'transfer', status: tx.status })
      if (save && !isFund) addPayee({ id: to.trim(), label: shortId(to.trim()) })
      setResult({ ...tx, message: res.message })
      setPhase('done')
      refresh()
    } catch (err) {
      setFailure(err.message)
      // Only reuse the key when the outcome is unknown (network drop); a rejected request gets a fresh key.
      if (err.status !== 0) setKey(newKey())
      setPhase('failed')
    }
  }

  const reset = () => {
    setPhase('form')
    setTo('')
    setAmount('')
    setErrors({})
    setResult(null)
    setKey(newKey())
    setSave(false)
  }

  if (accounts === null) return <div className="skeleton" style={{ height: 300 }} />
  if (!isFund && active.length === 0)
    return (
      <>
        <PageHead title="Transfer money" />
        <Empty icon="send" title="You need an active account first">
          Open an account from your overview, then come back to send money.
          <br />
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/app')}>
            Go to overview
          </button>
        </Empty>
      </>
    )

  return (
    <>
      <PageHead
        title={isFund ? 'Fund an account' : 'Transfer money'}
        sub={isFund ? 'For system users: moves money from the system account into any account. Other users will be refused.' : 'Money leaves your account and arrives in the recipient’s as one atomic ledger posting.'}
      />

      {phase === 'form' && (
        <form className="panel form-narrow rise" onSubmit={review} noValidate>
          <Field label={isFund ? 'System account ID' : 'Pay from'} error={errors.from}>
            {(id, err) =>
              isFund ? (
                <input id={id} className="num" value={from} onChange={(e) => setFrom(e.target.value.trim())} placeholder="24-character ID" aria-describedby={err} aria-invalid={!!errors.from || undefined} autoComplete="off" />
              ) : (
                <select id={id} value={from} onChange={(e) => setFrom(e.target.value)} aria-describedby={err}>
                  {active.map((a) => (
                    <option key={a._id} value={a._id}>
                      {shortId(a._id)} · {balances[a._id] == null ? '—' : formatINR(balances[a._id])}
                    </option>
                  ))}
                </select>
              )
            }
          </Field>

          <Field label={isFund ? 'Account to fund' : 'Recipient account ID'} error={errors.to}>
            {(id, err) => (
              <>
                <input id={id} className="num" value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="Paste the 24-character account ID" aria-describedby={err} aria-invalid={!!errors.to || undefined} autoComplete="off" spellCheck="false" />
                <div className="chips">
                  {(accounts || [])
                    .filter((a) => a._id !== from && a.status === 'ACTIVE')
                    .map((a) => (
                      <button type="button" key={a._id} className={`chip-btn ${to === a._id ? 'on' : ''}`} onClick={() => setTo(a._id)}>
                        My account {shortId(a._id)}
                      </button>
                    ))}
                  {!isFund &&
                    payees.map((p) => (
                      <span key={p.id} className="chip-btn payee">
                        <button type="button" className={to === p.id ? 'on' : ''} onClick={() => setTo(p.id)}>
                          Saved {p.label}
                        </button>
                        <button type="button" aria-label={`Remove saved recipient ${p.label}`} onClick={() => removePayee(p.id)}>
                          <Icon name="x" size={12} />
                        </button>
                      </span>
                    ))}
                </div>
              </>
            )}
          </Field>

          <Field label="Amount (INR)" error={errors.amount} hint={!isFund && balance != null ? `Available ${formatINR(balance)}` : undefined}>
            {(id, err) => (
              <>
                <div className="amount-input">
                  <span>₹</span>
                  <input id={id} inputMode="decimal" className="num" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" aria-describedby={err} aria-invalid={!!errors.amount || undefined} autoComplete="off" />
                </div>
                <div className="chips">
                  {[500, 1000, 5000, 10000].map((v) => (
                    <button type="button" key={v} className="chip-btn" onClick={() => setAmount(String(v))}>
                      {formatINR(v).replace('.00', '')}
                    </button>
                  ))}
                </div>
              </>
            )}
          </Field>

          {!isFund && (
            <label className="check">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Save this recipient on this device
            </label>
          )}
          <button className="btn btn-primary btn-block">Review {isFund ? 'funding' : 'transfer'}</button>
        </form>
      )}

      {phase === 'review' && (
        <div className="panel form-narrow rise">
          <h2 className="panel-title">Check before you post</h2>
          <p className="muted">Ledger entries can’t be edited once posted.</p>
          <dl className="review">
            <div>
              <dt>From</dt>
              <dd className="num">{shortId(from)}</dd>
            </div>
            <div>
              <dt>To</dt>
              <dd className="num">{shortId(to)}</dd>
            </div>
            <div className="big">
              <dt>Amount</dt>
              <dd className="num">{formatINR(amt)}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd className="num">{key.slice(0, 8)}</dd>
            </div>
          </dl>
          <div className="row-actions">
            <button className="btn btn-primary" onClick={post}>
              <Icon name="lock" size={16} /> Confirm and post
            </button>
            <button className="btn btn-ghost" onClick={() => setPhase('form')}>
              Edit details
            </button>
          </div>
        </div>
      )}

      {phase === 'posting' && (
        <div className="panel form-narrow rise" aria-live="polite">
          <h2 className="panel-title">Posting to the ledger</h2>
          <p className="muted">This can take up to 20 seconds. Keep this tab open. It’s safe: the transfer can only happen once.</p>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>
                <span className="step-mark">{i < step ? <Icon name="check" size={14} /> : i === step ? <Spinner size={14} /> : null}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="progress">
            <span />
          </div>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="panel form-narrow success rise">
          <svg className="tick" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="M15 27l8 8 14-16" />
          </svg>
          <h2 className="panel-title">{formatINR(result.amount)} posted</h2>
          <p className="muted">
            {result.message} · status {result.status}
          </p>
          <dl className="review">
            <div>
              <dt>To</dt>
              <dd className="num">{shortId(result.toAccount)}</dd>
            </div>
            <div>
              <dt>Transaction</dt>
              <dd className="num">{shortId(result._id)}</dd>
            </div>
          </dl>
          <div className="row-actions">
            <button className="btn btn-primary" onClick={() => navigate('/app')}>
              Back to overview
            </button>
            <button className="btn btn-ghost" onClick={reset}>
              Make another
            </button>
          </div>
        </div>
      )}

      {phase === 'failed' && (
        <div className="panel form-narrow rise">
          <div className="banner banner-err" role="alert">
            <strong>Not posted.</strong> {failure}
          </div>
          <p className="muted">Your balance was not charged unless the message above says the transfer already went through.</p>
          <div className="row-actions">
            <button className="btn btn-primary" onClick={() => setPhase('form')}>
              Back to details
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/app')}>
              Check balances
            </button>
          </div>
        </div>
      )}
    </>
  )
}

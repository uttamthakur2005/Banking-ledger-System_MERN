import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { copyText, formatINR, passwordScore, useCountUp } from '../utils'
import { usePrefs } from '../auth'

/* ---------- Icons ---------- */
const P = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  send: 'M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
  plus: 'M12 5v14M5 12h14',
  copy: 'M9 9h11v11H9zM5 15V5h10',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff: 'M3 3l18 18M10.6 6.1A9.8 9.8 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.7C3.7 8.6 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 004.2 4.2',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  lock: 'M6 11V8a6 6 0 0112 0v3M5 11h14v10H5z',
  refresh: 'M20 11a8 8 0 00-14-4L4 9M4 4v5h5M4 13a8 8 0 0014 4l2-2M20 20v-5h-5',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  alert: 'M12 4l10 17H2L12 4zM12 10v5M12 18h.01',
  wallet: 'M3 7h16a2 2 0 012 2v10H5a2 2 0 01-2-2V7zm0 0V6a2 2 0 012-2h11M16 14h2',
  key: 'M14 10a5 5 0 11-4 4l-6 6v-3h3v-3h3l1-1',
  search: 'M11 19a8 8 0 110-16 8 8 0 010 16zM21 21l-4.35-4.35',
}
export function Icon({ name, size = 18, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={P[name]} />
    </svg>
  )
}

export function Logo({ light }) {
  return (
    <span className={`logo ${light ? 'logo-light' : ''}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="currentColor" className="logo-bg" />
        <path d="M8 11h16M8 16h16M8 21h10" stroke="#d9b15c" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span>Ledger System</span>
    </span>
  )
}

/* ---------- Money ---------- */
export function Money({ value, count = false, className = '' }) {
  const [prefs] = usePrefs()
  const [reveal, setReveal] = useState(false)
  const animated = useCountUp(Number(value) || 0)
  if (value === null || value === undefined) return <span className={className}>—</span>
  if (prefs.hideBalances && !reveal)
    return (
      <button className={`masked ${className}`} onClick={() => setReveal(true)} aria-label="Balance hidden. Show balance">
        ₹ ••••••
      </button>
    )
  return <span className={`num ${className}`}>{formatINR(count ? animated : value)}</span>
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setItems((i) => [...i, { id, message, type }])
    setTimeout(() => setItems((i) => i.filter((t) => t.id !== id)), 4200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === 'ok' ? 'check' : 'alert'} size={16} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ---------- Modal (focus trapped, Esc closes) ---------- */
export function Modal({ title, children, onClose, dismissible = true }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const prev = document.activeElement
    const el = ref.current
    el?.querySelector('button, input, a')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissible) onClose?.()
      if (e.key === 'Tab') {
        const f = el.querySelectorAll('button, input, select, a[href]')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose, dismissible])
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

/* ---------- Form bits ---------- */
export function Field({ label, error, hint, children }) {
  const id = useId()
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {typeof children === 'function' ? children(id, error ? `${id}-err` : undefined) : children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="err" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function PasswordInput({ id, value, onChange, autoComplete, describedBy, invalid }) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        spellCheck="false"
        autoCapitalize="none"
      />
      <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eyeOff' : 'eye'} />
      </button>
    </div>
  )
}

export function StrengthMeter({ password }) {
  const score = password ? passwordScore(password) : -1
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent']
  return (
    <div className="strength" aria-live="polite">
      <div className="bars">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={score >= i && score >= 0 ? `on s${Math.max(score, 1)}` : ''} />
        ))}
      </div>
      <span className="strength-label">{score < 0 ? 'Use 8+ characters with letters, a number and a symbol' : labels[score]}</span>
    </div>
  )
}

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
}

export function CopyButton({ text, label = 'Copy account ID' }) {
  const toast = useToast()
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      onClick={async (e) => {
        e.stopPropagation()
        if (await copyText(text)) {
          setDone(true)
          toast('Account ID copied')
          setTimeout(() => setDone(false), 1400)
        }
      }}
    >
      <Icon name={done ? 'check' : 'copy'} size={16} />
    </button>
  )
}

export function StatusChip({ status }) {
  return <span className={`chip chip-${String(status).toLowerCase()}`}>{status}</span>
}

export function Empty({ icon = 'wallet', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

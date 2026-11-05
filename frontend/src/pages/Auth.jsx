import { useEffect, useState } from 'react'
import { Link, navigate } from '../router'
import { useAuth } from '../auth'
import { EMAIL_RE, passwordScore } from '../utils'
import { Field, Icon, Logo, PasswordInput, Spinner, StrengthMeter } from '../components/ui'

// Client-side throttle after repeated failures (the server should also rate-limit).
let fails = 0
let lockUntil = 0

function AuthFrame({ title, sub, children, footer, onSubmit }) {
  return (
    <div className="auth">
      <aside className="auth-art" aria-hidden="true">
        <Logo light />
        <div className="art-lines">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <p>Debit. Credit. Balanced.</p>
      </aside>
      <div className="auth-panel">
        <Link to="/" className="back">
          <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} /> Back
        </Link>
        <form className="auth-card" onSubmit={onSubmit} noValidate>
          <h1>{title}</h1>
          <p className="sub">{sub}</p>
          {children}
        </form>
        <p className="auth-foot">{footer}</p>
      </div>
    </div>
  )
}

export function Login() {
  const { login, notice, clearNotice } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000)))

  useEffect(() => {
    if (wait <= 0) return
    const t = setInterval(() => setWait(Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000))), 500)
    return () => clearInterval(t)
  }, [wait])

  const submit = async (e) => {
    e.preventDefault()
    if (busy || wait > 0) return
    const next = {}
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Enter your password'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      clearNotice()
      await login(email.trim().toLowerCase(), password)
      fails = 0
      navigate('/app')
    } catch (err) {
      fails++
      if (fails >= 5) {
        lockUntil = Date.now() + 30000
        fails = 0
        setWait(30)
      }
      setFormError(err.status === 401 ? 'Email or password is incorrect.' : err.message)
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      onSubmit={submit}
      title="Welcome back"
      sub="Sign in to see your accounts."
      footer={
        <>
          New to Ledger System? <Link to="/register">Open an account</Link>
        </>
      }
    >
      <>
        {notice && <div className="banner banner-info">{notice}</div>}
        {formError && (
          <div className="banner banner-err" role="alert">
            {formError}
          </div>
        )}
        {wait > 0 && (
          <div className="banner banner-err" role="alert">
            Too many attempts. Try again in {wait}s.
          </div>
        )}
        <Field label="Email" error={errors.email}>
          {(id, err) => (
            <input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={err} aria-invalid={!!errors.email || undefined} autoFocus />
          )}
        </Field>
        <Field label="Password" error={errors.password}>
          {(id, err) => <PasswordInput id={id} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" describedBy={err} invalid={!!errors.password} />}
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy || wait > 0}>
          {busy ? <Spinner /> : 'Sign in'}
        </button>
      </>
    </AuthFrame>
  )
}

export function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Enter your full name'
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (form.password.length < 8) next.password = 'Use at least 8 characters'
    else if (passwordScore(form.password) < 2) next.password = 'Add uppercase letters, a number or a symbol'
    if (form.confirm !== form.password) next.confirm = 'Passwords don’t match'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password)
      navigate('/app')
    } catch (err) {
      setFormError(err.status === 422 ? 'An account with this email already exists. Sign in instead.' : err.message)
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      onSubmit={submit}
      title="Open your Ledger System account"
      sub="It takes a minute. You can open a ledger account right after."
      footer={
        <>
          Already registered? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <>
        {formError && (
          <div className="banner banner-err" role="alert">
            {formError}
          </div>
        )}
        <Field label="Full name" error={errors.name}>
          {(id, err) => <input id={id} autoComplete="name" value={form.name} onChange={set('name')} aria-describedby={err} aria-invalid={!!errors.name || undefined} autoFocus />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(id, err) => <input id={id} type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-describedby={err} aria-invalid={!!errors.email || undefined} />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(id, err) => (
            <>
              <PasswordInput id={id} value={form.password} onChange={set('password')} autoComplete="new-password" describedBy={err} invalid={!!errors.password} />
              <StrengthMeter password={form.password} />
            </>
          )}
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          {(id, err) => <PasswordInput id={id} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" describedBy={err} invalid={!!errors.confirm} />}
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <Spinner /> : 'Create account'}
        </button>
      </>
    </AuthFrame>
  )
}

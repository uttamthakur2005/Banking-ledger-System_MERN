import { useSyncExternalStore } from 'react'

// Tiny hash router: no dependency, works on any static host.
const subscribe = (cb) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const getPath = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0]

export const usePath = () => useSyncExternalStore(subscribe, getPath, () => '/')
export const navigate = (to) => {
  window.location.hash = to
  window.scrollTo({ top: 0 })
}

export function matchRoute(pattern, path) {
  const a = pattern.split('/').filter(Boolean)
  const b = path.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}

export function Link({ to, children, ...rest }) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  )
}

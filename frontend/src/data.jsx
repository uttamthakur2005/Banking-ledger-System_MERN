import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { useAuth } from './auth'
import { store } from './utils'

const DataCtx = createContext(null)
export const useData = () => useContext(DataCtx)

/*
 * The backend has no "list transactions" endpoint yet, so activity is recorded
 * on this device each time a transfer/funding succeeds. Balances always come
 * from the server (sum of the immutable ledger).
 */
export function DataProvider({ children }) {
  const { user } = useAuth()
  const uid = user?._id
  const [accounts, setAccounts] = useState(null)
  const [balances, setBalances] = useState({})
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [history, setHistory] = useState(() => store.get(`ledger.history.${uid}`, []))
  const [payees, setPayees] = useState(() => store.get(`ledger.payees.${uid}`, []))

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError('')
    try {
      const { accounts: list } = await api.accounts()
      setAccounts(list)
      const entries = await Promise.all(
        list.map((a) =>
          api
            .balance(a._id)
            .then((r) => [a._id, r.balance])
            .catch(() => [a._id, null])
        )
      )
      setBalances(Object.fromEntries(entries))
    } catch (e) {
      if (e.status !== 401) setError(e.message)
      setAccounts((a) => a ?? [])
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!uid) return
    setHistory(store.get(`ledger.history.${uid}`, []))
    setPayees(store.get(`ledger.payees.${uid}`, []))
    refresh()
  }, [uid, refresh])

  const addHistory = useCallback(
    (entry) => {
      setHistory((h) => {
        if (h.some((x) => x.key === entry.key)) return h
        const next = [entry, ...h].slice(0, 200)
        store.set(`ledger.history.${uid}`, next)
        return next
      })
    },
    [uid]
  )

  const addPayee = useCallback(
    (payee) => {
      setPayees((p) => {
        const next = [payee, ...p.filter((x) => x.id !== payee.id)].slice(0, 12)
        store.set(`ledger.payees.${uid}`, next)
        return next
      })
    },
    [uid]
  )

  const removePayee = useCallback(
    (id) => {
      setPayees((p) => {
        const next = p.filter((x) => x.id !== id)
        store.set(`ledger.payees.${uid}`, next)
        return next
      })
    },
    [uid]
  )

  const total = useMemo(() => Object.values(balances).reduce((s, b) => s + (Number(b) || 0), 0), [balances])

  const value = {
    accounts,
    balances,
    total,
    error,
    refreshing,
    refresh,
    history,
    addHistory,
    payees,
    addPayee,
    removePayee,
    createAccount: async () => {
      const res = await api.createAccount()
      await refresh()
      return res.account
    },
  }
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}

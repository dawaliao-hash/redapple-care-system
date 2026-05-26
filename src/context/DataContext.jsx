import { createContext, useContext, useState, useEffect } from 'react'
import { RECIPIENTS as INIT_R } from '../data/recipients.js'
import { CAREGIVERS as INIT_C } from '../data/caregivers.js'
import {
  fetchRecipients, upsertRecipient, deleteRecipient as apiDeleteRecipient,
  fetchCaregivers, upsertCaregiver, deleteCaregiver as apiDeleteCaregiver,
} from '../api/index.js'
import { isOnline } from '../lib/supabase.js'
import { useLocalStorage } from '../utils/useLocalStorage.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(isOnline)

  // ── 離線備用（localStorage）────────────────────────────────
  const [localR, setLocalR] = useLocalStorage('redapple_recipients', INIT_R)
  const [localC, setLocalC] = useLocalStorage('redapple_caregivers', INIT_C)

  // 若 localStorage 被舊版本寫入空陣列，直接改用 JS 預設資料
  const safeR = Array.isArray(localR) && localR.length > 0 ? localR : INIT_R
  const safeC = Array.isArray(localC) && localC.length > 0 ? localC : INIT_C

  // ── 線上資料（Supabase）───────────────────────────────────
  const [recipients, setRecipients] = useState(safeR)
  const [caregivers, setCaregivers] = useState(safeC)

  useEffect(() => {
    if (!isOnline) { setLoading(false); return }
    Promise.all([fetchRecipients(), fetchCaregivers()]).then(([r, c]) => {
      setRecipients(r); setLocalR(r)
      setCaregivers(c); setLocalC(c)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ── CRUD — 長者 ────────────────────────────────────────────
  const addRecipient = async (r) => {
    // 先樂觀更新本地，再嘗試同步 Supabase
    setRecipients(prev => [...prev, r])
    setLocalR(prev => [...prev, r])
    try {
      const saved = await upsertRecipient(r)
      setRecipients(prev => prev.map(x => x.id === saved.id ? saved : x))
      setLocalR(prev => prev.map(x => x.id === saved.id ? saved : x))
    } catch (e) { console.error('[DataContext] addRecipient:', e) }
  }
  const updateRecipient = async (r) => {
    setRecipients(prev => prev.map(x => x.id === r.id ? r : x))
    setLocalR(prev => prev.map(x => x.id === r.id ? r : x))
    try {
      const saved = await upsertRecipient(r)
      setRecipients(prev => prev.map(x => x.id === saved.id ? saved : x))
      setLocalR(prev => prev.map(x => x.id === saved.id ? saved : x))
    } catch (e) { console.error('[DataContext] updateRecipient:', e) }
  }
  const deleteRecipient = async (id) => {
    setRecipients(prev => prev.filter(x => x.id !== id))
    setLocalR(prev => prev.filter(x => x.id !== id))
    try { await apiDeleteRecipient(id) } catch (e) { console.error('[DataContext] deleteRecipient:', e) }
  }

  // ── CRUD — 照服員 ─────────────────────────────────────────
  const addCaregiver = async (c) => {
    setCaregivers(prev => [...prev, c])
    setLocalC(prev => [...prev, c])
    try {
      const saved = await upsertCaregiver(c)
      setCaregivers(prev => prev.map(x => x.id === saved.id ? saved : x))
      setLocalC(prev => prev.map(x => x.id === saved.id ? saved : x))
    } catch (e) { console.error('[DataContext] addCaregiver:', e) }
  }
  const updateCaregiver = async (c) => {
    setCaregivers(prev => prev.map(x => x.id === c.id ? c : x))
    setLocalC(prev => prev.map(x => x.id === c.id ? c : x))
    try {
      const saved = await upsertCaregiver(c)
      setCaregivers(prev => prev.map(x => x.id === saved.id ? saved : x))
      setLocalC(prev => prev.map(x => x.id === saved.id ? saved : x))
    } catch (e) { console.error('[DataContext] updateCaregiver:', e) }
  }
  const deleteCaregiver = async (id) => {
    setCaregivers(prev => prev.filter(x => x.id !== id))
    setLocalC(prev => prev.filter(x => x.id !== id))
    try { await apiDeleteCaregiver(id) } catch (e) { console.error('[DataContext] deleteCaregiver:', e) }
  }

  return (
    <DataContext.Provider value={{
      loading,
      recipients, setRecipients, addRecipient, updateRecipient, deleteRecipient,
      caregivers, setCaregivers, addCaregiver, updateCaregiver, deleteCaregiver,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

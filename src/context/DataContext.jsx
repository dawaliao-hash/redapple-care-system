import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { RECIPIENTS as INIT_R } from '../data/recipients.js'
import { CAREGIVERS as INIT_C } from '../data/caregivers.js'
import {
  fetchRecipients, upsertRecipient, deleteRecipient as apiDeleteRecipient,
  fetchCaregivers, upsertCaregiver, deleteCaregiver as apiDeleteCaregiver,
} from '../api/index.js'
import { supabase, isOnline } from '../lib/supabase.js'
import { useLocalStorage } from '../utils/useLocalStorage.js'

const DataContext = createContext(null)

// 合併雲端資料與本地狀態：
// 若 Supabase 未追蹤結案/離職欄位（isActive===undefined，代表 migration 未執行），
// 保留本地已知的結案/離職狀態，避免重抓時被覆蓋而讓人「消失」。
function mergeRecipients(fetched, prev) {
  const byId = new Map(prev.map(x => [x.id, x]))
  return fetched.map(f => {
    if (f.isActive === undefined) {
      const p = byId.get(f.id)
      return { ...f,
        isActive:    p?.isActive ?? true,
        closedAt:    p?.closedAt ?? null,
        closeReason: p?.closeReason ?? '' }
    }
    return { ...f, closedAt: f.closedAt ?? null, closeReason: f.closeReason ?? '' }
  })
}
function mergeCaregivers(fetched, prev) {
  const byId = new Map(prev.map(x => [x.id, x]))
  return fetched.map(f => {
    if (f.isActive === undefined) {
      const p = byId.get(f.id)
      return { ...f,
        isActive:     p?.isActive ?? true,
        resignedAt:   p?.resignedAt ?? null,
        resignReason: p?.resignReason ?? '' }
    }
    return { ...f, resignedAt: f.resignedAt ?? null, resignReason: f.resignReason ?? '' }
  })
}

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

  // 追蹤目前清單，供 refetch 合併時保留本地結案/離職狀態
  const recipientsRef = useRef(recipients); recipientsRef.current = recipients
  const caregiversRef = useRef(caregivers); caregiversRef.current = caregivers

  // 從 Supabase 重新拉取長者和照服員（節流：3 秒內不重複）
  const lastRefetchMs = useRef(0)
  const refetchData = useCallback(() => {
    if (!isOnline) return
    const now = Date.now()
    if (now - lastRefetchMs.current < 3000) return
    lastRefetchMs.current = now
    Promise.all([fetchRecipients(), fetchCaregivers()]).then(([r, c]) => {
      const mr = mergeRecipients(r, recipientsRef.current)
      const mc = mergeCaregivers(c, caregiversRef.current)
      setRecipients(mr); setLocalR(mr)
      setCaregivers(mc); setLocalC(mc)
    }).catch(console.error)
  }, [])

  // 初始載入：從 Supabase 拉取，並保留本地尚未同步的新增項目
  useEffect(() => {
    if (!isOnline) { setLoading(false); return }
    Promise.all([fetchRecipients(), fetchCaregivers()]).then(([r, c]) => {
      // 找出本地有、Supabase 沒有的項目（剛新增但 Supabase 尚未存到的）
      const supabaseRIds = new Set(r.map(x => x.id))
      const supabaseCIds = new Set(c.map(x => x.id))
      const localOnlyR = safeR.filter(x => !supabaseRIds.has(x.id))
      const localOnlyC = safeC.filter(x => !supabaseCIds.has(x.id))

      // 以 localStorage 為 prev 合併，保留本地結案/離職狀態（migration 未執行時）
      const mergedR = [...mergeRecipients(r, safeR), ...localOnlyR]
      const mergedC = [...mergeCaregivers(c, safeC), ...localOnlyC]

      setRecipients(mergedR); setLocalR(mergedR)
      setCaregivers(mergedC); setLocalC(mergedC)
      setLoading(false)

      // 嘗試把本地新增的重新同步到 Supabase（背景執行，不阻擋 UI）
      localOnlyR.forEach(x => upsertRecipient(x).catch(console.error))
      localOnlyC.forEach(x => upsertCaregiver(x).catch(console.error))
    }).catch(() => setLoading(false))
  }, [])

  // Realtime 訂閱：其他裝置新增/修改/刪除長者或照服員時即時同步
  useEffect(() => {
    if (!isOnline) return
    const channel = supabase
      .channel('redapple-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipients' },
        () => refetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caregivers' },
        () => refetchData())
      .subscribe()

    // 切回視窗時重抓（確保離線期間的變更也能補上）
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetchData()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refetchData])

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

  // 過濾後的版本：各 view 應使用這兩個（管理頁面才需要 all）
  const activeRecipients = useMemo(
    () => recipients.filter(r => r.isActive !== false),
    [recipients]
  )
  const activeCaregivers = useMemo(
    () => caregivers.filter(c => c.isActive !== false),
    [caregivers]
  )

  return (
    <DataContext.Provider value={{
      loading,
      recipients, setRecipients, addRecipient, updateRecipient, deleteRecipient,
      caregivers, setCaregivers, addCaregiver, updateCaregiver, deleteCaregiver,
      activeRecipients, activeCaregivers,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

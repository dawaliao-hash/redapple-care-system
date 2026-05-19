import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { supabase } from './lib/supabase.js'
import LoginPage from './pages/LoginPage.jsx'
import PendingApprovalPage from './pages/PendingApprovalPage.jsx'
import { DataProvider, useData } from './context/DataContext.jsx'
import { generateHealthRecords } from './data/mockHealth.js'
import { generateMonthlyAttendance, formatDisplayDate } from './data/monthlyAttendance.js'
import { useLocalStorage } from './utils/useLocalStorage.js'
import { useHolidaySync } from './utils/useHolidaySync.js'
import { isOnline } from './lib/supabase.js'
import {
  fetchAttendanceForMonth, upsertAttendance,
  fetchAssignmentsForDate, upsertAssignment,
  fetchHealthRecords, insertHealthRecord,
  checkApprovalStatus,
} from './api/index.js'
import Header from './components/Header.jsx'
import TabNav from './components/TabNav.jsx'
import RecipientModal from './components/RecipientModal.jsx'
import MatchingView from './views/MatchingView.jsx'
import MonthlyView from './views/MonthlyView.jsx'
import StatsView from './views/StatsView.jsx'
import AttendanceView from './views/AttendanceView.jsx'
import HealthView from './views/HealthView.jsx'
import AdminView from './views/AdminView.jsx'
import AccountView from './views/AccountView.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'

const today    = new Date()
const todayStr = formatDisplayDate(today)

function AppInner({ signOut, user }) {
  const { recipients, loading: dataLoading } = useData()
  const { holidays, syncing, lastSync }      = useHolidaySync()

  const defaultAssignments = useCallback(() => {
    const m = {}
    recipients.forEach(r => { m[r.id] = r.primaryCaregiver })
    return m
  }, [recipients])

  // ── 共用長者排序（三個畫面連動）─────────────────────────
  const [recipientOrder, setRecipientOrder] = useLocalStorage(
    'redapple_recipient_order',
    () => recipients.map(r => r.id)
  )

  const [tab, setTab] = useState('matching')

  // ── 月度出缺席（localStorage 快取 + Supabase 同步）──────────
  const [monthlyAttendance, setMonthlyAttendanceLocal] = useLocalStorage(
    'redapple_monthly_attendance', generateMonthlyAttendance
  )

  // Supabase 啟動時同步本月資料
  useEffect(() => {
    if (!isOnline) return
    fetchAttendanceForMonth(today.getFullYear(), today.getMonth() + 1).then(remote => {
      if (Object.keys(remote).length > 0) {
        setMonthlyAttendanceLocal(prev => ({ ...prev, ...remote }))
      }
    })
  }, [])

  // 寫入出缺席 → 同時更新 local 和 Supabase
  const setMonthlyAttendance = useCallback((updater) => {
    setMonthlyAttendanceLocal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // 找出變動的格子並同步到 Supabase
      if (isOnline) {
        Object.entries(next).forEach(([date, dayData]) => {
          const prevDay = prev[date] ?? {}
          Object.entries(dayData).forEach(([rid, status]) => {
            if (prevDay[rid] !== status) {
              upsertAttendance(date, rid, status).catch(console.error)
            }
          })
        })
      }
      return next
    })
  }, [])

  const attendance    = monthlyAttendance[todayStr] ?? {}
  const setAttendance = useCallback((updater) =>
    setMonthlyAttendance(prev => ({
      ...prev,
      [todayStr]: typeof updater === 'function' ? updater(prev[todayStr] ?? {}) : updater,
    })), [setMonthlyAttendance])

  // ── 每日照服員配對（localStorage 快取 + Supabase 同步）────────
  const [dailyAssignments, setDailyAssignmentsLocal] = useLocalStorage(
    'redapple_daily_assignments',
    () => ({ [todayStr]: defaultAssignments() })
  )

  // 同步計算「有效配對」：若 localStorage 今天是空的，直接 fallback 到 primaryCaregiver
  // 用 useMemo 而非 useEffect，避免 stale closure + 同 reference 不觸發的問題
  const effectiveDailyAssignments = useMemo(() => {
    const todayAsgn = dailyAssignments[todayStr]
    if (todayAsgn && Object.keys(todayAsgn).length > 0) return dailyAssignments
    const defaults = defaultAssignments()
    if (!Object.keys(defaults).length) return dailyAssignments
    return { ...dailyAssignments, [todayStr]: defaults }
  }, [dailyAssignments, defaultAssignments])

  // 若今天是空的，把預設值寫回 localStorage（方便下次直接讀到）
  useEffect(() => {
    setDailyAssignmentsLocal(prev => {
      const todayAsgn = prev[todayStr]
      if (todayAsgn && Object.keys(todayAsgn).length > 0) return prev
      const defaults = defaultAssignments()
      if (!Object.keys(defaults).length) return prev
      return { ...prev, [todayStr]: defaults }
    })
  }, [defaultAssignments])

  useEffect(() => {
    if (!isOnline) return
    fetchAssignmentsForDate(todayStr).then(remote => {
      if (remote && Object.keys(remote).length > 0) {
        setDailyAssignmentsLocal(prev => ({ ...prev, [todayStr]: remote }))
      }
    })
  }, [])

  const setDailyAssignments = useCallback((updater) => {
    setDailyAssignmentsLocal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (isOnline) {
        Object.entries(next).forEach(([date, assigns]) => {
          Object.entries(assigns).forEach(([rid, cid]) => {
            if ((prev[date] ?? {})[rid] !== cid) {
              upsertAssignment(date, rid, cid).catch(console.error)
            }
          })
        })
      }
      return next
    })
  }, [])

  // ── 健康紀錄（localStorage 快取 + Supabase 同步）──────────────
  const [healthRecords, setHealthRecordsLocal] = useLocalStorage(
    'redapple_health_records', generateHealthRecords
  )

  // 新增量測：先樂觀更新 local，再同步 Supabase
  const setHealthRecords = useCallback((updater) => {
    setHealthRecordsLocal(updater)
  }, [])

  // 覆寫健康紀錄新增，讓它也寫到 Supabase
  const addHealthRecord = useCallback(async (recipientId, record) => {
    // 1. 樂觀更新 local
    setHealthRecordsLocal(prev => ({
      ...prev,
      [recipientId]: [...(prev[recipientId] || []), record],
    }))
    // 2. 同步 Supabase
    if (isOnline) {
      try { await insertHealthRecord(recipientId, record) } catch (e) { console.error(e) }
    }
  }, [])

  // ── 長者 Modal ─────────────────────────────────────────────
  const [selectedRecipient, setSelectedRecipient] = useState(null)

  const sharedProps = { holidays, syncing, lastSync }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FBF6EC' }}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto">
            <svg viewBox="0 0 60 60" className="w-12 h-12 animate-pulse">
              <ellipse cx="32" cy="36" rx="18" ry="20" fill="#A53838" />
              <ellipse cx="26" cy="28" rx="6" ry="8" fill="#C85A5A" opacity="0.6" />
            </svg>
          </div>
          <p className="font-display text-lg" style={{ color: '#5C2828' }}>水林紅蘋果長照中心</p>
          <p className="text-sm" style={{ color: '#8B6F47' }}>正在載入資料⋯</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FBF6EC', color: '#3D2817' }}>
      <Header syncing={syncing} lastSync={lastSync} isOnline={isOnline} user={user} signOut={signOut} />
      <TabNav tab={tab} setTab={setTab} />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab === 'matching' && (
          <MatchingView
            monthlyAttendance={monthlyAttendance}
            setMonthlyAttendance={setMonthlyAttendance}
            dailyAssignments={effectiveDailyAssignments}
            setDailyAssignments={setDailyAssignments}
            defaultAssignments={defaultAssignments}
            recipientOrder={recipientOrder}
            onSelectRecipient={setSelectedRecipient}
            {...sharedProps}
          />
        )}
        {tab === 'monthly' && (
          <MonthlyView
            monthlyAttendance={monthlyAttendance}
            setMonthlyAttendance={setMonthlyAttendance}
            recipientOrder={recipientOrder}
            setRecipientOrder={setRecipientOrder}
            {...sharedProps}
          />
        )}
        {tab === 'attendance' && (
          <AttendanceView
            attendance={attendance}
            setAttendance={setAttendance}
            recipientOrder={recipientOrder}
            setRecipientOrder={setRecipientOrder}
            onSelectRecipient={setSelectedRecipient}
            {...sharedProps}
          />
        )}
        {tab === 'stats' && (
          <StatsView
            attendance={attendance}
            assignments={effectiveDailyAssignments[todayStr] ?? defaultAssignments()}
            monthlyAttendance={monthlyAttendance}
            dailyAssignments={effectiveDailyAssignments}
            onSelectRecipient={setSelectedRecipient}
          />
        )}
        {tab === 'health' && (
          <HealthView
            healthRecords={healthRecords}
            setHealthRecords={setHealthRecords}
            addHealthRecord={addHealthRecord}
            onSelectRecipient={setSelectedRecipient}
          />
        )}
        {tab === 'admin'   && <AdminView />}
        {tab === 'account' && <AccountView user={user} />}
      </main>
      {selectedRecipient && (
        <RecipientModal
          recipient={selectedRecipient}
          healthRecords={healthRecords[selectedRecipient.id] || []}
          attendance={attendance[selectedRecipient.id]}
          onClose={() => setSelectedRecipient(null)}
        />
      )}
    </div>
  )
}

function AuthGate() {
  const { user, loading, signOut } = useAuth()
  const [isRecovery, setIsRecovery] = useState(
    window.location.hash.includes('type=recovery') ||
    new URLSearchParams(window.location.search).get('type') === 'recovery'
  )
  // null = 尚未檢查, 'admin'|'approved'|'pending'|'rejected'
  const [approvalStatus, setApprovalStatus] = useState(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 登入後檢查帳號審核狀態
  useEffect(() => {
    if (!user) { setApprovalStatus(null); return }
    if (user.user_metadata?.role === 'admin') { setApprovalStatus('admin'); return }
    checkApprovalStatus(user.id).then(setApprovalStatus)
  }, [user])

  if (isRecovery) {
    return (
      <ResetPasswordPage onDone={() => {
        setIsRecovery(false)
        window.history.replaceState(null, '', '/')
        signOut()
      }} />
    )
  }

  const isCheckingAuth = loading || (!!user && approvalStatus === null)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FBF6EC' }}>
        <div className="text-center space-y-3">
          <svg viewBox="0 0 60 60" className="w-12 h-12 mx-auto animate-pulse">
            <ellipse cx="32" cy="36" rx="18" ry="20" fill="#A53838" />
          </svg>
          <p className="text-sm" style={{ color: '#8B6F47' }}>正在驗證身份⋯</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
    return <PendingApprovalPage status={approvalStatus} user={user} signOut={signOut} />
  }

  return (
    <DataProvider>
      <AppInner signOut={signOut} user={user} />
    </DataProvider>
  )
}

export default function App() {
  return <AuthGate />
}

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
  fetchAssignmentsForDate, upsertAssignment, upsertAssignmentsBulk,
  fetchHealthRecords, insertHealthRecord,
  checkApprovalStatus,
} from './api/index.js'
import Header from './components/Header.jsx'
import TabNav from './components/TabNav.jsx'
import RecipientModal from './components/RecipientModal.jsx'
import MatchingView from './views/MatchingView.jsx'
import MonthlyView from './views/MonthlyView.jsx'
import StaffingView from './views/StaffingView.jsx'
import StatsView from './views/StatsView.jsx'
import AttendanceView from './views/AttendanceView.jsx'
import HealthView from './views/HealthView.jsx'
import AdminView from './views/AdminView.jsx'
import AccountView from './views/AccountView.jsx'
import ReportView from './views/ReportView.jsx'
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
  // v2：版本號更新讓舊的假資料快取自動失效
  const [monthlyAttendance, setMonthlyAttendanceLocal] = useLocalStorage(
    'redapple_monthly_attendance_v2', generateMonthlyAttendance
  )

  // Supabase 是正確來源：用遠端資料完整取代涵蓋月份，清除本地假資料
  const mergeAttendance = useCallback((remote) => {
    if (!Object.keys(remote).length) return
    setMonthlyAttendanceLocal(prev => {
      // 找出 Supabase 資料涵蓋哪些「年/月」（例如 '2026/05'）
      const remoteMonths = new Set(Object.keys(remote).map(d => d.slice(0, 7)))
      const merged = {}
      // 保留 Supabase 未涵蓋月份的本地資料
      Object.entries(prev).forEach(([date, data]) => {
        if (!remoteMonths.has(date.slice(0, 7))) merged[date] = data
      })
      // Supabase 涵蓋的月份：完全以遠端資料為準
      Object.entries(remote).forEach(([date, dayData]) => {
        merged[date] = dayData
      })
      return merged
    })
  }, [])

  // 依月份載入雲端點名資料（每月只抓一次；月度點名/月度人力切換月份時呼叫）
  const loadedMonths = useRef(new Set())
  const ensureMonthLoaded = useCallback((year, month) => {
    if (!isOnline) return
    const key = `${year}/${String(month).padStart(2, '0')}`
    if (loadedMonths.current.has(key)) return
    loadedMonths.current.add(key)
    fetchAttendanceForMonth(year, month).then(mergeAttendance)
  }, [mergeAttendance])

  // Supabase 啟動時同步本月資料
  useEffect(() => {
    ensureMonthLoaded(today.getFullYear(), today.getMonth() + 1)
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

  // ── 每日照服員配對（Supabase 為唯一來源，_v2 清除舊快取）──────
  // 初始值空白，讓 Supabase fetch 決定內容
  const [dailyAssignments, setDailyAssignmentsLocal] = useLocalStorage(
    'redapple_daily_assignments_v2', () => ({})
  )

  // UI fallback：Supabase 尚未回應前，以 primaryCaregiver 暫時顯示
  const effectiveDailyAssignments = useMemo(() => {
    const todayAsgn = dailyAssignments[todayStr]
    if (todayAsgn && Object.keys(todayAsgn).length > 0) return dailyAssignments
    const defaults = defaultAssignments()
    if (!Object.keys(defaults).length) return dailyAssignments
    return { ...dailyAssignments, [todayStr]: defaults }
  }, [dailyAssignments, defaultAssignments])

  // 初始化：從 Supabase 拉今日配對；若 Supabase 空白，把 defaultAssignments 寫進去
  // 確保所有裝置讀同一份資料
  const assignmentInitDone = useRef(false)
  useEffect(() => {
    if (!isOnline || assignmentInitDone.current) return
    const defaults = defaultAssignments()
    if (!Object.keys(defaults).length) return  // recipients 尚未載入，稍後再試

    assignmentInitDone.current = true
    fetchAssignmentsForDate(todayStr).then(remote => {
      if (remote && Object.keys(remote).length > 0) {
        // Supabase 有資料 → 以 Supabase 為準，覆蓋本地快取
        setDailyAssignmentsLocal(prev => ({ ...prev, [todayStr]: remote }))
      } else {
        // Supabase 空白 → 將 defaultAssignments 寫入 Supabase，所有裝置共用同一份
        setDailyAssignmentsLocal(prev => ({ ...prev, [todayStr]: defaults }))
        upsertAssignmentsBulk(todayStr, defaults).catch(console.error)
      }
    })
  }, [defaultAssignments])

  // ── 多用戶即時同步 ────────────────────────────────────────────
  // 節流：同一秒內的多次觸發只執行一次
  const lastSyncMs = useRef(0)
  const refetchFromSupabase = useCallback(() => {
    const now = Date.now()
    if (now - lastSyncMs.current < 3000) return   // 3秒內不重複
    lastSyncMs.current = now
    fetchAttendanceForMonth(today.getFullYear(), today.getMonth() + 1).then(mergeAttendance)
    fetchAssignmentsForDate(todayStr).then(remote => {
      if (remote && Object.keys(remote).length > 0) {
        setDailyAssignmentsLocal(prev => ({ ...prev, [todayStr]: remote }))
      }
    })
  }, [mergeAttendance])

  useEffect(() => {
    if (!isOnline) return

    // Supabase Realtime：任何用戶改了出缺席或配對，立即通知此裝置重抓
    const channel = supabase
      .channel('redapple-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' },
        () => refetchFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' },
        () => refetchFromSupabase())
      .subscribe()

    // 視窗可見性：切分頁回來、切 App 回來 → 重抓最新資料
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetchFromSupabase()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refetchFromSupabase])

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
      <Header syncing={syncing} lastSync={lastSync} isOnline={isOnline} user={user} signOut={signOut} onSync={refetchFromSupabase} />
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
            ensureMonthLoaded={ensureMonthLoaded}
            {...sharedProps}
          />
        )}
        {tab === 'staffing' && (
          <StaffingView
            monthlyAttendance={monthlyAttendance}
            dailyAssignments={effectiveDailyAssignments}
            recipientOrder={recipientOrder}
            setRecipientOrder={setRecipientOrder}
            ensureMonthLoaded={ensureMonthLoaded}
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
        {tab === 'report'  && (
          <ReportView monthlyAttendance={monthlyAttendance} />
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
  // SQL 執行前的 email 備援清單：這些帳號一律視為管理員
  const ADMIN_EMAILS = ['amuy.chen@gmail.com', 'dawadorge@gmail.com']
  useEffect(() => {
    if (!user) { setApprovalStatus(null); return }
    if (user.user_metadata?.role === 'admin' || ADMIN_EMAILS.includes(user.email)) {
      setApprovalStatus('admin'); return
    }
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

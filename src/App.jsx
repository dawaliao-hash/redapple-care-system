import { useState, useCallback, useEffect } from 'react'
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

const today    = new Date()
const todayStr = formatDisplayDate(today)

function AppInner() {
  const { recipients, loading: dataLoading } = useData()
  const { holidays, syncing, lastSync }      = useHolidaySync()

  const defaultAssignments = useCallback(() => {
    const m = {}
    recipients.forEach(r => { m[r.id] = r.primaryCaregiver })
    return m
  }, [recipients])

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

  useEffect(() => {
    if (!isOnline) return
    fetchAssignmentsForDate(todayStr).then(remote => {
      if (remote) {
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
      <Header syncing={syncing} lastSync={lastSync} isOnline={isOnline} />
      <TabNav tab={tab} setTab={setTab} />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab === 'matching' && (
          <MatchingView
            monthlyAttendance={monthlyAttendance}
            setMonthlyAttendance={setMonthlyAttendance}
            dailyAssignments={dailyAssignments}
            setDailyAssignments={setDailyAssignments}
            defaultAssignments={defaultAssignments}
            onSelectRecipient={setSelectedRecipient}
            {...sharedProps}
          />
        )}
        {tab === 'monthly' && (
          <MonthlyView monthlyAttendance={monthlyAttendance} setMonthlyAttendance={setMonthlyAttendance} {...sharedProps} />
        )}
        {tab === 'attendance' && (
          <AttendanceView attendance={attendance} setAttendance={setAttendance} onSelectRecipient={setSelectedRecipient} {...sharedProps} />
        )}
        {tab === 'stats' && (
          <StatsView attendance={attendance} assignments={dailyAssignments[todayStr] ?? defaultAssignments()} onSelectRecipient={setSelectedRecipient} />
        )}
        {tab === 'health' && (
          <HealthView
            healthRecords={healthRecords}
            setHealthRecords={setHealthRecords}
            addHealthRecord={addHealthRecord}
            onSelectRecipient={setSelectedRecipient}
          />
        )}
        {tab === 'admin' && <AdminView />}
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

export default function App() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  )
}

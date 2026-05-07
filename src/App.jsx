import { useState, useCallback } from 'react'
import { DataProvider, useData } from './context/DataContext.jsx'
import { generateHealthRecords } from './data/mockHealth.js'
import { generateMonthlyAttendance, formatDisplayDate } from './data/monthlyAttendance.js'
import { useLocalStorage } from './utils/useLocalStorage.js'
import { useHolidaySync } from './utils/useHolidaySync.js'
import Header from './components/Header.jsx'
import TabNav from './components/TabNav.jsx'
import RecipientModal from './components/RecipientModal.jsx'
import MatchingView from './views/MatchingView.jsx'
import MonthlyView from './views/MonthlyView.jsx'
import StatsView from './views/StatsView.jsx'
import AttendanceView from './views/AttendanceView.jsx'
import HealthView from './views/HealthView.jsx'
import AdminView from './views/AdminView.jsx'

const todayStr = formatDisplayDate(new Date())

function AppInner() {
  const { recipients } = useData()

  // 假日資料（背景同步更新）
  const { holidays, syncing, lastSync } = useHolidaySync()

  const defaultAssignments = useCallback(() => {
    const m = {}
    recipients.forEach(r => { m[r.id] = r.primaryCaregiver })
    return m
  }, [recipients])

  const [tab, setTab] = useState('matching')

  const [monthlyAttendance, setMonthlyAttendance] = useLocalStorage(
    'redapple_monthly_attendance', generateMonthlyAttendance
  )
  const attendance    = monthlyAttendance[todayStr] ?? {}
  const setAttendance = useCallback((updater) =>
    setMonthlyAttendance(prev => ({
      ...prev,
      [todayStr]: typeof updater === 'function' ? updater(prev[todayStr] ?? {}) : updater,
    })), [setMonthlyAttendance])

  const [dailyAssignments, setDailyAssignments] = useLocalStorage(
    'redapple_daily_assignments',
    () => ({ [todayStr]: defaultAssignments() })
  )

  const [healthRecords, setHealthRecords] = useLocalStorage(
    'redapple_health_records', generateHealthRecords
  )

  const [selectedRecipient, setSelectedRecipient] = useState(null)

  const sharedProps = { holidays, syncing, lastSync }

  return (
    <div className="min-h-screen" style={{ background: '#FBF6EC', color: '#3D2817' }}>
      <Header syncing={syncing} lastSync={lastSync} />
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
          <MonthlyView
            monthlyAttendance={monthlyAttendance}
            setMonthlyAttendance={setMonthlyAttendance}
            {...sharedProps}
          />
        )}
        {tab === 'attendance' && (
          <AttendanceView
            attendance={attendance}
            setAttendance={setAttendance}
            onSelectRecipient={setSelectedRecipient}
            {...sharedProps}
          />
        )}
        {tab === 'stats' && (
          <StatsView
            attendance={attendance}
            assignments={dailyAssignments[todayStr] ?? defaultAssignments()}
            onSelectRecipient={setSelectedRecipient}
          />
        )}
        {tab === 'health' && (
          <HealthView
            healthRecords={healthRecords}
            setHealthRecords={setHealthRecords}
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

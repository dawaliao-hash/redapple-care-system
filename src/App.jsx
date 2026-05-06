import { useState } from 'react'
import { DataProvider } from './context/DataContext.jsx'
import { generateHealthRecords } from './data/mockHealth.js'
import { generateMonthlyAttendance, formatDisplayDate } from './data/monthlyAttendance.js'
import { RECIPIENTS } from './data/recipients.js'
import Header from './components/Header.jsx'
import TabNav from './components/TabNav.jsx'
import RecipientModal from './components/RecipientModal.jsx'
import MatchingView from './views/MatchingView.jsx'
import MonthlyView from './views/MonthlyView.jsx'
import StatsView from './views/StatsView.jsx'
import AttendanceView from './views/AttendanceView.jsx'
import HealthView from './views/HealthView.jsx'
import AdminView from './views/AdminView.jsx'

const INITIAL_HEALTH = generateHealthRecords()
const todayStr       = formatDisplayDate(new Date())

function AppInner() {
  const [tab, setTab] = useState('matching')

  const [monthlyAttendance, setMonthlyAttendance] = useState(generateMonthlyAttendance)

  const attendance    = monthlyAttendance[todayStr] ?? {}
  const setAttendance = (updater) =>
    setMonthlyAttendance(prev => ({
      ...prev,
      [todayStr]: typeof updater === 'function' ? updater(prev[todayStr] ?? {}) : updater,
    }))

  const [assignments, setAssignments] = useState(() => {
    const m = {}
    RECIPIENTS.forEach(r => { m[r.id] = r.primaryCaregiver })
    return m
  })

  const [healthRecords, setHealthRecords] = useState(INITIAL_HEALTH)
  const [selectedRecipient, setSelectedRecipient] = useState(null)

  return (
    <div className="min-h-screen" style={{ background: '#FBF6EC', color: '#3D2817' }}>
      <Header />
      <TabNav tab={tab} setTab={setTab} />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab === 'matching'   && <MatchingView    attendance={attendance} assignments={assignments} setAssignments={setAssignments} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'monthly'    && <MonthlyView     monthlyAttendance={monthlyAttendance} setMonthlyAttendance={setMonthlyAttendance} />}
        {tab === 'attendance' && <AttendanceView  attendance={attendance} setAttendance={setAttendance} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'stats'      && <StatsView       attendance={attendance} assignments={assignments} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'health'     && <HealthView      healthRecords={healthRecords} setHealthRecords={setHealthRecords} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'admin'      && <AdminView />}
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

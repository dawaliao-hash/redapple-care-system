import { useState } from 'react'
import { RECIPIENTS } from './data/recipients.js'
import { generateHealthRecords } from './data/mockHealth.js'
import { generateMonthlyAttendance, formatDisplayDate } from './data/monthlyAttendance.js'
import Header from './components/Header.jsx'
import TabNav from './components/TabNav.jsx'
import RecipientModal from './components/RecipientModal.jsx'
import MatchingView from './views/MatchingView.jsx'
import MonthlyView from './views/MonthlyView.jsx'
import StatsView from './views/StatsView.jsx'
import AttendanceView from './views/AttendanceView.jsx'
import HealthView from './views/HealthView.jsx'

const INITIAL_HEALTH    = generateHealthRecords()
const todayStr          = formatDisplayDate(new Date())

export default function App() {
  const [tab, setTab] = useState('matching')

  // monthlyAttendance 是所有日期出缺席的單一資料源
  const [monthlyAttendance, setMonthlyAttendance] = useState(generateMonthlyAttendance)

  // 今日出缺席（從月度資料衍生）
  const attendance    = monthlyAttendance[todayStr] ?? {}
  const setAttendance = (updater) => {
    setMonthlyAttendance(prev => ({
      ...prev,
      [todayStr]: typeof updater === 'function'
        ? updater(prev[todayStr] ?? {})
        : updater,
    }))
  }

  // 照服員配對
  const [assignments, setAssignments] = useState(() => {
    const m = {}
    RECIPIENTS.forEach(r => { m[r.id] = r.primaryCaregiver })
    return m
  })

  const [healthRecords]          = useState(INITIAL_HEALTH)
  const [selectedRecipient, setSelectedRecipient] = useState(null)

  return (
    <div className="min-h-screen" style={{ background: '#FBF6EC', color: '#3D2817' }}>
      <Header />
      <TabNav tab={tab} setTab={setTab} />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab === 'matching'   && <MatchingView attendance={attendance} assignments={assignments} setAssignments={setAssignments} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'monthly'    && <MonthlyView  monthlyAttendance={monthlyAttendance} setMonthlyAttendance={setMonthlyAttendance} />}
        {tab === 'attendance' && <AttendanceView attendance={attendance} setAttendance={setAttendance} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'stats'      && <StatsView attendance={attendance} assignments={assignments} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'health'     && <HealthView healthRecords={healthRecords} onSelectRecipient={setSelectedRecipient} />}
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

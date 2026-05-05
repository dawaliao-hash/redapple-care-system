import { useState } from 'react'
import { RECIPIENTS } from './data/recipients.js'
import { generateHealthRecords } from './data/mockHealth.js'
import Header from './components/Header.jsx'
import TabNav from './components/TabNav.jsx'
import RecipientModal from './components/RecipientModal.jsx'
import MatchingView from './views/MatchingView.jsx'
import StatsView from './views/StatsView.jsx'
import AttendanceView from './views/AttendanceView.jsx'
import HealthView from './views/HealthView.jsx'

const defaultAttendance = (() => {
  const base = {}
  RECIPIENTS.forEach(r => {
    if (r.id === 'r3') base[r.id] = 'hospital'
    else if (r.id === 'r16') base[r.id] = 'hospital'
    else if (r.id === 'r6') base[r.id] = 'clinic'
    else if (r.id === 'r2') base[r.id] = 'rest'
    else if (r.id === 'r5') base[r.id] = 'blood'
    else if (r.id === 'r13') base[r.id] = 'respite'
    else base[r.id] = 'present'
  })
  return base
})()

const INITIAL_HEALTH = generateHealthRecords()

export default function App() {
  const [tab, setTab] = useState('matching')
  const [attendance, setAttendance] = useState(defaultAttendance)
  const [assignments, setAssignments] = useState(() => {
    const m = {}
    RECIPIENTS.forEach(r => { m[r.id] = r.primaryCaregiver })
    return m
  })
  const [healthRecords] = useState(INITIAL_HEALTH)
  const [selectedRecipient, setSelectedRecipient] = useState(null)

  return (
    <div className="min-h-screen" style={{ background: '#FBF6EC', color: '#3D2817' }}>
      <Header />
      <TabNav tab={tab} setTab={setTab} />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab === 'matching'   && <MatchingView attendance={attendance} assignments={assignments} setAssignments={setAssignments} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'stats'      && <StatsView attendance={attendance} assignments={assignments} onSelectRecipient={setSelectedRecipient} />}
        {tab === 'attendance' && <AttendanceView attendance={attendance} setAttendance={setAttendance} onSelectRecipient={setSelectedRecipient} />}
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

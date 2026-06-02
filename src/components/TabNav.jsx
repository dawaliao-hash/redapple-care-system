import { Users, ClipboardList, Activity, Heart, CalendarDays, Settings, UserCog, UserCheck, FileBarChart } from 'lucide-react'

const TABS = [
  { id: 'matching',   label: '配對總覽', icon: Users },
  { id: 'monthly',    label: '月度點名', icon: CalendarDays },
  { id: 'staffing',   label: '月度人力', icon: UserCheck },
  { id: 'attendance', label: '今日點名', icon: Activity },
  { id: 'stats',      label: '服務統計', icon: ClipboardList },
  { id: 'health',     label: '健康紀錄', icon: Heart },
  { id: 'report',     label: '政府報表', icon: FileBarChart },
  { id: 'admin',      label: '機構管理', icon: Settings },
  { id: 'account',    label: '帳號設定', icon: UserCog },
]

export default function TabNav({ tab, setTab }) {
  return (
    <nav className="border-b" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map(t => {
            const Icon   = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-5 py-4 transition-all whitespace-nowrap font-display"
                style={{
                  borderBottom: active ? '3px solid #A53838' : '3px solid transparent',
                  color:        active ? '#A53838' : '#8B6F47',
                  fontWeight:   active ? 600 : 400,
                  background:   active ? 'rgba(165,56,56,0.04)' : 'transparent',
                }}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-base">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

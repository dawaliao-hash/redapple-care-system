import { useState, useMemo } from 'react'
import { CAREGIVERS } from '../data/caregivers.js'
import { RECIPIENTS } from '../data/recipients.js'
import { STATUS_TYPES } from '../data/statusTypes.js'
import KpiCard from '../components/KpiCard.jsx'
import LegendDot from '../components/LegendDot.jsx'

export default function MatchingView({ attendance, assignments, setAssignments, onSelectRecipient }) {
  const [draggedId, setDraggedId] = useState(null)

  const counts = useMemo(() => {
    const map = {}
    CAREGIVERS.forEach(c => { map[c.id] = [] })
    RECIPIENTS.forEach(r => {
      const status = attendance[r.id]
      if (['present', 'respite', 'blood'].includes(status)) {
        const cgId = assignments[r.id]
        if (cgId && map[cgId]) map[cgId].push(r)
      }
    })
    return map
  }, [attendance, assignments])

  const totalActive = useMemo(() =>
    RECIPIENTS.filter(r => ['present', 'respite', 'blood'].includes(attendance[r.id])).length,
    [attendance]
  )

  const handleDrop = (caregiverId) => {
    if (draggedId) {
      setAssignments(prev => ({ ...prev, [draggedId]: caregiverId }))
      setDraggedId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="今日在場長者" value={totalActive} unit="人" max={29} note={`容量 ${totalActive}/29`} accent="#A53838" />
        <KpiCard label="照服員人數"    value={CAREGIVERS.length} unit="位" note="1:8 比例" accent="#7A9474" />
        <KpiCard label="平均服務數"    value={(totalActive / CAREGIVERS.length).toFixed(1)} unit="人/員" note="未超過 8" accent="#C68B4F" />
        <KpiCard label="今日缺席"      value={RECIPIENTS.length - totalActive} unit="人" note="含住院、回診" accent="#8E6BA8" />
      </div>

      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>即時配對總覽</h2>
            <p className="text-sm mt-1" style={{ color: '#8B6F47' }}>拖曳長者卡片到照服員欄位重新分配 · 點擊長者查看詳細資料</p>
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: '#5C3A1E' }}>
            <LegendDot color="#7A9474" label="出席" />
            <LegendDot color="#D4A574" label="休假" />
            <LegendDot color="#5B7B8C" label="回診" />
            <LegendDot color="#A53838" label="住院" />
            <LegendDot color="#8E6BA8" label="喘息" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {CAREGIVERS.map(cg => {
            const list = counts[cg.id]
            const ratio = list.length / 8
            return (
              <div
                key={cg.id}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(cg.id)}
                className="rounded-xl p-3 border-2 transition-all"
                style={{
                  background: '#FBF6EC',
                  borderColor: draggedId ? '#A53838' : '#E5D5B7',
                  borderStyle: draggedId ? 'dashed' : 'solid',
                  minHeight: 280,
                }}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: '#E5D5B7' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-white" style={{ background: cg.color }}>
                    {cg.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-semibold text-sm" style={{ color: '#5C2828' }}>{cg.name}</div>
                    <div className="text-xs" style={{ color: '#8B6F47' }}>{list.length}/8 人</div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: '#EAE0CC' }}>
                  <div
                    className="h-full transition-all"
                    style={{ width: `${Math.min(ratio * 100, 100)}%`, background: ratio > 1 ? '#A53838' : ratio === 1 ? '#C68B4F' : '#7A9474' }}
                  />
                </div>
                <div className="space-y-1.5">
                  {list.map(r => {
                    const s = STATUS_TYPES[attendance[r.id]]
                    return (
                      <div
                        key={r.id}
                        draggable
                        onDragStart={() => setDraggedId(r.id)}
                        onClick={() => onSelectRecipient(r)}
                        className="rounded-lg px-2.5 py-1.5 cursor-pointer transition-all hover:shadow-md flex items-center justify-between gap-2 group"
                        style={{ background: s.bg, color: s.text }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }}></span>
                          <span className="text-sm font-medium truncate">{r.name}</span>
                        </div>
                        <span className="text-xs font-mono opacity-70 flex-shrink-0">CMS{r.cms}</span>
                      </div>
                    )
                  })}
                  {list.length === 0 && (
                    <div className="text-center py-6 text-xs" style={{ color: '#A09684' }}>尚無分配</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <h3 className="font-display font-semibold mb-3" style={{ color: '#5C2828' }}>今日未到 / 缺席</h3>
        <div className="flex flex-wrap gap-2">
          {RECIPIENTS.filter(r => !['present', 'respite', 'blood'].includes(attendance[r.id])).map(r => {
            const s = STATUS_TYPES[attendance[r.id]]
            return (
              <button
                key={r.id}
                onClick={() => onSelectRecipient(r)}
                className="px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition hover:shadow-sm"
                style={{ background: s.bg, color: s.text }}
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-xs opacity-80">{s.label}</span>
              </button>
            )
          })}
          {RECIPIENTS.filter(r => !['present', 'respite', 'blood'].includes(attendance[r.id])).length === 0 && (
            <p className="text-sm" style={{ color: '#A09684' }}>今日全員到齊</p>
          )}
        </div>
      </div>
    </div>
  )
}

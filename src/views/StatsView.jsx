import { useState, useMemo } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'

function CaregiverDayModal({ data, onClose, onSelectRecipient }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(60,30,15,0.6)' }} onClick={onClose}>
      <div className="rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border-2" style={{ background: '#FFFAF0', borderColor: '#C4A87A' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: '#FBF1DD', borderColor: '#E5D5B7' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-display font-bold text-lg" style={{ background: data.caregiver.color }}>
              {data.caregiver.avatar}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold" style={{ color: '#5C2828' }}>
                {data.caregiver.name} · {data.day.label}（星期{data.day.wd}）
              </h3>
              <p className="text-sm" style={{ color: '#8B6F47' }}>當日服務 {data.recipients.length} 位長者</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-orange-100 transition">
            <X size={20} style={{ color: '#5C2828' }} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.recipients.map(r => (
              <button key={r.id} onClick={() => onSelectRecipient(r)}
                className="text-left p-3 rounded-xl border transition-all hover:shadow-md group"
                style={{ background: '#FBF6EC', borderColor: '#E5D5B7' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display font-semibold" style={{ color: '#5C2828' }}>{r.name}</div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: '#8B6F47' }}>{r.code}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EAE0CC', color: '#5C3A1E' }}>CMS {r.cms}</span>
                    <ChevronRight size={16} style={{ color: '#A53838' }} className="group-hover:translate-x-1 transition" />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.conditions.map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded" style={{ background: '#F5E6D3', color: '#A0541E' }}>{c}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StatsView({ attendance, assignments, onSelectRecipient }) {
  const { recipients: RECIPIENTS, caregivers: CAREGIVERS } = useData()
  const [selectedCg, setSelectedCg] = useState(null)

  const days = useMemo(() => {
    const arr = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dow = d.getDay()
      if (dow === 0 || dow === 6) continue
      arr.push({
        date: d,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        wd: ['日','一','二','三','四','五','六'][dow],
        isToday: i === 0,
      })
    }
    return arr
  }, [])

  const matrix = useMemo(() => {
    const m = {}
    CAREGIVERS.forEach(c => { m[c.id] = {} })
    days.forEach((day, idx) => {
      CAREGIVERS.forEach(cg => {
        if (day.isToday) {
          const list = RECIPIENTS.filter(r =>
            ['present','respite','blood'].includes(attendance[r.id]) && assignments[r.id] === cg.id
          )
          m[cg.id][day.label] = { count: list.length, recipients: list }
        } else {
          const seed = (idx * 13 + cg.id.charCodeAt(1)) % 5
          const count = 5 + seed
          const recs = RECIPIENTS.filter(r => r.primaryCaregiver === cg.id).slice(0, count)
          if (recs.length < count) {
            const extras = RECIPIENTS.filter(r => r.primaryCaregiver !== cg.id)
            for (const r of extras) {
              if (recs.length >= count) break
              recs.push(r)
            }
          }
          m[cg.id][day.label] = { count, recipients: recs.slice(0, count) }
        }
      })
    })
    return m
  }, [days, attendance, assignments, CAREGIVERS, RECIPIENTS])   // ← 補上依賴

  const totals = useMemo(() => {
    const t = {}
    CAREGIVERS.forEach(cg => {
      t[cg.id] = days.reduce((s, d) => s + (matrix[cg.id]?.[d.label]?.count || 0), 0)
    })
    return t
  }, [matrix, days, CAREGIVERS])

  const dayTotals = useMemo(() => {
    const t = {}
    days.forEach(d => {
      t[d.label] = CAREGIVERS.reduce((s, cg) => s + (matrix[cg.id]?.[d.label]?.count || 0), 0)
    })
    return t
  }, [matrix, days, CAREGIVERS])

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>照服員服務統計</h2>
            <p className="text-sm mt-1" style={{ color: '#8B6F47' }}>近 14 個工作日 · 點擊數字可查看當日服務的長者</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider" style={{ color: '#8B6F47' }}>合計服務人次</div>
            <div className="font-display font-bold text-2xl" style={{ color: '#A53838' }}>{grandTotal}</div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 px-3 py-2 text-left font-display font-semibold border-b-2 border-r"
                  style={{ background: '#FBF1DD', color: '#5C2828', borderColor: '#C4A87A' }}>日期</th>
                {CAREGIVERS.map(cg => (
                  <th key={cg.id} className="px-3 py-2 border-b-2 text-center font-display font-semibold"
                    style={{ color: '#5C2828', borderColor: '#C4A87A', minWidth: 90 }}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: cg.color }}>{cg.avatar}</div>
                      {cg.name}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 border-b-2 text-center font-display font-semibold border-l"
                  style={{ color: '#A53838', borderColor: '#C4A87A', background: '#FBF1DD' }}>小計</th>
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day.label} style={{ background: day.isToday ? '#FBE8DC' : 'transparent' }}>
                  <td className="sticky left-0 z-10 px-3 py-2.5 font-medium border-b border-r"
                    style={{ background: day.isToday ? '#FBE8DC' : '#FFFAF0', color: '#5C2828', borderColor: '#EAE0CC' }}>
                    <div className="flex items-center gap-2">
                      <span>{day.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: day.isToday ? '#A53838' : '#EAE0CC', color: day.isToday ? 'white' : '#8B6F47' }}>
                        {day.wd}
                      </span>
                      {day.isToday && <span className="text-xs font-bold" style={{ color: '#A53838' }}>今日</span>}
                    </div>
                  </td>
                  {CAREGIVERS.map(cg => {
                    const cell = matrix[cg.id]?.[day.label] ?? { count: 0, recipients: [] }
                    return (
                      <td key={cg.id} className="px-3 py-2.5 border-b text-center" style={{ borderColor: '#EAE0CC' }}>
                        <button
                          onClick={() => setSelectedCg({ caregiver: cg, day, recipients: cell.recipients })}
                          className="font-display font-semibold text-base hover:underline transition"
                          style={{ color: cell.count >= 8 ? '#A53838' : cell.count === 0 ? '#A09684' : '#5C2828' }}>
                          {cell.count}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-3 py-2.5 border-b text-center font-display font-bold border-l"
                    style={{ background: day.isToday ? '#FBE8DC' : '#FBF1DD', color: '#A53838', borderColor: '#EAE0CC' }}>
                    {dayTotals[day.label]}
                  </td>
                </tr>
              ))}
              <tr style={{ background: '#FBF1DD' }}>
                <td className="sticky left-0 z-10 px-3 py-3 font-display font-bold border-r-2"
                  style={{ background: '#FBF1DD', color: '#5C2828', borderColor: '#C4A87A' }}>合計</td>
                {CAREGIVERS.map(cg => (
                  <td key={cg.id} className="px-3 py-3 text-center font-display font-bold" style={{ color: '#5C2828' }}>
                    {totals[cg.id]}
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-display font-bold text-base border-l-2"
                  style={{ background: '#A53838', color: 'white', borderColor: '#C4A87A' }}>
                  {grandTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {selectedCg && (
        <CaregiverDayModal
          data={selectedCg}
          onClose={() => setSelectedCg(null)}
          onSelectRecipient={r => { setSelectedCg(null); onSelectRecipient(r) }}
        />
      )}
    </div>
  )
}

import { useState, useMemo, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { STATUS_TYPES } from '../data/statusTypes.js'
import { formatDisplayDate } from '../data/monthlyAttendance.js'

const WD = ['日','一','二','三','四','五','六']

// 缺席狀態簡寫（喘息仍算服務中，故顯示照服員而非缺席標記）
const ABSENT_SHORT = {
  rest:    { label: '休', bg: '#F5E6D3', text: '#A0541E' },
  hospital:{ label: '住', bg: '#F0D5D0', text: '#8B2C20' },
  clinic:  { label: '診', bg: '#D8E2EA', text: '#2D4F6A' },
  blood:   { label: '抽', bg: '#EDD8DC', text: '#8B3A4A' },
  holiday: { label: '假', bg: '#F0EBF8', text: '#6A3D8E' },
  absent:  { label: '✕', bg: '#EAE5DA', text: '#6B5D4A' },
}
const ABSENT_SET = new Set(Object.keys(ABSENT_SHORT))

function getDaysInMonth(year, month) {
  const days = [], d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
  return days
}

// ── 共用 style helpers ────────────────────────────────────────
const thBase    = { border: '1px solid #E8E0D0', padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#5C2828', background: '#FBF1DD', whiteSpace: 'nowrap' }
const thDate    = { ...thBase, minWidth: 28, maxWidth: 34 }
const thSticky  = (extra = {}) => ({ ...thBase, position: 'sticky', zIndex: 2, ...extra })
const tdBase    = { border: '1px solid #EDE5D8', padding: '2px 2px', textAlign: 'center', verticalAlign: 'middle' }
const tdSticky  = (bg) => ({ ...tdBase, position: 'sticky', zIndex: 1, background: bg, borderRight: '1px solid #C4A87A' })
const cellStyle = ({ bg, color, fw, cursor = 'default' }) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 22, borderRadius: 5, fontSize: 11, fontWeight: fw, color, background: bg, cursor,
})

export default function StaffingView({
  monthlyAttendance,
  dailyAssignments,
  recipientOrder = [],
  setRecipientOrder,
  holidays = {},
}) {
  const { recipients: RECIPIENTS, caregivers: CAREGIVERS } = useData()
  const today    = new Date()
  const todayStr = formatDisplayDate(today)

  // 照服員查詢 map
  const cgMap = useMemo(() => {
    const m = {}
    CAREGIVERS.forEach(c => { m[c.id] = c })
    return m
  }, [CAREGIVERS])

  // 依共用排序排列
  const SORTED_RECIPIENTS = useMemo(() => {
    const ordered   = recipientOrder.filter(id => RECIPIENTS.find(r => r.id === id))
    const unordered = RECIPIENTS.filter(r => !recipientOrder.includes(r.id))
    return [...ordered.map(id => RECIPIENTS.find(r => r.id === id)), ...unordered].filter(Boolean)
  }, [recipientOrder, RECIPIENTS])

  // 月份導覽
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const prevMonth = () => viewMonth === 1  ? (setViewYear(y => y-1), setViewMonth(12)) : setViewMonth(m => m-1)
  const nextMonth = () => viewMonth === 12 ? (setViewYear(y => y+1), setViewMonth(1))  : setViewMonth(m => m+1)

  const workDays = useMemo(() =>
    getDaysInMonth(viewYear, viewMonth).filter(d => d.getDay() !== 0 && d.getDay() !== 6),
    [viewYear, viewMonth])

  const ROC = viewYear - 1911

  // ── 行拖曳排序 ────────────────────────────────────────────
  const [dragId,     setDragId]     = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [dragAbove,  setDragAbove]  = useState(true)
  const dragNode = useRef(null)
  const handleDragStart = useCallback((e, id) => {
    setDragId(id); dragNode.current = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    requestAnimationFrame(() => { if (dragNode.current) dragNode.current.style.opacity = '0.4' })
  }, [])
  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = ''
    setDragId(null); setDragOverId(null); dragNode.current = null
  }, [])
  const handleDragOver = useCallback((e, id) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'
    if (id === dragId) { setDragOverId(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setDragAbove(e.clientY < rect.top + rect.height / 2); setDragOverId(id)
  }, [dragId])
  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    setRecipientOrder?.(prev => {
      const base = SORTED_RECIPIENTS.map(r => r.id)
      const fromIdx = base.indexOf(dragId), toIdx = base.indexOf(targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...base]; next.splice(fromIdx, 1)
      const insertAt = dragAbove ? toIdx : toIdx + 1
      next.splice(insertAt > fromIdx ? insertAt - 1 : insertAt, 0, dragId)
      return next
    })
    setDragId(null); setDragOverId(null)
  }, [dragId, dragAbove, SORTED_RECIPIENTS, setRecipientOrder])

  // ── 合計：每位長者本月服務天數 ────────────────────────────
  const recipientTotals = useMemo(() => {
    const t = {}
    RECIPIENTS.forEach(r => {
      t[r.id] = workDays.filter(d => {
        const dk = formatDisplayDate(d)
        const status = monthlyAttendance[dk]?.[r.id] ?? (holidays[dk] ? 'holiday' : '')
        return !ABSENT_SET.has(status)  // 未設定或出席 → 算一天
      }).length
    })
    return t
  }, [monthlyAttendance, workDays, RECIPIENTS, holidays])

  // ── 月度照服員服務日統計 ──────────────────────────────────
  const cgMonthlySummary = useMemo(() => {
    const t = {}
    CAREGIVERS.forEach(c => { t[c.id] = 0 })
    RECIPIENTS.forEach(r => {
      workDays.forEach(d => {
        const dk = formatDisplayDate(d)
        const status = monthlyAttendance[dk]?.[r.id] ?? (holidays[dk] ? 'holiday' : '')
        if (!ABSENT_SET.has(status)) {
          const cgId = dailyAssignments[dk]?.[r.id] ?? r.primaryCaregiver
          if (t[cgId] !== undefined) t[cgId]++
        }
      })
    })
    return t
  }, [monthlyAttendance, dailyAssignments, workDays, RECIPIENTS, CAREGIVERS, holidays])

  return (
    <div className="space-y-4">
      {/* ── 標題列 ── */}
      <div className="rounded-2xl p-4 border flex flex-wrap items-center gap-4 justify-between"
        style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div>
          <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>月度人力服務表</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8B6F47' }}>
            雲林縣家園關懷協會附設雲林縣私立紅蘋果社區式服務類長期照顧服務機構
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#8B6F47' }}>
            每格顯示當日負責照服員（含喘息服務）· 未設定配對日期以主責照服員顯示 · 橫向滑動查看全月
          </p>
        </div>

        {/* 月份切換 */}
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="p-2 rounded-full hover:bg-orange-100 transition" style={{ color: '#5C2828' }}>
            <ChevronLeft size={20} />
          </button>
          <div className="text-center min-w-[120px]">
            <div className="font-display font-bold text-lg" style={{ color: '#A53838' }}>
              民國 {ROC} 年 {viewMonth} 月
            </div>
            <div className="text-xs" style={{ color: '#8B6F47' }}>共 {workDays.length} 個工作日</div>
          </div>
          <button onClick={nextMonth}
            className="p-2 rounded-full hover:bg-orange-100 transition" style={{ color: '#5C2828' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 照服員色碼圖例 */}
        <div className="flex flex-wrap gap-1.5">
          {CAREGIVERS.map(cg => (
            <span key={cg.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: cg.color + '22', color: cg.color, border: `1px solid ${cg.color}55` }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: cg.color, fontSize: 10 }}>{cg.avatar}</span>
              {cg.name}
            </span>
          ))}
          {Object.entries(ABSENT_SHORT).map(([k, s]) => (
            <span key={k}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: s.bg, color: s.text }}>
              {s.label} {STATUS_TYPES[k]?.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── 月度服務統計摘要 ── */}
      <div className="rounded-2xl p-4 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <h3 className="font-display font-semibold text-sm mb-3" style={{ color: '#5C2828' }}>
          本月照服員服務人次統計
        </h3>
        <div className="flex flex-wrap gap-3">
          {CAREGIVERS.map(cg => (
            <div key={cg.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: cg.color + '15', border: `1px solid ${cg.color}44` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: cg.color }}>{cg.avatar}</div>
              <div>
                <div className="text-xs font-semibold" style={{ color: cg.color }}>{cg.name}</div>
                <div className="text-xs" style={{ color: '#8B6F47' }}>
                  <span className="font-bold text-sm" style={{ color: cg.color }}>{cgMonthlySummary[cg.id] ?? 0}</span> 人次
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 月度人力表格 ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5D5B7' }}>
        <div className="overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 'max-content', fontSize: 12 }}>

            {/* 表頭 */}
            <thead>
              <tr style={{ background: '#FBF1DD' }}>
                <th style={thSticky({ minWidth: 22, padding: '4px 2px' })}></th>
                <th style={thSticky({ minWidth: 28, left: 22 })}>序</th>
                <th style={thSticky({ minWidth: 80, left: 50 })}>姓名</th>
                {workDays.map(d => {
                  const dk = formatDisplayDate(d)
                  const holi = holidays[dk]
                  const isToday = dk === todayStr
                  return (
                    <th key={dk} style={{
                      ...thDate,
                      color:      isToday ? '#A53838' : holi ? '#8E6BA8' : '#5C2828',
                      background: isToday ? '#FBE8DC' : holi ? '#F0EBF8' : '#FBF1DD',
                      fontWeight: isToday ? 700 : 600,
                    }}>
                      <div>{d.getDate()}</div>
                      <div style={{ fontSize: 10, fontWeight: 400 }}>
                        {holi ? holi.slice(0, 2) : WD[d.getDay()]}
                      </div>
                    </th>
                  )
                })}
                <th style={{ ...thBase, background: '#A53838', color: 'white', minWidth: 44, borderLeft: '2px solid #C4A87A' }}>
                  出席<br />天數
                </th>
              </tr>
            </thead>

            {/* 表身 */}
            <tbody>
              {SORTED_RECIPIENTS.map((r, idx) => {
                const rowBg  = idx % 2 === 0 ? '#FFFFFF' : '#FFFAF0'
                const isOver = dragOverId === r.id
                const isDrag = dragId === r.id
                return (
                  <tr key={r.id}
                    draggable
                    onDragStart={e => handleDragStart(e, r.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleDragOver(e, r.id)}
                    onDrop={e => handleDrop(e, r.id)}
                    style={{
                      opacity: isDrag ? 0.4 : 1,
                      borderTop:    isOver && dragAbove  ? '2.5px solid #A53838' : undefined,
                      borderBottom: isOver && !dragAbove ? '2.5px solid #A53838' : undefined,
                    }}>
                    {/* 把手 */}
                    <td style={{ ...tdSticky(rowBg), left: 0, minWidth: 22, padding: '2px', textAlign: 'center', cursor: 'grab' }}>
                      <GripVertical size={13} style={{ color: '#C4A87A' }} />
                    </td>
                    {/* 序號 */}
                    <td style={{ ...tdSticky(rowBg), left: 22, minWidth: 28, color: '#A09684', textAlign: 'center' }}>
                      {idx + 1}
                    </td>
                    {/* 姓名 */}
                    <td style={{ ...tdSticky(rowBg), left: 50, minWidth: 80 }}>
                      <div style={{ fontWeight: 600, color: '#5C2828' }}>{r.name}</div>
                      <div style={{ fontSize: 9, color: '#A09684', fontFamily: 'monospace' }}>{r.code}</div>
                    </td>

                    {/* 每日格子 */}
                    {workDays.map(d => {
                      const dk     = formatDisplayDate(d)
                      const holi   = holidays[dk]
                      const isToday = dk === todayStr
                      const rawStatus = monthlyAttendance[dk]?.[r.id]
                      const status    = rawStatus ?? (holi ? 'holiday' : '')

                      // 缺席 → 顯示缺席標籤
                      if (ABSENT_SET.has(status)) {
                        const s = ABSENT_SHORT[status]
                        return (
                          <td key={dk} style={{ ...tdBase, background: isToday ? '#FFF5F0' : rowBg }}>
                            <div style={cellStyle({ bg: s.bg, color: s.text, fw: 700 })}>
                              {s.label}
                            </div>
                          </td>
                        )
                      }

                      // 出席/未設定 → 顯示照服員
                      const cgId = dailyAssignments[dk]?.[r.id] ?? r.primaryCaregiver
                      const cg   = cgMap[cgId]
                      return (
                        <td key={dk} style={{ ...tdBase, background: isToday ? '#F0FBF0' : rowBg }}>
                          {cg ? (
                            <div style={cellStyle({ bg: cg.color + '25', color: cg.color, fw: 700 })}
                              title={`${cg.name}（${dk}）`}>
                              {cg.avatar}
                            </div>
                          ) : (
                            <div style={cellStyle({ bg: '#EAE5DA', color: '#A09684', fw: 400 })}>·</div>
                          )}
                        </td>
                      )
                    })}

                    {/* 出席合計 */}
                    <td style={{ ...tdBase, background: '#FBF1DD', fontWeight: 700, color: '#A53838',
                      textAlign: 'center', fontSize: 13, borderLeft: '2px solid #E5D5B7' }}>
                      {recipientTotals[r.id] || ''}
                    </td>
                  </tr>
                )
              })}

              {/* 每日人數合計列 */}
              <tr style={{ background: '#FBF1DD', borderTop: '2px solid #C4A87A' }}>
                <td colSpan={3}
                  style={{ ...tdSticky('#FBF1DD'), left: 0, fontWeight: 700, color: '#5C2828',
                    fontSize: 11, textAlign: 'center', borderRight: '2px solid #C4A87A' }}>
                  服務人數
                </td>
                {workDays.map(d => {
                  const dk = formatDisplayDate(d)
                  const isToday = dk === todayStr
                  const cnt = RECIPIENTS.filter(r => {
                    const status = monthlyAttendance[dk]?.[r.id] ?? (holidays[dk] ? 'holiday' : '')
                    return !ABSENT_SET.has(status)
                  }).length
                  return (
                    <td key={dk} style={{ ...tdBase, fontWeight: 700, color: '#A53838', textAlign: 'center',
                      fontSize: 13, background: isToday ? '#FBE8DC' : '#FBF1DD' }}>
                      {cnt || ''}
                    </td>
                  )
                })}
                <td style={{ ...tdBase, background: '#FBF1DD', borderLeft: '2px solid #E5D5B7' }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

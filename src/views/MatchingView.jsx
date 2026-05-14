import { useState, useMemo, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, X, AlertCircle } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { STATUS_TYPES } from '../data/statusTypes.js'
import { TW_HOLIDAYS, formatDisplayDate } from '../data/monthlyAttendance.js'
import KpiCard from '../components/KpiCard.jsx'
import LegendDot from '../components/LegendDot.jsx'

const WD     = ['日','一','二','三','四','五','六']
const TODAY  = new Date()
TODAY.setHours(0, 0, 0, 0)
const todayStr = formatDisplayDate(TODAY)

// ── 日期工具 ────────────────────────────────────────────
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const sameDay = (a, b) => formatDisplayDate(a) === formatDisplayDate(b)

function getDaysInMonth(year, month) {
  const days = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
  return days
}

const isWeekend  = (d) => d.getDay() === 0 || d.getDay() === 6
const isHoliday  = (d) => !!TW_HOLIDAYS[formatDisplayDate(d)]
const isWorkDay  = (d) => !isWeekend(d)

// ── 日曆選擇器 ──────────────────────────────────────────
function CalendarPicker({ selected, onSelect, onClose }) {
  const [viewYear,  setViewYear]  = useState(selected.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getMonth() + 1)

  const prevMonth = () => viewMonth === 1  ? (setViewYear(y => y-1), setViewMonth(12)) : setViewMonth(m => m-1)
  const nextMonth = () => viewMonth === 12 ? (setViewYear(y => y+1), setViewMonth(1))  : setViewMonth(m => m+1)

  const allDays  = getDaysInMonth(viewYear, viewMonth)
  const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay()
  const blanks   = Array(firstDow).fill(null)

  return (
    <div className="absolute top-full left-0 mt-2 z-50 rounded-2xl border-2 overflow-hidden shadow-2xl"
      style={{ background: '#FFFAF0', borderColor: '#C4A87A', minWidth: 320 }}>
      {/* 月份導覽 */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ background: '#FBF1DD', borderColor: '#E5D5B7' }}>
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-orange-100 transition">
          <ChevronLeft size={18} style={{ color: '#5C2828' }} />
        </button>
        <span className="font-display font-semibold text-sm" style={{ color: '#5C2828' }}>
          {viewYear} 年 {viewMonth} 月
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-orange-100 transition">
          <ChevronRight size={18} style={{ color: '#5C2828' }} />
        </button>
      </div>

      {/* 星期列 */}
      <div className="grid grid-cols-7 px-3 pt-3 pb-1">
        {WD.map(w => (
          <div key={w} className="text-center text-xs font-medium py-1"
            style={{ color: w === '日' || w === '六' ? '#C4A87A' : '#8B6F47' }}>{w}</div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {allDays.map(d => {
          const dk       = formatDisplayDate(d)
          const isToday  = dk === todayStr
          const isSel    = sameDay(d, selected)
          const isWknd   = isWeekend(d)
          const isHoli   = isHoliday(d)
          const isPast   = d < TODAY

          return (
            <button key={dk}
              onClick={() => { onSelect(d); onClose() }}
              className="w-full aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all hover:scale-105"
              style={{
                background:  isSel   ? '#A53838' : isToday ? '#FBE8DC' : 'transparent',
                color:       isSel   ? 'white'
                           : isWknd  ? '#C4A87A'
                           : isHoli  ? '#8E6BA8'
                           : isPast  ? '#8B6F47'
                           : '#5C2828',
                fontWeight:  isSel || isToday ? 700 : 400,
                border:      isToday && !isSel ? '1.5px solid #A53838' : '1.5px solid transparent',
              }}>
              {d.getDate()}
              {isHoli && !isSel && (
                <span className="text-[8px] leading-none" style={{ color: '#8E6BA8' }}>假</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 圖例 */}
      <div className="flex gap-3 px-4 pb-3 text-xs" style={{ color: '#8B6F47' }}>
        <span>今日 <span className="inline-block w-3 h-3 rounded border align-middle" style={{ borderColor: '#A53838' }}></span></span>
        <span style={{ color: '#8E6BA8' }}>■ 國定假日</span>
        <span style={{ color: '#C4A87A' }}>■ 週末</span>
      </div>
    </div>
  )
}

// ── 拖曳常數 ────────────────────────────────────────────
const THRESHOLD = 8

// ── 主元件 ──────────────────────────────────────────────
export default function MatchingView({
  monthlyAttendance, setMonthlyAttendance,
  dailyAssignments, setDailyAssignments, defaultAssignments,
  onSelectRecipient,
}) {
  const { recipients, caregivers } = useData()

  // 選擇的日期
  const [selectedDate, setSelectedDate]   = useState(new Date(TODAY))
  const [showCalendar, setShowCalendar]   = useState(false)
  const calRef = useRef(null)

  const dateStr  = formatDisplayDate(selectedDate)
  const isToday  = dateStr === todayStr
  const isFuture = selectedDate > TODAY

  // 當日出缺席
  const attendance = monthlyAttendance[dateStr] ?? {}

  // 當日照服員配對（若無記錄，使用主責預設值）
  const assignments = dailyAssignments[dateStr] ?? defaultAssignments()

  const setAssignments = useCallback((updater) => {
    setDailyAssignments(prev => {
      const current = prev[dateStr] ?? defaultAssignments()
      return {
        ...prev,
        [dateStr]: typeof updater === 'function' ? updater(current) : updater,
      }
    })
  }, [dateStr, setDailyAssignments, defaultAssignments])

  // 當日出缺席更新
  const setDayAttendance = useCallback((recipientId, status) => {
    setMonthlyAttendance(prev => ({
      ...prev,
      [dateStr]: { ...(prev[dateStr] ?? {}), [recipientId]: status },
    }))
  }, [dateStr, setMonthlyAttendance])

  // ── 日期導覽 ────────────────────────────────────────
  const prevDay = () => {
    const d = addDays(selectedDate, -1)
    while (isWeekend(d)) d.setDate(d.getDate() - 1)
    setSelectedDate(new Date(d))
    setShowCalendar(false)
  }
  const nextDay = () => {
    const d = addDays(selectedDate, 1)
    while (isWeekend(d)) d.setDate(d.getDate() + 1)
    setSelectedDate(new Date(d))
    setShowCalendar(false)
  }

  // ── 資料計算 ────────────────────────────────────────
  const counts = useMemo(() => {
    const map = {}
    caregivers.forEach(c => { map[c.id] = [] })
    recipients.forEach(r => {
      if (['present','respite'].includes(attendance[r.id])) {
        const cgId = assignments[r.id]
        if (cgId && map[cgId]) map[cgId].push(r)
      }
    })
    return map
  }, [attendance, assignments, recipients, caregivers])

  const totalActive = useMemo(() =>
    recipients.filter(r => ['present','respite'].includes(attendance[r.id])).length,
    [attendance, recipients]
  )

  // ── 上限提示 Toast ───────────────────────────────────
  const [toast, setToast]    = useState(null)
  const toastTimer           = useRef(null)

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Pointer Events 拖曳 ─────────────────────────────
  const [draggedId, setDraggedId] = useState(null)
  const drag = useRef({ id: null, ghost: null, offsetX: 0, offsetY: 0, startX: 0, startY: 0, moved: false })

  const spawnGhost = (el, cx, cy) => {
    const rect = el.getBoundingClientRect()
    const g    = el.cloneNode(true)
    Object.assign(g.style, {
      position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${rect.width}px`, zIndex: '9999', opacity: '0.88',
      pointerEvents: 'none', borderRadius: '8px',
      boxShadow: '0 10px 28px rgba(92,40,40,0.3)', transform: 'scale(1.07)',
    })
    document.body.appendChild(g)
    drag.current.ghost   = g
    drag.current.offsetX = cx - rect.left
    drag.current.offsetY = cy - rect.top
  }
  const killGhost = () => { if (drag.current.ghost) { drag.current.ghost.remove(); drag.current.ghost = null } }

  const onPtrDown = useCallback((e, recipientId) => {
    if (e.button !== undefined && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: recipientId, ghost: null, startX: e.clientX, startY: e.clientY, offsetX: 0, offsetY: 0, moved: false }
  }, [])

  const onPtrMove = useCallback((e) => {
    if (!drag.current.id) return
    const dx = e.clientX - drag.current.startX, dy = e.clientY - drag.current.startY
    if (!drag.current.moved && Math.sqrt(dx*dx + dy*dy) > THRESHOLD) {
      drag.current.moved = true
      const el = document.querySelector(`[data-recipient-id="${drag.current.id}"]`)
      if (el) spawnGhost(el, drag.current.startX, drag.current.startY)
      setDraggedId(drag.current.id)
    }
    if (drag.current.moved && drag.current.ghost) {
      drag.current.ghost.style.left = `${e.clientX - drag.current.offsetX}px`
      drag.current.ghost.style.top  = `${e.clientY - drag.current.offsetY}px`
    }
  }, [])

  const onPtrUp = useCallback((e) => {
    const { id, moved } = drag.current
    killGhost(); setDraggedId(null); drag.current.id = null; drag.current.moved = false
    if (!id) return
    if (moved) {
      const els    = document.elementsFromPoint(e.clientX, e.clientY)
      const target = els.find(el => el.dataset.caregiverId)
      if (target) {
        const cgId   = target.dataset.caregiverId
        const curLen = counts[cgId]?.length ?? 0
        const alreadyHere = assignments[id] === cgId

        // 若非同一欄且目標已滿 8 人 → 拒絕並顯示 toast
        if (!alreadyHere && curLen >= 8) {
          const cgName = caregivers.find(c => c.id === cgId)?.name ?? '該照服員'
          showToast(`${cgName}服務的長者數量已達 8 位上限，請重新選擇。`)
        } else {
          setAssignments(prev => ({ ...prev, [id]: cgId }))
        }
      }
    } else {
      const r = recipients.find(x => x.id === id)
      if (r) onSelectRecipient(r)
    }
  }, [recipients, caregivers, counts, assignments, setAssignments, onSelectRecipient, showToast])

  const isDragging = draggedId !== null
  const holiday    = TW_HOLIDAYS[dateStr]

  // 格式化顯示日期
  const displayDate = (() => {
    const d = selectedDate
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} 星期${WD[d.getDay()]}`
  })()

  return (
    <div className="space-y-4">

      {/* ── 超配 Toast 提示 ── */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 z-[9999] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl"
          style={{
            transform: 'translateX(-50%)',
            background: '#FBE8DC',
            border: '2px solid #A53838',
            maxWidth: 420,
            width: 'calc(100vw - 48px)',
            animation: 'slideDown 0.25s ease',
          }}
        >
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#A53838' }} />
          <p className="flex-1 text-sm font-medium" style={{ color: '#5C2828' }}>{toast}</p>
          <button onClick={() => setToast(null)} className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition">
            <X size={16} style={{ color: '#A53838' }} />
          </button>
        </div>
      )}

      {/* ── 日期選擇列 ── */}
      <div className="rounded-2xl p-4 border flex flex-wrap items-center gap-3 justify-between"
        style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>

        {/* 導覽 */}
        <div className="flex items-center gap-2">
          <button onClick={prevDay}
            className="p-2 rounded-xl hover:bg-orange-100 transition border"
            style={{ borderColor: '#E5D5B7', color: '#5C2828' }}>
            <ChevronLeft size={18} />
          </button>

          {/* 日期顯示 + 日曆開關 */}
          <div className="relative" ref={calRef}>
            <button
              onClick={() => setShowCalendar(s => !s)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition hover:bg-orange-50"
              style={{ borderColor: isToday ? '#A53838' : '#C4A87A',
                       background: isToday ? '#FBE8DC' : '#FFFAF0', color: '#5C2828' }}>
              <CalendarDays size={16} style={{ color: '#A53838' }} />
              <span className="font-display font-semibold text-base">{displayDate}</span>
              {isToday  && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: '#A53838', color: 'white' }}>今日</span>}
              {isFuture && <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: '#E2D5E8', color: '#5C2D6A' }}>預排</span>}
              {holiday  && <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: '#F0EBF8', color: '#8E6BA8' }}>{holiday}</span>}
            </button>

            {showCalendar && (
              <CalendarPicker
                selected={selectedDate}
                onSelect={setSelectedDate}
                onClose={() => setShowCalendar(false)}
              />
            )}
          </div>

          <button onClick={nextDay}
            className="p-2 rounded-xl hover:bg-orange-100 transition border"
            style={{ borderColor: '#E5D5B7', color: '#5C2828' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 今日快速跳轉 */}
        {!isToday && (
          <button onClick={() => setSelectedDate(new Date(TODAY))}
            className="text-sm px-3 py-1.5 rounded-lg transition hover:shadow-sm"
            style={{ background: '#FBE8DC', color: '#A53838', border: '1px solid #C4A87A' }}>
            回到今天
          </button>
        )}

        {/* 說明 */}
        <p className="text-sm w-full" style={{ color: '#8B6F47' }}>
          拖曳卡片到照服員欄位重新分配（電腦或手機均可）· 點擊長者查看詳細資料
          {isFuture && ' · 此為預排日期，出缺席狀態可提前設定'}
        </p>
      </div>

      {/* ── KPI 列 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={`${isToday ? '今日' : '當日'}在場長者`} value={totalActive} unit="人" max={29}
          note={`容量 ${totalActive}/29`} accent="#A53838" />
        <KpiCard label="照服員人數" value={caregivers.length} unit="位" note="1:8 比例" accent="#7A9474" />
        <KpiCard label="平均服務數" value={caregivers.length ? (totalActive / caregivers.length).toFixed(1) : 0}
          unit="人/員" note="未超過 8" accent="#C68B4F" />
        <KpiCard label={`${isToday ? '今日' : '當日'}缺席`} value={recipients.length - totalActive} unit="人"
          note="含住院、回診" accent="#8E6BA8" />
      </div>

      {/* ── 照服員欄位格線 ── */}
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>
              配對總覽
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <LegendDot color="#7A9474" label="出席" />
            <LegendDot color="#D4A574" label="休假" />
            <LegendDot color="#5B7B8C" label="回診" />
            <LegendDot color="#A53838" label="住院" />
            <LegendDot color="#8E6BA8" label="喘息" />
          </div>
        </div>

        {isDragging && (
          <div className="mb-3 px-4 py-2 rounded-xl text-sm font-medium text-center"
            style={{ background: '#FBE8DC', color: '#A53838', border: '1.5px dashed #A53838' }}>
            拖曳到照服員欄位後放開以重新分配
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {caregivers.map(cg => {
            const list  = counts[cg.id] ?? []
            const ratio = list.length / 8
            return (
              <div key={cg.id}
                data-caregiver-id={cg.id}
                className="rounded-xl p-3 border-2 transition-all"
                style={{
                  background:  '#FBF6EC',
                  borderColor: isDragging ? '#A53838' : '#E5D5B7',
                  borderStyle: isDragging ? 'dashed' : 'solid',
                  minHeight:   260,
                }}>
                {/* 照服員頭 */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: '#E5D5B7' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: cg.color }}>{cg.avatar}</div>
                  <div className="flex-1">
                    <div className="font-display font-semibold text-sm" style={{ color: '#5C2828' }}>{cg.name}</div>
                    <div className="text-xs" style={{ color: ratio > 1 ? '#A53838' : '#8B6F47' }}>
                      {list.length}/8 人{ratio > 1 && ' ⚠ 超配'}
                    </div>
                  </div>
                </div>

                {/* 進度條 */}
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: '#EAE0CC' }}>
                  <div className="h-full transition-all"
                    style={{ width: `${Math.min(ratio*100,100)}%`,
                             background: ratio > 1 ? '#A53838' : ratio >= 0.75 ? '#C68B4F' : '#7A9474' }} />
                </div>

                {/* 長者卡片 */}
                <div className="space-y-1.5">
                  {list.map(r => {
                    const s = STATUS_TYPES[attendance[r.id]] ?? STATUS_TYPES.present
                    return (
                      <div key={r.id}
                        data-recipient-id={r.id}
                        onPointerDown={e => onPtrDown(e, r.id)}
                        onPointerMove={onPtrMove}
                        onPointerUp={onPtrUp}
                        className="rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 select-none"
                        style={{
                          background:  s.bg, color: s.text,
                          opacity:     draggedId === r.id ? 0.3 : 1,
                          cursor:      'grab', touchAction: 'none',
                        }}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                          <span className="text-sm font-medium truncate">{r.name}</span>
                        </div>
                        <span className="text-xs font-mono opacity-70 flex-shrink-0">CMS{r.cms}</span>
                      </div>
                    )
                  })}
                  {list.length === 0 && (
                    <div className="text-center py-6 text-xs" style={{ color: '#A09684' }}>
                      {isDragging ? '放開此處分配' : '尚無分配'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 出缺席快速切換 ── */}
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <h3 className="font-display font-semibold mb-3" style={{ color: '#5C2828' }}>
          當日出缺席快速設定
          <span className="ml-2 text-sm font-normal" style={{ color: '#8B6F47' }}>
            — 點擊長者名稱後的狀態圓點切換
          </span>
        </h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#FBF1DD' }}>
                {['長者姓名','狀態','長者姓名','狀態'].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-display font-semibold text-xs"
                    style={{ color: '#5C2828' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(recipients.length / 2) }).map((_, row) => {
                const left  = recipients[row * 2]
                const right = recipients[row * 2 + 1]
                return (
                  <tr key={row} className="border-t" style={{ borderColor: '#EAE0CC' }}>
                    {[left, right].map((r, col) => r ? (
                      <>
                        <td key={`n${col}`} className="px-3 py-2">
                          <button onClick={() => onSelectRecipient(r)}
                            className="font-display font-medium hover:underline"
                            style={{ color: '#5C2828' }}>{r.name}</button>
                        </td>
                        <td key={`s${col}`} className="px-3 py-2">
                          <div className="flex gap-1">
                            {Object.entries(STATUS_TYPES).map(([key, st]) => {
                              const active = (attendance[r.id] ?? 'present') === key
                              return (
                                <button key={key}
                                  onClick={() => setDayAttendance(r.id, key)}
                                  title={st.label}
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                                  style={{
                                    background: active ? st.dot : '#FBF6EC',
                                    color:      active ? 'white' : st.text,
                                    border:     `1.5px solid ${st.dot}`,
                                  }}>
                                  {st.short.length > 1 ? st.short[0] : st.short}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td key={`n${col}`} /><td key={`s${col}`} />
                      </>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

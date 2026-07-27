import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, GripVertical, CheckCheck, RotateCcw } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { STATUS_TYPES } from '../data/statusTypes.js'
import { formatDisplayDate } from '../data/monthlyAttendance.js'
import { inCareDuringMonth } from '../utils/careWindow.js'

// 月度表用的短符號（含假日）
const SHORT = {
  present:  { label: '✓', bg: '#DFF0E0', text: '#2E6E3E' },
  am:       { label: '上', bg: '#E4F2E4', text: '#2D6B2D' },  // 上午半天
  pm:       { label: '下', bg: '#E0EDF8', text: '#1A4D6B' },  // 下午半天
  rest:     { label: '休', bg: '#F5E6D3', text: '#A0541E' },
  hospital: { label: '住', bg: '#F0D5D0', text: '#8B2C20' },
  clinic:   { label: '診', bg: '#D8E2EA', text: '#2D4F6A' },
  blood:    { label: '抽', bg: '#EDD8DC', text: '#8B3A4A' },
  respite:  { label: '喘', bg: '#E2D5E8', text: '#5C2D6A' },
  holiday:  { label: '假', bg: '#F0EBF8', text: '#6A3D8E' },
  absent:   { label: '✕', bg: '#EAE5DA', text: '#6B5D4A' },
}

// 狀態循環：假日日期從 holiday 開始，一般日從 present 開始
const STATUS_CYCLE      = ['present', 'am', 'pm', 'rest', 'hospital', 'clinic', 'blood', 'respite', 'holiday', 'absent', '']
const STATUS_CYCLE_HOLI = ['holiday', 'present', 'am', 'pm', 'rest', 'hospital', 'clinic', 'blood', 'respite', 'absent', '']

const WD = ['日','一','二','三','四','五','六']

function getDaysInMonth(year, month) {
  const days = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

export default function MonthlyView({
  monthlyAttendance, setMonthlyAttendance,
  recipientOrder = [], setRecipientOrder,
  holidays = {},
  ensureMonthLoaded,
}) {
  const { recipients: ALL_RECIPIENTS } = useData()
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)

  // 月份感知名單：依開案/結案日期，只顯示「該月份在案」的長者
  // - 6月開案的新案 → 5月(含)以前的月份不顯示
  // - 5/26 結案的個案 → 5月仍顯示（當月仍在案）、6月起不顯示
  const RECIPIENTS = useMemo(
    () => ALL_RECIPIENTS.filter(r => inCareDuringMonth(r, viewYear, viewMonth)),
    [ALL_RECIPIENTS, viewYear, viewMonth]
  )

  // 切換月份時，自動向雲端載入該月點名資料（解決「切月份看不到歷史點名」）
  useEffect(() => { ensureMonthLoaded?.(viewYear, viewMonth) }, [viewYear, viewMonth, ensureMonthLoaded])

  // 依共用 recipientOrder 排列（新增長者接在最後）
  const SORTED_RECIPIENTS = useMemo(() => {
    const ordered  = recipientOrder.filter(id => RECIPIENTS.find(r => r.id === id))
    const unordered = RECIPIENTS.filter(r => !recipientOrder.includes(r.id))
    return [...ordered.map(id => RECIPIENTS.find(r => r.id === id)), ...unordered].filter(Boolean)
  }, [recipientOrder, RECIPIENTS])

  // ── 行拖曳排序 ──────────────────────────────────────────
  const [dragId,     setDragId]     = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [dragAbove,  setDragAbove]  = useState(true)
  const dragNode = useRef(null)

  const handleDragStart = useCallback((e, id) => {
    setDragId(id)
    dragNode.current = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    requestAnimationFrame(() => { if (dragNode.current) dragNode.current.style.opacity = '0.4' })
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = ''
    setDragId(null); setDragOverId(null); dragNode.current = null
  }, [])

  const handleDragOver = useCallback((e, id) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id === dragId) { setDragOverId(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setDragAbove(e.clientY < rect.top + rect.height / 2)
    setDragOverId(id)
  }, [dragId])

  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    setRecipientOrder?.(prev => {
      const base = SORTED_RECIPIENTS.map(r => r.id)
      const fromIdx = base.indexOf(dragId)
      const toIdx   = base.indexOf(targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...base]
      next.splice(fromIdx, 1)
      const insertAt = dragAbove ? toIdx : toIdx + 1
      next.splice(insertAt > fromIdx ? insertAt - 1 : insertAt, 0, dragId)
      return next
    })
    setDragId(null); setDragOverId(null)
  }, [dragId, dragAbove, SORTED_RECIPIENTS, setRecipientOrder])

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  // 當月所有工作日（含假日，但排除週末）
  const workDays = useMemo(() =>
    getDaysInMonth(viewYear, viewMonth).filter(d => d.getDay() !== 0 && d.getDay() !== 6),
    [viewYear, viewMonth]
  )

  const todayStr = formatDisplayDate(today)

  // 點擊格子循環切換狀態（假日日期使用 holiday 優先的循環）
  const toggleStatus = (recipientId, d) => {
    const dk    = formatDisplayDate(d)
    const holi  = holidays[dk]
    const cur   = monthlyAttendance[dk]?.[recipientId] ?? (holi ? 'holiday' : '')
    const cycle = holi ? STATUS_CYCLE_HOLI : STATUS_CYCLE
    const idx   = cycle.indexOf(cur)
    const next  = cycle[(idx + 1) % cycle.length]
    setMonthlyAttendance(prev => ({
      ...prev,
      [dk]: { ...(prev[dk] ?? {}), [recipientId]: next },
    }))
  }

  // 計算某長者某日的出席天數（1.0=全天, 0.5=半天, 0=缺席）
  const getDayValue = useCallback((date, recipientId) => {
    const status = monthlyAttendance[date]?.[recipientId]
    const holi   = holidays[date]
    const d      = new Date(date.replace(/\//g, '-'))
    d.setHours(0, 0, 0, 0)
    const isFuture = d > today
    if (!status) {
      // 未設定：過去/今天非假日 → 視同全天出席
      return (!holi && !isFuture) ? 1.0 : 0
    }
    return STATUS_TYPES[status]?.days ?? 0
  }, [monthlyAttendance, holidays, today])

  // 判斷「實際出席」（出席天數 > 0 即算有出席）
  const isActuallyPresent = useCallback((date, recipientId) =>
    getDayValue(date, recipientId) > 0,
  [getDayValue])

  // 每位長者本月出席天數（含半天計 0.5）
  const recipientTotals = useMemo(() => {
    const t = {}
    RECIPIENTS.forEach(r => {
      const total = workDays.reduce((sum, d) =>
        sum + getDayValue(formatDisplayDate(d), r.id), 0)
      t[r.id] = Number.isInteger(total) ? total : total.toFixed(1)
    })
    return t
  }, [monthlyAttendance, workDays, RECIPIENTS, getDayValue])

  // 每日在場人數（半天算 0.5 人次）
  const dayTotals = useMemo(() => {
    const t = {}
    workDays.forEach(d => {
      const dk = formatDisplayDate(d)
      const cnt = RECIPIENTS.reduce((sum, r) => sum + getDayValue(dk, r.id), 0)
      t[dk] = Number.isInteger(cnt) ? cnt : cnt.toFixed(1)
    })
    return t
  }, [monthlyAttendance, workDays, RECIPIENTS, getDayValue])

  // ── 備份 / 復原機制 ──────────────────────────────────────
  const monthKey = `${viewYear}/${String(viewMonth).padStart(2, '0')}`
  const UNDO_KEY = 'redapple_attendance_undo'
  const [undoInfo, setUndoInfo] = useState(() => {
    try {
      const raw = localStorage.getItem(UNDO_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  // 備份目前檢視月份的點名狀態（執行大量變更前呼叫）
  const saveSnapshot = useCallback(() => {
    const snap = {}
    Object.entries(monthlyAttendance).forEach(([date, day]) => {
      if (date.startsWith(monthKey)) snap[date] = { ...day }
    })
    const info = { monthKey, savedAt: new Date().toLocaleString('zh-TW'), data: snap }
    try { localStorage.setItem(UNDO_KEY, JSON.stringify(info)) } catch {}
    setUndoInfo(info)
  }, [monthlyAttendance, monthKey])

  // 復原到備份時的狀態（差異會同步回雲端）
  const restoreSnapshot = useCallback(() => {
    if (!undoInfo || undoInfo.monthKey !== monthKey) return
    if (!window.confirm(
      `確定要將 ${undoInfo.monthKey} 的點名復原到備份時（${undoInfo.savedAt}）的狀態嗎？\n\n備份之後所做的變更將被還原。`
    )) return
    const data = undoInfo.data || {}
    setMonthlyAttendance(prev => {
      const next = { ...prev }
      // 該月現有日期：以備份為準（備份沒有的標記清為空白）
      Object.keys(prev).forEach(date => {
        if (!date.startsWith(monthKey)) return
        const snapDay = data[date] || {}
        const merged = {}
        Object.keys(prev[date] || {}).forEach(rid => { merged[rid] = snapDay[rid] ?? '' })
        Object.entries(snapDay).forEach(([rid, st]) => { merged[rid] = st })
        next[date] = merged
      })
      // 備份有但目前沒有的日期 → 補回
      Object.entries(data).forEach(([date, day]) => {
        if (!next[date]) next[date] = { ...day }
      })
      return next
    })
  }, [undoInfo, monthKey, setMonthlyAttendance])

  // 一鍵全員出席：將本月所有未設定的過去/今天工作日設為 present
  // 防呆：需確認後才執行；執行前自動備份，可用「復原」還原
  const markAllPresent = useCallback(() => {
    if (!window.confirm(
      `確定要將 ${viewMonth} 月所有「尚未設定」的工作日標記為出席嗎？\n\n` +
      `・已點過的狀態（休假/住院/回診⋯）不會被覆蓋\n` +
      `・執行前會自動備份本月狀態，按「復原」可還原`
    )) return
    saveSnapshot()
    setMonthlyAttendance(prev => {
      const next = { ...prev }
      workDays.forEach(d => {
        if (d > today) return
        const dk   = formatDisplayDate(d)
        const holi = holidays[dk]
        if (holi) return
        const dayData = { ...(prev[dk] ?? {}) }
        let changed = false
        RECIPIENTS.forEach(r => {
          if (!dayData[r.id]) { dayData[r.id] = 'present'; changed = true }
        })
        if (changed) next[dk] = dayData
      })
      return next
    })
  }, [workDays, today, holidays, RECIPIENTS, setMonthlyAttendance, saveSnapshot, viewMonth])

  const ROC = viewYear - 1911

  return (
    <div className="space-y-4">
      {/* ── 標題列 ── */}
      <div className="rounded-2xl p-4 border flex flex-wrap items-center gap-4 justify-between"
        style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>

        {/* 機構名稱 + 月份 */}
        <div>
          <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>
            月度點名表
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#8B6F47' }}>
            雲林縣家園關懷協會附設雲林縣私立紅蘋果社區式服務類長期照顧服務機構
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#8B6F47' }}>
            點擊格子切換狀態 · 橫向滑動查看全月
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

        {/* 圖例 */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(SHORT).map(([key, s]) => (
            <span key={key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: s.bg, color: s.text }}>
              {s.label} {STATUS_TYPES[key]?.label}
            </span>
          ))}
        </div>
        <p className="text-xs w-full" style={{ color: '#8B6F47' }}>
          點擊格子切換狀態 · 假日預設「假」，可手動調整為其他狀態 · 橫向滑動查看全月</p>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          <button onClick={markAllPresent}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition hover:shadow-md"
            style={{ background: '#7A9474', color: 'white' }}
            title="將本月所有未設定的工作日標記為出席（不覆蓋已設定的狀態；執行前自動備份）">
            <CheckCheck size={16}/> 一鍵全員出席
          </button>
          {undoInfo?.monthKey === monthKey && (
            <button onClick={restoreSnapshot}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition hover:bg-orange-50"
              style={{ borderColor: '#C4A87A', color: '#A53838' }}
              title={`復原到 ${undoInfo.savedAt} 備份的狀態`}>
              <RotateCcw size={14}/> 復原
            </button>
          )}
        </div>
      </div>

      {/* ── 月度表格 ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5D5B7' }}>
        <div className="overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 'max-content', fontSize: 12 }}>

            {/* ── 表頭：日期行 ── */}
            <thead>
              <tr style={{ background: '#FBF1DD' }}>
                {/* 拖曳把手欄 */}
                <th style={thSticky({ minWidth: 22, padding: '4px 2px' })}></th>
                {/* 序號欄 */}
                <th style={thSticky({ minWidth: 28, left: 22 })}>序</th>
                {/* 姓名欄 */}
                <th style={thSticky({ minWidth: 80, left: 50 })}>姓名</th>
                {/* 日期欄 */}
                {workDays.map(d => {
                  const dk     = formatDisplayDate(d)
                  const holi   = holidays[dk]
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
                {/* 合計欄 */}
                <th style={{ ...thBase, background: '#A53838', color: 'white', minWidth: 44, borderLeft: '2px solid #C4A87A' }}>
                  合計<br />天數
                </th>
              </tr>
            </thead>

            {/* ── 表身：長者列 ── */}
            <tbody>
              {SORTED_RECIPIENTS.map((r, idx) => {
                const rowBg   = idx % 2 === 0 ? '#FFFFFF' : '#FFFAF0'
                const isOver  = dragOverId === r.id
                const isDragging = dragId === r.id
                return (
                  <tr
                    key={r.id}
                    draggable
                    onDragStart={e => handleDragStart(e, r.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleDragOver(e, r.id)}
                    onDrop={e => handleDrop(e, r.id)}
                    style={{
                      opacity: isDragging ? 0.4 : 1,
                      borderTop:    isOver && dragAbove  ? '2.5px solid #A53838' : undefined,
                      borderBottom: isOver && !dragAbove ? '2.5px solid #A53838' : undefined,
                    }}
                  >
                    {/* 拖曳把手 */}
                    <td style={{ ...tdSticky(rowBg), left: 0, minWidth: 22, padding: '2px 2px', textAlign: 'center', cursor: 'grab' }}>
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
                      const dk        = formatDisplayDate(d)
                      const holi      = holidays[dk]
                      const isToday   = dk === todayStr
                      const isFuture  = d > today && dk !== todayStr
                      const storedKey = monthlyAttendance[dk]?.[r.id]
                      // 過去/今天未設定 → 視同出席（與今日點名邏輯一致）
                      const sKey      = storedKey ?? (holi ? 'holiday' : (!isFuture ? 'present' : ''))
                      // 未明確設定的「出席」用淡色，已明確設定的用正常色
                      const isDefaultPresent = !storedKey && sKey === 'present'
                      const s = sKey ? {
                        ...SHORT[sKey],
                        ...(isDefaultPresent ? { bg: '#EFF8F0', text: '#7AAF7A' } : {}),
                      } : null

                      const isPreset = isFuture && !!sKey && sKey !== 'holiday'
                      return (
                        <td key={dk} style={tdBase}>
                          <button
                            onClick={() => toggleStatus(r.id, d)}
                            title={
                              isDefaultPresent ? '未明確設定（視同出席，點擊可更改）'
                              : sKey
                                ? (STATUS_TYPES[sKey]?.label + (holi ? `（${holi}）` : '') + (isPreset ? '（預設）' : ''))
                                : '點擊預先設定狀態'
                            }
                            style={cellStyle({
                              bg:     s ? s.bg : '#F5F1EA',
                              color:  s ? s.text : '#C4A87A',
                              border: isToday   ? '1.5px solid #A53838'
                                    : isPreset  ? '1.5px dashed #A53838'
                                    : isFuture  ? '1px dashed #C4A87A'
                                    : '1px solid #E8E0D0',
                              fw:     s ? 700 : 400,
                              cursor: 'pointer',
                            })}
                          >
                            {s ? s.label : '·'}
                          </button>
                        </td>
                      )
                    })}
                    {/* 合計 */}
                    <td style={{ ...tdBase, background: '#FBF1DD', fontWeight: 700, color: '#A53838',
                      textAlign: 'center', fontSize: 13, borderLeft: '2px solid #E5D5B7' }}>
                      {recipientTotals[r.id] || ''}
                    </td>
                  </tr>
                )
              })}

              {/* ── 每日合計列 ── */}
              <tr style={{ background: '#FBF1DD', borderTop: '2px solid #C4A87A' }}>
                <td colSpan={3}
                  style={{ ...tdSticky('#FBF1DD'), left: 0, fontWeight: 700, color: '#5C2828',
                    fontSize: 11, textAlign: 'center', borderRight: '2px solid #C4A87A' }}>
                  每日人數
                </td>
                {workDays.map(d => {
                  const dk      = formatDisplayDate(d)
                  const isToday = dk === todayStr
                  const cnt     = dayTotals[dk]
                  return (
                    <td key={dk} style={{ ...tdBase, fontWeight: 700, color: '#A53838', textAlign: 'center',
                      fontSize: 13, background: isToday ? '#FBE8DC' : '#FBF1DD' }}>
                      {cnt || ''}
                    </td>
                  )
                })}
                <td style={{ background: '#A53838', color: 'white', textAlign: 'center',
                  fontWeight: 700, fontSize: 13, borderLeft: '2px solid #C4A87A' }}>
                  –
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 圖示說明 */}
      <p className="text-xs text-center" style={{ color: '#A09684' }}>
        民國 {ROC} 年 {viewMonth} 月服務對象照顧服務紀錄表 ·
        共 {SORTED_RECIPIENTS.length} 位服務對象 · 工作日 {workDays.length} 天
      </p>
    </div>
  )
}

// ── 共用 style 函數 ──────────────────────────────────────────

const borderColor = '#EAE0CC'

const thBase = {
  padding:     '4px 2px',
  textAlign:   'center',
  borderBottom: `2px solid #C4A87A`,
  fontFamily:  '"Noto Serif TC", serif',
  whiteSpace:  'nowrap',
}

const thSticky = (extra = {}) => ({
  ...thBase,
  position:    'sticky',
  zIndex:      20,
  left:        0,
  textAlign:   'left',
  padding:     '6px 8px',
  background:  '#FBF1DD',
  color:       '#5C2828',
  borderRight: `2px solid #C4A87A`,
  ...extra,
})

const thDate = {
  ...thBase,
  minWidth:  34,
  padding:   '4px 1px',
  color:     '#5C2828',
}

const tdBase = {
  padding:      '2px 1px',
  borderBottom: `1px solid ${borderColor}`,
  textAlign:    'center',
}

const tdSticky = (bg) => ({
  ...tdBase,
  position:   'sticky',
  zIndex:     10,
  background: bg,
  padding:    '4px 6px',
  borderRight: `1px solid ${borderColor}`,
})

const cellStyle = ({ bg, color, border, fw = 600, cursor = 'default' }) => ({
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  width:          30,
  height:         26,
  margin:         '0 auto',
  borderRadius:   5,
  background:     bg,
  color,
  border,
  fontWeight:     fw,
  fontSize:       12,
  cursor,
  userSelect:     'none',
  WebkitUserSelect: 'none',
  transition:     'transform 0.1s',
})

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import { RECIPIENTS } from '../data/recipients.js'
import { STATUS_TYPES } from '../data/statusTypes.js'
import { TW_HOLIDAYS, formatDisplayDate } from '../data/monthlyAttendance.js'

// 月度表用的短符號
const SHORT = {
  present:  { label: '✓', bg: '#DFF0E0', text: '#2E6E3E' },
  rest:     { label: '休', bg: '#F5E6D3', text: '#A0541E' },
  hospital: { label: '住', bg: '#F0D5D0', text: '#8B2C20' },
  clinic:   { label: '診', bg: '#D8E2EA', text: '#2D4F6A' },
  blood:    { label: '抽', bg: '#EDD8DC', text: '#8B3A4A' },
  respite:  { label: '喘', bg: '#E2D5E8', text: '#5C2D6A' },
  absent:   { label: '✕', bg: '#EAE5DA', text: '#6B5D4A' },
}

// 狀態循環順序（點擊切換）
const STATUS_CYCLE = ['present', 'rest', 'hospital', 'clinic', 'blood', 'respite', 'absent', '']

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

export default function MonthlyView({ monthlyAttendance, setMonthlyAttendance }) {
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)

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

  // 點擊格子循環切換狀態
  const toggleStatus = (recipientId, d) => {
    const dk = formatDisplayDate(d)
    const cur = monthlyAttendance[dk]?.[recipientId] ?? ''
    const idx  = STATUS_CYCLE.indexOf(cur)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setMonthlyAttendance(prev => ({
      ...prev,
      [dk]: { ...(prev[dk] ?? {}), [recipientId]: next },
    }))
  }

  // 每位長者本月出席天數
  const recipientTotals = useMemo(() => {
    const t = {}
    RECIPIENTS.forEach(r => {
      t[r.id] = workDays.filter(d => {
        const dk = formatDisplayDate(d)
        return monthlyAttendance[dk]?.[r.id] === 'present'
      }).length
    })
    return t
  }, [monthlyAttendance, workDays])

  // 每日在場人數
  const dayTotals = useMemo(() => {
    const t = {}
    workDays.forEach(d => {
      const dk = formatDisplayDate(d)
      t[dk] = RECIPIENTS.filter(r => monthlyAttendance[dk]?.[r.id] === 'present').length
    })
    return t
  }, [monthlyAttendance, workDays])

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ background: '#F0EBF8', color: '#8E6BA8' }}>
            假 國定假日
          </span>
        </div>
      </div>

      {/* ── 月度表格 ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5D5B7' }}>
        <div className="overflow-x-auto scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 'max-content', fontSize: 12 }}>

            {/* ── 表頭：日期行 ── */}
            <thead>
              <tr style={{ background: '#FBF1DD' }}>
                {/* 序號欄 */}
                <th style={thSticky({ minWidth: 28 })}>序</th>
                {/* 姓名欄 */}
                <th style={thSticky({ minWidth: 80, left: 28 })}>姓名</th>
                {/* 日期欄 */}
                {workDays.map(d => {
                  const dk     = formatDisplayDate(d)
                  const holi   = TW_HOLIDAYS[dk]
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
              {RECIPIENTS.map((r, idx) => {
                const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#FFFAF0'
                return (
                  <tr key={r.id}>
                    {/* 序號 */}
                    <td style={{ ...tdSticky(rowBg), left: 0, minWidth: 28, color: '#A09684', textAlign: 'center' }}>
                      {idx + 1}
                    </td>
                    {/* 姓名 */}
                    <td style={{ ...tdSticky(rowBg), left: 28, minWidth: 80 }}>
                      <div style={{ fontWeight: 600, color: '#5C2828' }}>{r.name}</div>
                      <div style={{ fontSize: 9, color: '#A09684', fontFamily: 'monospace' }}>{r.code}</div>
                    </td>
                    {/* 每日格子 */}
                    {workDays.map(d => {
                      const dk       = formatDisplayDate(d)
                      const holi     = TW_HOLIDAYS[dk]
                      const isToday  = dk === todayStr
                      const isFuture = d > today && dk !== todayStr
                      const sKey     = monthlyAttendance[dk]?.[r.id] ?? ''
                      const s        = sKey ? SHORT[sKey] : null

                      // 假日且無填寫 → 顯示「假」
                      if (holi && !sKey) {
                        return (
                          <td key={dk} style={tdBase}>
                            <div style={cellStyle({ bg: '#F0EBF8', color: '#8E6BA8', border: 'none' })}>
                              假
                            </div>
                          </td>
                        )
                      }
                      // 未來且無填寫 → 空白
                      if (isFuture && !sKey) {
                        return (
                          <td key={dk} style={tdBase}>
                            <div style={cellStyle({ bg: '#F5F1EA', color: 'transparent', border: 'none' })}>·</div>
                          </td>
                        )
                      }
                      // 可點擊格子
                      return (
                        <td key={dk} style={tdBase}>
                          <button
                            onClick={() => toggleStatus(r.id, d)}
                            title={sKey ? STATUS_TYPES[sKey]?.label : '點擊設定狀態'}
                            style={cellStyle({
                              bg:     s ? s.bg : (isToday ? '#FBF0E8' : '#FAFAF5'),
                              color:  s ? s.text : '#C4A87A',
                              border: isToday ? '1.5px solid #A53838' : '1px solid #E8E0D0',
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
                <td colSpan={2}
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
        共 {RECIPIENTS.length} 位服務對象 · 工作日 {workDays.length} 天
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

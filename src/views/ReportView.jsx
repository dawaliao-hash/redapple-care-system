import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Printer, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { fetchAttendanceForMonth } from '../api/index.js'
import { isOnline } from '../lib/supabase.js'
import { TW_HOLIDAYS } from '../data/monthlyAttendance.js'
import * as XLSX from 'xlsx'

// ── 報表常數 ─────────────────────────────────────────────
const IDENTITY_COLS = [
  { key: 'elderly',         label: '65歲以上老人\n（含IADLs失能且獨居之老人）' },
  { key: 'disabled_65up',   label: '65歲以上領有\n身心障礙證明者' },
  { key: 'disabled_64down', label: '64歲以下領有\n身心障礙證明者' },
  { key: 'indigenous',      label: '55-64歲原住民' },
  { key: 'dementia',        label: '50歲以上失智症者' },
]
const INCOME_COLS = [
  { key: null,      label: '合計' },
  { key: '第一類',  label: '長照低\n收入' },
  { key: '第二類',  label: '長照中\n低收入' },
  { key: '第三類',  label: '長照一\n般戶' },
]
const CMS_LEVELS   = [2, 3, 4, 5, 6, 7, 8]
const CMS_LABELS   = { 2:'第二級', 3:'第三級', 4:'第四級', 5:'第五級', 6:'第六級', 7:'第七級', 8:'第八級' }
const PRESENT_STATUSES  = new Set(['present','clinic','hospital','blood','respite'])
const ABSENT_STATUSES   = new Set(['absent','holiday','rest'])

// 產生期間內所有工作日（週一到週五且非假日）的日期字串
function getWorkdays(startStr, endStr) {
  const days = []
  const [sy, sm, sd] = startStr.split('/').map(Number)
  const [ey, em, ed] = endStr.split('/').map(Number)
  const cur = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  while (cur <= end) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) {
      const dk = `${cur.getFullYear()}/${String(cur.getMonth()+1).padStart(2,'0')}/${String(cur.getDate()).padStart(2,'0')}`
      if (!TW_HOLIDAYS[dk]) days.push(dk)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

// 找出在某期間「有出席」的個案 ID 集合
// 邏輯：只要有任一工作日狀態為出席（或沒有設定過，視為出席），就算在內
function getAttendedIds(attendance, startStr, endStr, allRecipientIds) {
  const workdays = getWorkdays(startStr, endStr)
  if (!workdays.length) return new Set()

  const ids = new Set()

  // 先看明確記錄為出席的
  workdays.forEach(date => {
    const dayData = attendance[date] ?? {}
    Object.entries(dayData).forEach(([rid, status]) => {
      if (PRESENT_STATUSES.has(status)) ids.add(rid)
    })
  })

  // 再補：對每個長者，若在整個期間內「沒有任何缺席記錄」且「至少有一天有記錄」
  // → 視為有出席（例如：當月只有標記特殊狀況，其餘預設出席）
  allRecipientIds.forEach(rid => {
    if (ids.has(rid)) return
    let hasAnyRecord = false
    let allAbsent = true
    workdays.forEach(date => {
      const status = (attendance[date] ?? {})[rid]
      if (status) {
        hasAnyRecord = true
        if (!ABSENT_STATUSES.has(status)) allAbsent = false
      }
    })
    // 有記錄，且不是全部缺席 → 已在 ids 中（handled above）
    // 有記錄，且全部缺席 → 不算
    // 完全沒記錄（期間從未被標記）→ 無法確定，不算（避免誤計未開案個案）
    // 但若「至少一天有明確記錄且非缺席」已在上面加入
  })

  return ids
}

// 期底在案（沒有結案，或結案日期 > 期底）
function getPeriodEndPool(allRecipients, endStr) {
  return allRecipients.filter(r => {
    if (r.isActive !== false) return true
    return r.closedAt && r.closedAt > endStr
  })
}

function fmt(y, m, d) {
  return `${y}/${String(m).padStart(2,'0')}/${String(d||1).padStart(2,'0')}`
}
function lastDay(y, m) { return new Date(y, m, 0).getDate() }

// ── 報表統計計算 ──────────────────────────────────────────
function buildTable(pool) {
  const count = (cms, gender, identity, income) =>
    pool.filter(r => {
      if (cms     !== null && r.cms             !== cms)     return false
      if (gender  !== null && r.gender           !== gender)  return false
      if (identity !== null && r.serviceCategory !== identity) return false
      if (income  !== null && r.level            !== income)  return false
      return true
    }).length

  // 行：[ {cmsKey, genderKey, cmsLabel, genderLabel, isFirst} ]
  const rows = []
  rows.push({ cmsKey: null, genderKey: null, cmsLabel: '總計', genderLabel: '合計', isFirst: true })
  rows.push({ cmsKey: null, genderKey: '男',  cmsLabel: '',     genderLabel: '男',  isFirst: false })
  rows.push({ cmsKey: null, genderKey: '女',  cmsLabel: '',     genderLabel: '女',  isFirst: false })
  CMS_LEVELS.forEach(cms => {
    rows.push({ cmsKey: cms, genderKey: null, cmsLabel: CMS_LABELS[cms], genderLabel: '計', isFirst: true })
    rows.push({ cmsKey: cms, genderKey: '男', cmsLabel: '',              genderLabel: '男', isFirst: false })
    rows.push({ cmsKey: cms, genderKey: '女', cmsLabel: '',              genderLabel: '女', isFirst: false })
  })

  // 每行計算所有格子
  return rows.map(row => ({
    ...row,
    // 總計欄 (4 cols)
    total: INCOME_COLS.map(inc => count(row.cmsKey, row.genderKey, null, inc.key)),
    // 各身份欄 (4 cols × 5 types)
    byIdentity: IDENTITY_COLS.map(id =>
      INCOME_COLS.map(inc => count(row.cmsKey, row.genderKey, id.key, inc.key))
    ),
  }))
}

// ── 報表類型 ─────────────────────────────────────────────
const REPORT_TYPES = [
  { id: 'monthly',     label: '月報',          desc: '當月有出席≥1天' },
  { id: 'semi_end',    label: '半年報（期底）', desc: '指定月底在案' },
  { id: 'semi_period', label: '半年報（本期）', desc: '半年內有出席≥1天' },
  { id: 'annual_12',   label: '全年報（12月）', desc: '12月在案' },
  { id: 'annual_7_12', label: '全年報（7-12月）',desc: '下半年有出席≥1天' },
  { id: 'annual_1_12', label: '全年報（全年）', desc: '全年有出席≥1天' },
]

// ════════════════════════════════════════════════════════
export default function ReportView({ monthlyAttendance }) {
  const { recipients: allRecipients } = useData()
  const today = new Date()

  const [reportType, setReportType] = useState('monthly')
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [half,  setHalf]  = useState(1) // 1=上半年, 2=下半年
  const tableRef = useRef(null)

  // ── 自動抓取缺少的月份資料 ────────────────────────────
  const [extraAttendance, setExtraAttendance] = useState({})
  const fetchedKeys = useRef(new Set())
  const [fetching, setFetching] = useState(false)

  // 所有資料來源：prop（App 管理的）+ 本地抓取的額外資料
  const combinedAttendance = useMemo(() =>
    ({ ...monthlyAttendance, ...extraAttendance }),
    [monthlyAttendance, extraAttendance])

  // 計算當前報表類型需要哪些月份
  const neededMonths = useMemo(() => {
    const months = []
    switch (reportType) {
      case 'monthly':     months.push({ y: year, m: month }); break
      case 'semi_end':
      case 'semi_period': {
        const s = half === 1 ? 1 : 7, e = half === 1 ? 6 : 12
        for (let m = s; m <= e; m++) months.push({ y: year, m })
        break
      }
      case 'annual_12':   months.push({ y: year, m: 12 }); break
      case 'annual_7_12': for (let m = 7; m <= 12; m++) months.push({ y: year, m }); break
      case 'annual_1_12': for (let m = 1; m <= 12; m++) months.push({ y: year, m }); break
    }
    return months
  }, [reportType, year, month, half])

  // 若有缺少的月份，自動從 Supabase 抓取
  useEffect(() => {
    if (!isOnline) return
    const prefix = (y, m) => `${y}/${String(m).padStart(2,'0')}`
    const missing = neededMonths.filter(({ y, m }) => {
      const key = prefix(y, m)
      if (fetchedKeys.current.has(key)) return false
      return !Object.keys(combinedAttendance).some(d => d.startsWith(key))
    })
    if (!missing.length) return

    setFetching(true)
    Promise.all(missing.map(({ y, m }) => {
      const key = prefix(y, m)
      fetchedKeys.current.add(key)
      return fetchAttendanceForMonth(y, m)
    })).then(results => {
      const merged = Object.assign({}, ...results)
      if (Object.keys(merged).length) {
        setExtraAttendance(prev => ({ ...prev, ...merged }))
      }
      setFetching(false)
    }).catch(() => setFetching(false))
  }, [neededMonths])

  const allRids = useMemo(() => allRecipients.map(r => r.id), [allRecipients])

  // ── 決定統計母體 ──────────────────────────────────────
  const pool = useMemo(() => {
    switch (reportType) {
      case 'monthly': {
        const start = fmt(year, month, 1)
        const end   = fmt(year, month, lastDay(year, month))
        const ids   = getAttendedIds(combinedAttendance, start, end, allRids)
        return allRecipients.filter(r => ids.has(r.id))
      }
      case 'semi_end': {
        const endMonth = half === 1 ? 6 : 12
        const endStr   = fmt(year, endMonth, lastDay(year, endMonth))
        return getPeriodEndPool(allRecipients, endStr)
      }
      case 'semi_period': {
        const startMonth = half === 1 ? 1 : 7
        const endMonth   = half === 1 ? 6 : 12
        const start = fmt(year, startMonth, 1)
        const end   = fmt(year, endMonth, lastDay(year, endMonth))
        const ids   = getAttendedIds(combinedAttendance, start, end, allRids)
        return allRecipients.filter(r => ids.has(r.id))
      }
      case 'annual_12': {
        const endStr = fmt(year, 12, 31)
        return getPeriodEndPool(allRecipients, endStr)
      }
      case 'annual_7_12': {
        const start = fmt(year, 7, 1)
        const end   = fmt(year, 12, 31)
        const ids   = getAttendedIds(combinedAttendance, start, end, allRids)
        return allRecipients.filter(r => ids.has(r.id))
      }
      case 'annual_1_12': {
        const start = fmt(year, 1, 1)
        const end   = fmt(year, 12, 31)
        const ids   = getAttendedIds(combinedAttendance, start, end, allRids)
        return allRecipients.filter(r => ids.has(r.id))
      }
      default: return []
    }
  }, [reportType, year, month, half, allRecipients, combinedAttendance, allRids])

  const tableData = useMemo(() => buildTable(pool), [pool])

  // ── 報表標題文字 ──────────────────────────────────────
  const reportTitle = useMemo(() => {
    const roc = year - 1911
    switch (reportType) {
      case 'monthly':     return `中華民國${roc}年 ${month}月`
      case 'semi_end':    return `中華民國${roc}年 期底（${half===1?6:12}月）`
      case 'semi_period': return `中華民國${roc}年 本期（${half===1?'1至6':'7至12'}月）`
      case 'annual_12':   return `中華民國${roc}年 期底（12月）`
      case 'annual_7_12': return `中華民國${roc}年 本期（7至12月）`
      case 'annual_1_12': return `中華民國${roc}年 全年（1至12月）`
      default: return ''
    }
  }, [reportType, year, month, half])

  // ── 匯出 Excel ────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const wsData = []

    // 標題行
    wsData.push(['雲林縣長期照顧十年計畫（二）－日間照顧', '', reportTitle, '', '單位：人'])

    // 欄位說明行 1
    const h1 = ['CMS等級', '性別', '總計', '', '', '']
    IDENTITY_COLS.forEach(id => h1.push(id.label.replace('\n', ''), '', '', ''))
    wsData.push(h1)

    // 欄位說明行 2
    const h2 = ['', '']
    ;['總計', ...IDENTITY_COLS.map(()=>'')].forEach(() => {
      INCOME_COLS.forEach(inc => h2.push(inc.label.replace('\n', '')))
    })
    wsData.push(h2)

    // 資料行
    tableData.forEach(row => {
      const cells = [row.cmsLabel, row.genderLabel]
      row.total.forEach(v => cells.push(v))
      row.byIdentity.forEach(cols => cols.forEach(v => cells.push(v)))
      wsData.push(cells)
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = Array(2 + 4 * 6).fill({ wch: 8 })
    XLSX.utils.book_append_sheet(wb, ws, reportTitle.slice(0, 31))
    XLSX.writeFile(wb, `日間照顧報表_${reportTitle.replace(/\s/g, '')}.xlsx`)
  }

  // ── 列印 PDF ──────────────────────────────────────────
  const printPDF = () => window.print()

  // ── 期間選擇器 ────────────────────────────────────────
  const needMonth   = reportType === 'monthly'
  const needHalf    = ['semi_end','semi_period','annual_7_12','annual_1_12'].includes(reportType)

  const thSt = { background: '#FBF1DD', color: '#5C2828', padding: '6px 4px',
                  border: '1px solid #C4A87A', fontSize: 11, whiteSpace: 'pre-line', textAlign: 'center' }
  const tdSt = { border: '1px solid #E5D5B7', textAlign: 'center', padding: '4px 3px',
                  fontSize: 12, color: '#3D2817' }

  return (
    <div className="space-y-5">
      {/* ── 報表控制列 ── */}
      <div className="rounded-2xl p-4 border flex flex-wrap gap-4 items-center"
        style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>

        {/* 報表類型 */}
        <div className="flex flex-wrap gap-1.5">
          {REPORT_TYPES.map(t => (
            <button key={t.id} onClick={() => setReportType(t.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
              style={{
                background: reportType === t.id ? '#A53838' : '#FBF6EC',
                color:      reportType === t.id ? 'white'   : '#5C3A1E',
                borderColor: '#C4A87A',
              }}>
              <div>{t.label}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {/* 年份 */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setYear(y => y-1)} className="p-1 rounded hover:bg-orange-100"
            style={{ color: '#5C2828' }}><ChevronLeft size={16}/></button>
          <span className="font-display font-semibold text-sm px-1" style={{ color: '#A53838' }}>
            {year - 1911} 年（{year}）
          </span>
          <button onClick={() => setYear(y => y+1)} className="p-1 rounded hover:bg-orange-100"
            style={{ color: '#5C2828' }}><ChevronRight size={16}/></button>
        </div>

        {/* 月份（月報用）*/}
        {needMonth && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setMonth(m => m > 1 ? m-1 : 12)} className="p-1 rounded hover:bg-orange-100"
              style={{ color: '#5C2828' }}><ChevronLeft size={16}/></button>
            <span className="font-display font-semibold text-sm px-1" style={{ color: '#A53838' }}>{month} 月</span>
            <button onClick={() => setMonth(m => m < 12 ? m+1 : 1)} className="p-1 rounded hover:bg-orange-100"
              style={{ color: '#5C2828' }}><ChevronRight size={16}/></button>
          </div>
        )}

        {/* 上/下半年 */}
        {needHalf && (
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#C4A87A' }}>
            {[{v:1,l:'上半年（1-6月）'},{v:2,l:'下半年（7-12月）'}].map(h => (
              <button key={h.v} onClick={() => setHalf(h.v)}
                className="px-3 py-1.5 text-sm transition"
                style={{ background: half===h.v ? '#A53838' : '#FBF6EC',
                         color: half===h.v ? 'white' : '#5C3A1E' }}>
                {h.l}
              </button>
            ))}
          </div>
        )}

        {/* 匯出按鈕 */}
        <div className="flex gap-2 ml-auto items-center">
          {fetching && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#8B6F47' }}>
              <RefreshCw size={13} className="animate-spin"/> 載入資料中…
            </span>
          )}
          <button onClick={printPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition hover:bg-orange-50 print:hidden"
            style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>
            <Printer size={15}/> 列印 / PDF
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition hover:bg-green-50 print:hidden"
            style={{ borderColor: '#7A9474', color: '#7A9474' }}>
            <FileSpreadsheet size={15}/> 匯出 Excel
          </button>
        </div>
      </div>

      {/* ── 統計摘要 ── */}
      <div className="flex items-center gap-3 px-1 text-sm print:hidden" style={{ color: '#8B6F47' }}>
        <span>統計人數：<strong style={{ color: '#A53838' }}>{pool.length}</strong> 人</span>
        <span>·</span>
        <span>期間：{reportTitle}</span>
      </div>

      {/* ── 報表本體（可列印）── */}
      <div ref={tableRef} className="report-print-area">
        {/* 列印時顯示標題 */}
        <div className="hidden print:block text-center mb-3">
          <div style={{ fontSize: 16, fontWeight: 700 }}>雲林縣長期照顧十年計畫（二）－日間照顧</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{reportTitle}　　　　單位：人</div>
        </div>

        <div className="rounded-2xl border overflow-hidden print:rounded-none print:border-0"
          style={{ borderColor: '#E5D5B7' }}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="text-xs border-collapse" style={{ minWidth: 960 }}>
              <thead>
                {/* 第一行：大欄標題 */}
                <tr>
                  <th rowSpan={2} style={{ ...thSt, minWidth: 56 }}>CMS{'\n'}等級</th>
                  <th rowSpan={2} style={{ ...thSt, minWidth: 36 }}>性別</th>
                  <th colSpan={4} style={{ ...thSt }}>總　計</th>
                  {IDENTITY_COLS.map(id => (
                    <th key={id.key} colSpan={4} style={{ ...thSt, minWidth: 140 }}>{id.label}</th>
                  ))}
                </tr>
                {/* 第二行：收入別小標 */}
                <tr>
                  {[null, ...IDENTITY_COLS.map(id => id.key)].map((_, gi) =>
                    INCOME_COLS.map(inc => (
                      <th key={`${gi}-${inc.key}`} style={{ ...thSt, minWidth: 34 }}>{inc.label}</th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, ri) => {
                  const isTotalGroup = row.cmsKey === null
                  const rowBg = isTotalGroup
                    ? (row.genderKey === null ? '#FBE8DC' : '#FBF6EC')
                    : (row.genderKey === null ? '#F5EDD8' : 'white')
                  return (
                    <tr key={ri}>
                      {row.isFirst && (
                        <td rowSpan={3} style={{ ...tdSt, background: isTotalGroup ? '#FBE8DC' : '#FBF1DD',
                          fontWeight: 600, fontSize: 12, verticalAlign: 'middle' }}>
                          {row.cmsLabel}
                        </td>
                      )}
                      <td style={{ ...tdSt, background: rowBg, fontWeight: row.genderKey === null ? 600 : 400 }}>
                        {row.genderLabel}
                      </td>
                      {/* 總計欄 */}
                      {row.total.map((v, ci) => (
                        <td key={`t${ci}`} style={{ ...tdSt, background: rowBg,
                          fontWeight: ci === 0 ? 600 : 400, color: v > 0 ? '#A53838' : '#A09684' }}>
                          {v}
                        </td>
                      ))}
                      {/* 各身份欄 */}
                      {row.byIdentity.map((cols, gi) =>
                        cols.map((v, ci) => (
                          <td key={`${gi}-${ci}`} style={{ ...tdSt, background: rowBg,
                            fontWeight: ci === 0 ? 600 : 400, color: v > 0 ? '#5C2828' : '#C0B49A' }}>
                            {v}
                          </td>
                        ))
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 列印 CSS */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .report-print-area { display: block !important; }
          nav, header, .print\\:hidden { display: none !important; }
          table { page-break-inside: auto; font-size: 9px; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}

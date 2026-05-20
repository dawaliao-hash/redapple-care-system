import { RECIPIENTS } from './recipients.js'
import { getMergedHolidays } from './holidays.js'

export const formatDisplayDate = (d) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

// 向外匯出合併假日（供各 View 使用）
export const TW_HOLIDAYS = getMergedHolidays(2025, 2026, 2027)

// 隨機分配歷史日期狀態（模擬）
const randomStatus = (seed) => {
  const v = seed % 100
  if (v < 76) return 'present'
  if (v < 86) return 'rest'
  if (v < 91) return 'hospital'
  if (v < 95) return 'clinic'
  if (v < 97) return 'blood'
  if (v < 99) return 'respite'
  return 'absent'
}

// 今日預設出缺席
const buildTodayAttendance = () => {
  const base = {}
  RECIPIENTS.forEach(r => {
    if (r.id === 'r3' || r.id === 'r16') base[r.id] = 'hospital'
    else if (r.id === 'r6')              base[r.id] = 'clinic'
    else if (r.id === 'r2')             base[r.id] = 'rest'
    else if (r.id === 'r5')             base[r.id] = 'blood'
    else if (r.id === 'r13')            base[r.id] = 'respite'
    else                                base[r.id] = 'present'
  })
  return base
}

// 產生某日的假日狀態（全員設為 holiday）
const buildHolidayAttendance = () => {
  const base = {}
  RECIPIENTS.forEach(r => { base[r.id] = 'holiday' })
  return base
}

export const generateMonthlyAttendance = () => {
  const today   = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDisplayDate(today)
  const result   = {}

  const year  = today.getFullYear()
  const month = today.getMonth() + 1

  // 合併靜態 + 快取假日資料
  const holidays = getMergedHolidays(year - 1, year, year + 1)

  // 本月每一天
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month - 1, day)
    if (d.getMonth() !== month - 1) break

    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue // 週末不生成

    const dk      = formatDisplayDate(d)
    const holi    = holidays[dk]
    const isPast  = d < today
    const isToday = dk === todayStr

    if (holi) {
      // 國定假日：全員預設「假日」
      result[dk] = buildHolidayAttendance()
    }
    // 過去、今天、未來非假日：不生成假資料，留空讓 Supabase 填入
  }

  return result
}

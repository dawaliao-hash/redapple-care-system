import { RECIPIENTS } from './recipients.js'

// 台灣 2026 年國定假日
export const TW_HOLIDAYS = {
  '2026/01/01': '元旦',
  '2026/02/16': '除夕',
  '2026/02/17': '春節',
  '2026/02/18': '初二',
  '2026/02/19': '初三',
  '2026/02/20': '初四補假',
  '2026/02/28': '和平紀念日',
  '2026/04/03': '兒童節補假',
  '2026/04/04': '兒童節',
  '2026/04/05': '清明節',
  '2026/05/01': '勞動節',
  '2026/06/19': '端午節',
  '2026/09/24': '中秋節',
  '2026/10/10': '國慶日',
}

export const formatDisplayDate = (d) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

// 初始化今日出缺席（配合 App.jsx 的 defaultAttendance）
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

// 隨機分配歷史日期狀態（模擬真實比例）
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

export const generateMonthlyAttendance = () => {
  const today    = new Date()
  const todayStr = formatDisplayDate(today)
  const result   = {}

  // 產生本月每個工作日（今天以前）的模擬資料
  const year  = today.getFullYear()
  const month = today.getMonth() + 1

  for (let day = 1; day <= today.getDate(); day++) {
    const d   = new Date(year, month - 1, day)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue // 跳過週末

    const dk = formatDisplayDate(d)

    if (dk === todayStr) {
      result[dk] = buildTodayAttendance()
    } else {
      const dayData = {}
      RECIPIENTS.forEach((r, ri) => {
        // 以日期+index 為種子，讓每次重整結果一致
        const seed = day * 31 + ri * 7 + r.id.charCodeAt(1)
        dayData[r.id] = randomStatus(seed)
      })
      result[dk] = dayData
    }
  }

  return result
}

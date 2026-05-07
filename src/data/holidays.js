/**
 * 中華民國行政院公告國定假日
 * 靜態備用資料：2025–2027 年
 * 線上資料來源：人事行政總處行事曆 (透過 TaiwanCalendar CDN)
 */

// ── 靜態備用假日資料 ──────────────────────────────────────
export const STATIC_HOLIDAYS = {
  // ── 2025年 (民國114年) ──
  '2025/01/01': '元旦',
  '2025/01/27': '春節彈性放假',
  '2025/01/28': '農曆除夕',
  '2025/01/29': '春節',
  '2025/01/30': '初二',
  '2025/01/31': '初三',
  '2025/02/28': '和平紀念日',
  '2025/04/03': '兒童節/清明補假',
  '2025/04/04': '兒童節',
  '2025/05/01': '勞動節',
  '2025/05/30': '端午節補假',
  '2025/05/31': '端午節',
  '2025/10/06': '中秋節',
  '2025/10/09': '國慶日補假',
  '2025/10/10': '國慶日',
  // ── 2026年 (民國115年) ──
  '2026/01/01': '元旦',
  '2026/02/16': '農曆除夕',
  '2026/02/17': '春節',
  '2026/02/18': '初二',
  '2026/02/19': '初三',
  '2026/02/20': '春節彈性放假',
  '2026/02/27': '和平紀念日補假',
  '2026/04/03': '兒童節/清明補假',
  '2026/05/01': '勞動節',
  '2026/06/19': '端午節補假',
  '2026/09/25': '中秋節補假',
  '2026/10/09': '國慶日補假',
  // ── 2027年 (民國116年) ──
  '2027/01/01': '元旦',
  '2027/02/05': '農曆除夕',
  '2027/02/06': '春節',
  '2027/02/07': '初二',
  '2027/02/08': '初三',
  '2027/02/28': '和平紀念日',
  '2027/04/04': '兒童節',
  '2027/04/05': '清明節',
  '2027/05/01': '勞動節',
  '2027/05/20': '端午節',
  '2027/10/10': '國慶日',
}

// ── localStorage 快取鍵 ────────────────────────────────────
const CACHE_KEY    = (y) => `tw_holidays_api_${y}`
const CACHE_EXPIRY = (y) => `tw_holidays_api_${y}_exp`
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 天更新一次

// ── 從快取讀取 ─────────────────────────────────────────────
function getCache(year) {
  try {
    const exp = localStorage.getItem(CACHE_EXPIRY(year))
    if (!exp || Date.now() > parseInt(exp)) return null
    const raw = localStorage.getItem(CACHE_KEY(year))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setCache(year, data) {
  try {
    localStorage.setItem(CACHE_KEY(year), JSON.stringify(data))
    localStorage.setItem(CACHE_EXPIRY(year), String(Date.now() + TTL_MS))
  } catch { /* quota full - skip */ }
}

// ── 從 TaiwanCalendar CDN 抓取 ────────────────────────────
// 資料來源：https://github.com/ruyut/TaiwanCalendar（人事行政總處資料）
async function fetchYearHolidays(year) {
  const url = `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const arr = await res.json()

  const result = {}
  arr.forEach(item => {
    if (item.isHoliday) {
      const d = String(item.date) // "20260101"
      const key = `${d.slice(0,4)}/${d.slice(4,6)}/${d.slice(6,8)}`
      result[key] = item.description || '國定假日'
    }
  })
  return result
}

// ── 取得特定年份假日（快取 > API > 靜態備用）────────────────
const _fetching = new Set()
const _listeners = []

export async function syncHolidaysForYear(year, onUpdate) {
  if (_fetching.has(year)) return
  const cached = getCache(year)
  if (cached) { onUpdate?.(year, cached); return }

  _fetching.add(year)
  try {
    const data = await fetchYearHolidays(year)
    setCache(year, data)
    onUpdate?.(year, data)
  } catch {
    // 網路失敗，使用靜態備用資料
    const fallback = {}
    Object.entries(STATIC_HOLIDAYS).forEach(([k, v]) => {
      if (k.startsWith(String(year))) fallback[k] = v
    })
    onUpdate?.(year, fallback)
  } finally {
    _fetching.delete(year)
  }
}

// ── 取得當前最佳假日資料（合併靜態 + 快取）──────────────────
export function getMergedHolidays(...years) {
  const merged = { ...STATIC_HOLIDAYS }
  years.forEach(y => {
    const cached = getCache(y)
    if (cached) Object.assign(merged, cached)
  })
  return merged
}

export function isHoliday(dateStr, holidays) {
  return !!(holidays ?? STATIC_HOLIDAYS)[dateStr]
}

export function getHolidayName(dateStr, holidays) {
  return (holidays ?? STATIC_HOLIDAYS)[dateStr] ?? null
}

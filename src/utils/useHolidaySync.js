import { useState, useEffect } from 'react'
import { syncHolidaysForYear, getMergedHolidays } from '../data/holidays.js'

/**
 * 在 App 啟動後，背景自動從 TaiwanCalendar CDN 更新假日資料。
 * 同步期間 syncing = true，完成後 holidays 物件更新。
 */
export function useHolidaySync() {
  const today  = new Date()
  const year   = today.getFullYear()

  const [holidays, setHolidays] = useState(() => getMergedHolidays(year - 1, year, year + 1))
  const [syncing,  setSyncing]  = useState(false)
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    const yearsToSync = [year - 1, year, year + 1]
    setSyncing(true)

    let remaining = yearsToSync.length
    yearsToSync.forEach(y => {
      syncHolidaysForYear(y, () => {
        remaining -= 1
        if (remaining === 0) {
          // 全部年份更新完成
          setHolidays(getMergedHolidays(...yearsToSync))
          setSyncing(false)
          setLastSync(new Date())
        }
      })
    })
  }, [year])

  return { holidays, syncing, lastSync }
}

// 在案期間判斷：依「開案日期 admittedAt」與「結案日期 closedAt」
// 判斷長者在某月份／某期間是否屬於在案名單。
// 日期字串格式 'YYYY/MM/DD'，零補位可直接用字串比較。

// 在 [startStr, endStr] 期間內是否在案（有任一天在案即算）
export function inCareDuringRange(r, startStr, endStr) {
  const admitted = (r.admittedAt || '').trim()
  // 開案日在期間結束之後 → 該期間尚未開案，不顯示
  if (admitted && admitted > endStr) return false
  if (r.isActive === false) {
    const closed = (r.closedAt || '').trim()
    // 已結案且（無結案日期 或 在期間開始前就結案）→ 不顯示
    if (!closed || closed < startStr) return false
  }
  return true
}

// 某年某月是否在案
export function inCareDuringMonth(r, year, month) {
  const ym = `${year}/${String(month).padStart(2, '0')}`
  return inCareDuringRange(r, `${ym}/01`, `${ym}/31`)
}

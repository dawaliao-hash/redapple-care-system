// 在案期間判斷：依「開案日期 admittedAt」與「結案日期 closedAt」
// 判斷長者在某月份／某期間是否屬於在案名單。
// 日期字串格式 'YYYY/MM/DD'，零補位可直接用字串比較。
// 'YYYY-MM-DD' 先轉成 '/'，否則 '-' 與 '/' 的字元順序會讓比較出錯。
const norm = (s) => (s || '').trim().replace(/-/g, '/')

// 在 [startStr, endStr] 期間內是否在案（有任一天在案即算）
export function inCareDuringRange(r, startStr, endStr) {
  const admitted = norm(r.admittedAt)
  // 開案日在期間結束之後 → 該期間尚未開案，不顯示
  if (admitted && admitted > endStr) return false
  if (r.isActive === false) {
    const closed = norm(r.closedAt)
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

// 點名選「結案」時，詢問是否同步在個案資料中結案（結案日 = 該日）
// 結案後依在案期間規則：結案當月仍顯示，下個月起不再出現在月度點名
export function offerCloseCase(r, dateStr, updateRecipient) {
  if (!r || (r.isActive === false && r.closedAt)) return
  const ok = window.confirm(
    `是否同時將「${r.name}」設為結案？\n\n` +
    `・結案日期：${dateStr}\n` +
    `・結案當月仍會顯示，下個月起不再出現在月度點名\n` +
    `・今日點名名單會立即移除此人\n\n` +
    `按「取消」則只標記點名狀態，不結案。`)
  if (ok) updateRecipient({ ...r, isActive: false, closedAt: dateStr, closeReason: r.closeReason || '點名標記結案' })
}

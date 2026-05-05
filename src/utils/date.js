export const formatDate = (d) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

export const weekdayLabel = (d) =>
  ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]

export const TODAY = new Date()
export const todayStr = formatDate(TODAY)
export const weekDay = weekdayLabel(TODAY)

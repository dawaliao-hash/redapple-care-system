import { RECIPIENTS } from './recipients.js'

const fmt = (d) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

export const generateHealthRecords = () => {
  const records = {}
  RECIPIENTS.forEach((r) => {
    const data = []
    for (let i = 30; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      if ([0, 6].includes(d.getDay())) continue
      data.push({
        date:      `${d.getMonth() + 1}/${d.getDate()}`,
        fullDate:  fmt(d),
        time:      `08:${String(20 + Math.floor(Math.random() * 30)).padStart(2, '0')}`,
        temp:      +(36.3 + Math.random() * 0.7).toFixed(1),
        pulse:     Math.floor(60 + Math.random() * 25),
        systolic:  Math.floor(110 + Math.random() * 30),
        diastolic: Math.floor(60 + Math.random() * 20),
        weight:    50 + Math.floor(Math.random() * 20),
        notes:     '',
        recorder:  '魏寶玫',
      })
    }
    records[r.id] = data
  })
  return records
}

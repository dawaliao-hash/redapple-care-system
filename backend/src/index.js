import express from 'express'
import cors from 'cors'
import { CAREGIVERS, RECIPIENTS, STATUS_TYPES } from './data.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// 模擬資料庫（記憶體）
let attendanceDB = (() => {
  const base = {}
  RECIPIENTS.forEach(r => {
    if (r.id === 'r3' || r.id === 'r16') base[r.id] = 'hospital'
    else if (r.id === 'r6') base[r.id] = 'clinic'
    else if (r.id === 'r2') base[r.id] = 'rest'
    else if (r.id === 'r5') base[r.id] = 'blood'
    else if (r.id === 'r13') base[r.id] = 'respite'
    else base[r.id] = 'present'
  })
  return base
})()

let assignmentsDB = (() => {
  const m = {}
  RECIPIENTS.forEach(r => { m[r.id] = r.primaryCaregiver })
  return m
})()

// 健康紀錄（模擬）
const formatDate = (d) =>
  `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`

const healthDB = (() => {
  const records = {}
  RECIPIENTS.forEach(r => {
    const data = []
    for (let i = 30; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      if ([0, 6].includes(d.getDay())) continue
      data.push({
        date: `${d.getMonth()+1}/${d.getDate()}`,
        fullDate: formatDate(d),
        time: `08:${String(20 + Math.floor(Math.random()*30)).padStart(2,'0')}`,
        temp: +(36.3 + Math.random()*0.7).toFixed(1),
        pulse: Math.floor(60 + Math.random()*25),
        systolic: Math.floor(110 + Math.random()*30),
        diastolic: Math.floor(60 + Math.random()*20),
        weight: 50 + Math.floor(Math.random()*20),
        notes: '',
        recorder: '魏寶玫',
      })
    }
    records[r.id] = data
  })
  return records
})()

// ── Routes ────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 長者
app.get('/api/recipients', (req, res) => res.json(RECIPIENTS))
app.get('/api/recipients/:id', (req, res) => {
  const r = RECIPIENTS.find(r => r.id === req.params.id)
  r ? res.json(r) : res.status(404).json({ error: '找不到此長者' })
})

// 照服員
app.get('/api/caregivers', (req, res) => res.json(CAREGIVERS))

// 出缺席
app.get('/api/attendance', (req, res) => res.json(attendanceDB))
app.patch('/api/attendance/:recipientId', (req, res) => {
  const { recipientId } = req.params
  const { status } = req.body
  if (!RECIPIENTS.find(r => r.id === recipientId)) return res.status(404).json({ error: '找不到此長者' })
  if (!STATUS_TYPES[status]) return res.status(400).json({ error: '無效的狀態值' })
  attendanceDB[recipientId] = status
  res.json({ recipientId, status })
})

// 配對指派
app.get('/api/assignments', (req, res) => res.json(assignmentsDB))
app.patch('/api/assignments/:recipientId', (req, res) => {
  const { recipientId } = req.params
  const { caregiverId } = req.body
  if (!RECIPIENTS.find(r => r.id === recipientId)) return res.status(404).json({ error: '找不到此長者' })
  if (!CAREGIVERS.find(c => c.id === caregiverId)) return res.status(400).json({ error: '找不到此照服員' })
  assignmentsDB[recipientId] = caregiverId
  res.json({ recipientId, caregiverId })
})

// 健康紀錄
app.get('/api/health-records', (req, res) => res.json(healthDB))
app.get('/api/health-records/:recipientId', (req, res) => {
  const records = healthDB[req.params.recipientId]
  records ? res.json(records) : res.status(404).json({ error: '找不到此長者的健康紀錄' })
})
app.post('/api/health-records/:recipientId', (req, res) => {
  const { recipientId } = req.params
  if (!healthDB[recipientId]) return res.status(404).json({ error: '找不到此長者' })
  const record = {
    ...req.body,
    fullDate: formatDate(new Date()),
    date: `${new Date().getMonth()+1}/${new Date().getDate()}`,
  }
  healthDB[recipientId].push(record)
  res.status(201).json(record)
})

// 狀態類型
app.get('/api/status-types', (req, res) => res.json(STATUS_TYPES))

app.listen(PORT, () => {
  console.log(`✅ 水林紅蘋果長照系統後端運行中：http://localhost:${PORT}`)
  console.log(`📋 API 端點：`)
  console.log(`   GET  /api/recipients      - 所有長者`)
  console.log(`   GET  /api/caregivers      - 所有照服員`)
  console.log(`   GET  /api/attendance      - 今日出缺席`)
  console.log(`   PATCH /api/attendance/:id - 更新出缺席`)
  console.log(`   GET  /api/assignments     - 配對總覽`)
  console.log(`   GET  /api/health-records  - 健康紀錄`)
})

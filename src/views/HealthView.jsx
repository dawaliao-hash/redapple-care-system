import { useState, useMemo, useEffect } from 'react'
import {
  ChevronRight, ChevronLeft, Plus, AlertCircle,
  Activity, Heart, Droplets, Wind, FileText, X, Check,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useData } from '../context/DataContext.jsx'
import { isOnline } from '../lib/supabase.js'
import { upsertHealthRecordByDate } from '../api/index.js'
import VitalCard from '../components/VitalCard.jsx'
import LegendDot from '../components/LegendDot.jsx'

// ── 日期工具 ─────────────────────────────────────────────
const fmt = (d) =>
  `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`

const fmtShort = (d) => `${d.getMonth()+1}/${d.getDate()}`

const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

// ── 新增/編輯量測 Modal ──────────────────────────────────
function MeasureModal({ initial, recipientName, caregivers, onSave, onClose }) {
  const isEdit = !!initial
  const nowHHMM = () => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
  }
  const defaultRecorder = caregivers[0]?.name ?? '魏寶玫'

  const [form, setForm] = useState({
    fullDate:  initial?.fullDate  ?? fmt(new Date()),
    time:      initial?.time      ?? nowHHMM(),
    temp:      initial?.temp      != null ? String(initial.temp)      : '',
    pulse:     initial?.pulse     != null ? String(initial.pulse)     : '',
    systolic:  initial?.systolic  != null ? String(initial.systolic)  : '',
    diastolic: initial?.diastolic != null ? String(initial.diastolic) : '',
    weight:    initial?.weight    != null ? String(initial.weight)    : '',
    notes:     initial?.notes     ?? '',
    recorder:  initial?.recorder  ?? defaultRecorder,
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.temp || isNaN(+form.temp) || +form.temp < 34 || +form.temp > 42)
      e.temp = '請輸入正確體溫（34–42 °C）'
    if (!form.pulse || isNaN(+form.pulse) || +form.pulse < 30 || +form.pulse > 200)
      e.pulse = '請輸入正確脈搏（30–200）'
    if (!form.systolic || isNaN(+form.systolic) || +form.systolic < 60 || +form.systolic > 250)
      e.systolic = '請輸入正確收縮壓'
    if (!form.diastolic || isNaN(+form.diastolic) || +form.diastolic < 40 || +form.diastolic > 160)
      e.diastolic = '請輸入正確舒張壓'
    if (!form.recorder.trim()) e.recorder = '請填寫紀錄者'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    const parts = form.fullDate.replace(/-/g, '/').split('/')
    const dateShort = parts.length === 3 ? `${parseInt(parts[1])}/${parseInt(parts[2])}` : fmtShort(new Date())
    onSave({
      fullDate:  form.fullDate.replace(/-/g, '/'),
      date:      dateShort,
      time:      form.time,
      temp:      +parseFloat(form.temp).toFixed(1),
      pulse:     +parseInt(form.pulse),
      systolic:  +parseInt(form.systolic),
      diastolic: +parseInt(form.diastolic),
      weight:    form.weight ? +parseInt(form.weight) : null,
      notes:     form.notes.trim(),
      recorder:  form.recorder.trim(),
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition'
  const inputSt  = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(60,30,15,0.6)' }} onClick={onClose}>
      <div className="rounded-2xl border-2 w-full max-w-lg overflow-hidden"
        style={{ background: '#FFFAF0', borderColor: '#C4A87A', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ background: '#FBF1DD', borderColor: '#E5D5B7' }}>
          <div>
            <h3 className="font-display text-lg font-semibold" style={{ color: '#5C2828' }}>
              {isEdit ? '修改量測紀錄' : '新增量測紀錄'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#8B6F47' }}>長者：{recipientName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-orange-100 transition">
            <X size={20} style={{ color: '#5C2828' }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>日期</label>
              <input type="date" className={inputCls} style={inputSt}
                value={form.fullDate.replace(/\//g, '-')}
                onChange={e => set('fullDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>時間</label>
              <input type="time" className={inputCls} style={inputSt}
                value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl p-4 border" style={{ background: '#FBF6EC', borderColor: '#E5D5B7' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#8B6F47' }}>生命徵象（必填）</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'temp',     label: '體溫 °C',    icon: <Activity size={12}/>, color: '#C68B4F', ph: '36.5', min: 34, max: 42, step: '0.1' },
                { key: 'pulse',    label: '脈搏 bpm',   icon: <Heart size={12}/>,    color: '#A53838', ph: '72',   min: 30, max: 200 },
                { key: 'systolic', label: '收縮壓 mmHg',icon: <Droplets size={12}/>, color: '#5B7B8C', ph: '120',  min: 60, max: 250 },
                { key: 'diastolic',label: '舒張壓 mmHg',icon: <Wind size={12}/>,    color: '#7A9474', ph: '80',   min: 40, max: 160 },
              ].map(f => (
                <div key={f.key}>
                  <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: f.color }}>
                    {f.icon} {f.label}
                  </label>
                  <input type="number" step={f.step ?? '1'} min={f.min} max={f.max}
                    className={inputCls}
                    style={{ ...inputSt, borderColor: errors[f.key] ? '#A53838' : '#C4A87A' }}
                    placeholder={f.ph} value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)} />
                  {errors[f.key] && <p className="text-xs mt-1" style={{ color: '#A53838' }}>{errors[f.key]}</p>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>體重 kg（選填）</label>
            <input type="number" min={20} max={150} className={inputCls} style={inputSt}
              placeholder="例：58" value={form.weight} onChange={e => set('weight', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>異常備記（選填）</label>
            <textarea rows={2} className={inputCls} style={inputSt}
              placeholder="例：頭暈、腳水腫" value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>紀錄者 *</label>
            <select className={inputCls} style={inputSt}
              value={form.recorder} onChange={e => set('recorder', e.target.value)}>
              {caregivers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              <option value="護理師">護理師</option>
              <option value="社工師">社工師</option>
            </select>
          </div>

          {(+form.temp > 37.5 || +form.systolic > 140 || (+form.systolic < 90 && +form.systolic > 0)) && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(165,56,56,0.08)', border: '1px solid rgba(165,56,56,0.3)' }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#A53838' }} />
              <div className="text-xs" style={{ color: '#A53838' }}>
                <p className="font-semibold mb-0.5">偵測到異常數值：</p>
                {+form.temp > 37.5 && <p>· 體溫 {form.temp} °C 偏高</p>}
                {+form.systolic > 140 && <p>· 收縮壓 {form.systolic} mmHg 偏高</p>}
                {+form.systolic < 90 && +form.systolic > 0 && <p>· 收縮壓 {form.systolic} mmHg 偏低</p>}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 border-t" style={{ borderColor: '#E5D5B7' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border transition hover:bg-orange-50"
            style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>取消</button>
          <button onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: '#A53838', color: 'white' }}>
            <Check size={15} /> {isEdit ? '儲存修改' : '儲存量測'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// 主 HealthView
// ════════════════════════════════════════════════════════
export default function HealthView({ healthRecords, setHealthRecords, addHealthRecord, onSelectRecipient }) {
  const { recipients: RECIPIENTS, caregivers: CAREGIVERS } = useData()

  // 左側選擇的長者
  const [pickedId, setPickedId] = useState(RECIPIENTS[0]?.id ?? '')
  useEffect(() => {
    if (pickedId === '' && RECIPIENTS.length > 0) setPickedId(RECIPIENTS[0].id)
  }, [RECIPIENTS, pickedId])

  const recipient = RECIPIENTS.find(r => r.id === pickedId)
  const records   = healthRecords[pickedId] || []

  // ── 7 日視窗（以 viewEndDate 為結尾的 7 天）─────────────
  const today = new Date(); today.setHours(0,0,0,0)
  const [viewEndDate, setViewEndDate] = useState(new Date(today))

  const viewDays = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) days.push(addDays(viewEndDate, -i))
    return days
  }, [viewEndDate])

  const windowRecords = useMemo(() => {
    const start = fmt(viewDays[0])
    const end   = fmt(viewDays[6])
    return viewDays.map(d => {
      const dk = fmt(d)
      const rec = records.find(r => r.fullDate === dk) ?? null
      return { date: d, dk, rec }
    })
  }, [records, viewDays])

  const prevWindow = () => setViewEndDate(d => addDays(d, -7))
  const nextWindow = () => {
    const next = addDays(viewEndDate, 7)
    setViewEndDate(next > today ? new Date(today) : next)
  }

  // ── 趨勢圖月份 ────────────────────────────────────────
  const [chartYear,  setChartYear]  = useState(today.getFullYear())
  const [chartMonth, setChartMonth] = useState(today.getMonth() + 1)
  const [monthInput, setMonthInput] = useState('')

  const chartRecords = useMemo(() => {
    const prefix = `${chartYear}/${String(chartMonth).padStart(2,'0')}`
    return records.filter(r => r.fullDate?.startsWith(prefix))
  }, [records, chartYear, chartMonth])

  const prevChartMonth = () => {
    if (chartMonth === 1) { setChartYear(y => y-1); setChartMonth(12) }
    else setChartMonth(m => m-1)
  }
  const nextChartMonth = () => {
    if (chartMonth === 12) { setChartYear(y => y+1); setChartMonth(1) }
    else setChartMonth(m => m+1)
  }
  const applyMonthInput = () => {
    const m = parseInt(monthInput)
    if (m >= 1 && m <= 12) { setChartMonth(m); setMonthInput('') }
  }

  // ── 最新量測（所有紀錄的最後一筆）─────────────────────
  const lastRecord = records[records.length - 1]

  // ── 平均值 ────────────────────────────────────────────
  const avg = useMemo(() => {
    if (!records.length) return null
    const sum = records.reduce((a, r) => ({
      temp: a.temp + r.temp, pulse: a.pulse + r.pulse,
      systolic: a.systolic + r.systolic, diastolic: a.diastolic + r.diastolic,
    }), { temp: 0, pulse: 0, systolic: 0, diastolic: 0 })
    return {
      temp:      (sum.temp      / records.length).toFixed(1),
      pulse:     Math.round(sum.pulse     / records.length),
      systolic:  Math.round(sum.systolic  / records.length),
      diastolic: Math.round(sum.diastolic / records.length),
    }
  }, [records])

  // ── Modal 控制 ────────────────────────────────────────
  const [modalData, setModalData] = useState(null) // null=關閉, { mode, initial, targetDate }

  const openAdd  = (date) => setModalData({ mode: 'add',  initial: null, targetDate: date })
  const openEdit = (rec)  => setModalData({ mode: 'edit', initial: rec,  targetDate: rec.fullDate })

  const handleSave = async (saved) => {
    const isEdit = modalData?.mode === 'edit'

    if (isEdit) {
      // 更新現有紀錄（按 fullDate 匹配）
      setHealthRecords(prev => ({
        ...prev,
        [pickedId]: (prev[pickedId] ?? []).map(r =>
          r.fullDate === saved.fullDate ? saved : r
        ),
      }))
      if (isOnline) {
        upsertHealthRecordByDate(pickedId, saved).catch(console.error)
      }
    } else {
      // 新增紀錄
      if (addHealthRecord) {
        await addHealthRecord(pickedId, saved)
      } else {
        setHealthRecords(prev => ({
          ...prev,
          [pickedId]: [...(prev[pickedId] ?? []), saved],
        }))
      }
    }
    setModalData(null)
  }

  if (!recipient) return null

  const ROC = chartYear - 1911

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

      {/* 左側長者列表 */}
      <div className="rounded-2xl p-3 border lg:col-span-1 scrollbar-thin"
        style={{ background: '#FFFAF0', borderColor: '#E5D5B7', maxHeight: 700, overflowY: 'auto' }}>
        <h3 className="font-display font-semibold px-2 py-2 mb-1" style={{ color: '#5C2828' }}>選擇長者</h3>
        <div className="space-y-1">
          {RECIPIENTS.map(r => (
            <button key={r.id} onClick={() => setPickedId(r.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between"
              style={{ background: pickedId === r.id ? '#FBE8DC' : 'transparent' }}>
              <div>
                <div className="font-display font-medium"
                  style={{ color: pickedId === r.id ? '#A53838' : '#5C2828' }}>{r.name}</div>
                <div className="text-xs font-mono" style={{ color: '#8B6F47' }}>{r.code}</div>
              </div>
              {pickedId === r.id && <ChevronRight size={16} style={{ color: '#A53838' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* 主內容 */}
      <div className="lg:col-span-3 space-y-5">

        {/* 長者資訊卡 */}
        <div className="rounded-2xl p-5 border flex items-start justify-between flex-wrap gap-4"
          style={{ background: 'linear-gradient(135deg, #FFFAF0, #FBE8DC)', borderColor: '#E5D5B7' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-display font-bold text-2xl"
              style={{ background: '#A53838', color: 'white' }}>{recipient.name[0]}</div>
            <div>
              <h2 className="font-display text-2xl font-semibold" style={{ color: '#5C2828' }}>{recipient.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: '#8B6F47' }}>
                <span>{recipient.gender} · {recipient.age} 歲</span>
                <span>·</span>
                <span className="font-mono">{recipient.code}</span>
                <span>·</span>
                <span className="px-2 py-0.5 rounded-full" style={{ background: '#EAE0CC', color: '#5C3A1E' }}>
                  CMS {recipient.cms}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(recipient.conditions ?? []).map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'rgba(165,56,56,0.1)', color: '#A53838' }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => onSelectRecipient(recipient)}
            className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:shadow-md transition"
            style={{ background: '#A53838', color: 'white' }}>
            <FileText size={16} /> 完整資料
          </button>
        </div>

        {/* 最新量測 + 平均 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <VitalCard icon={<Activity size={18}/>} label="體溫"   value={lastRecord?.temp      ?? '–'} unit="°C"   avg={avg?.temp}      color="#C68B4F"/>
          <VitalCard icon={<Heart size={18}/>}    label="脈搏"   value={lastRecord?.pulse     ?? '–'} unit="bpm"  avg={avg?.pulse}     color="#A53838"/>
          <VitalCard icon={<Droplets size={18}/>} label="收縮壓" value={lastRecord?.systolic  ?? '–'} unit="mmHg" avg={avg?.systolic}  color="#5B7B8C"/>
          <VitalCard icon={<Wind size={18}/>}     label="舒張壓" value={lastRecord?.diastolic ?? '–'} unit="mmHg" avg={avg?.diastolic} color="#7A9474"/>
        </div>

        {/* ── 趨勢圖（可切換月份）── */}
        <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
          {/* 標題列 + 月份導覽 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-display font-semibold" style={{ color: '#5C2828' }}>趨勢圖</h3>
            <div className="flex items-center gap-2">
              <button onClick={prevChartMonth}
                className="p-1.5 rounded-lg hover:bg-orange-100 transition border"
                style={{ borderColor: '#E5D5B7', color: '#5C2828' }}>
                <ChevronLeft size={16}/>
              </button>
              <span className="font-display font-semibold text-sm px-2" style={{ color: '#A53838' }}>
                民國 {ROC} 年 {chartMonth} 月
              </span>
              <button onClick={nextChartMonth}
                className="p-1.5 rounded-lg hover:bg-orange-100 transition border"
                style={{ borderColor: '#E5D5B7', color: '#5C2828' }}>
                <ChevronRight size={16}/>
              </button>
              {/* 直接輸入月份 */}
              <div className="flex items-center gap-1">
                <input
                  type="number" min={1} max={12}
                  className="w-12 px-2 py-1 rounded border text-xs text-center outline-none"
                  style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
                  placeholder="月"
                  value={monthInput}
                  onChange={e => setMonthInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyMonthInput()}
                />
                <button onClick={applyMonthInput}
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: '#EAE0CC', color: '#5C2828' }}>跳至</button>
              </div>
            </div>
          </div>

          {chartRecords.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: '#A09684' }}>
              {chartYear} 年 {chartMonth} 月無量測紀錄
            </div>
          ) : (
            <>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={chartRecords} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE0CC"/>
                    <XAxis dataKey="date" tick={{ fill: '#8B6F47', fontSize: 11 }}/>
                    <YAxis yAxisId="left"  tick={{ fill: '#8B6F47', fontSize: 11 }} domain={['dataMin - 5','dataMax + 5']}/>
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8B6F47', fontSize: 11 }} domain={[35, 38]}/>
                    <Tooltip contentStyle={{ background: '#FFFAF0', border: '1px solid #C4A87A', borderRadius: 8 }}
                      labelStyle={{ color: '#5C2828', fontWeight: 600 }}/>
                    <Line yAxisId="left"  type="monotone" dataKey="systolic"  stroke="#5B7B8C" strokeWidth={2} dot={{ r: 3 }} name="收縮壓"/>
                    <Line yAxisId="left"  type="monotone" dataKey="diastolic" stroke="#7A9474" strokeWidth={2} dot={{ r: 3 }} name="舒張壓"/>
                    <Line yAxisId="left"  type="monotone" dataKey="pulse"     stroke="#A53838" strokeWidth={2} dot={{ r: 3 }} name="脈搏"/>
                    <Line yAxisId="right" type="monotone" dataKey="temp"      stroke="#C68B4F" strokeWidth={2} dot={{ r: 3 }} name="體溫"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs justify-center">
                <LegendDot color="#5B7B8C" label="收縮壓"/>
                <LegendDot color="#7A9474" label="舒張壓"/>
                <LegendDot color="#A53838" label="脈搏"/>
                <LegendDot color="#C68B4F" label="體溫（右軸）"/>
              </div>
            </>
          )}
        </div>

        {/* ── 7 日紀錄（可選視窗 + 點擊編輯）── */}
        <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
          {/* 標題列 + 視窗導覽 + 新增按鈕 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold" style={{ color: '#5C2828' }}>7 日紀錄</h3>
              <button onClick={prevWindow}
                className="p-1 rounded hover:bg-orange-100 transition" style={{ color: '#8B6F47' }}>
                <ChevronLeft size={16}/>
              </button>
              <span className="text-xs font-mono" style={{ color: '#8B6F47' }}>
                {fmt(viewDays[0]).slice(5)} ~ {fmt(viewDays[6]).slice(5)}
              </span>
              <button onClick={nextWindow}
                className="p-1 rounded hover:bg-orange-100 transition"
                style={{ color: viewEndDate >= today ? '#C4A87A' : '#8B6F47',
                         cursor: viewEndDate >= today ? 'not-allowed' : 'pointer' }}
                disabled={viewEndDate >= today}>
                <ChevronRight size={16}/>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs" style={{ color: '#A09684' }}>點擊日期列可修改當日紀錄</p>
              <button onClick={() => openAdd(fmt(today))}
                className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 font-medium hover:shadow-md transition"
                style={{ background: '#A53838', color: 'white' }}>
                <Plus size={14}/> 新增量測
              </button>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#FBF1DD' }}>
                  {['日期','時間','體溫 °C','脈搏','血壓','異常備記','紀錄者'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-display font-semibold"
                      style={{ color: '#5C2828' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {windowRecords.map(({ date, dk, rec }) => {
                  const tempAbnormal = rec && rec.temp > 37.5
                  const bpAbnormal   = rec && (rec.systolic > 140 || rec.systolic < 90)
                  return (
                    <tr
                      key={dk}
                      onClick={() => rec ? openEdit(rec) : openAdd(dk)}
                      className="border-t transition-colors cursor-pointer"
                      style={{ borderColor: '#EAE0CC' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FBE8DC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title={rec ? '點擊修改紀錄' : '點擊新增此日量測'}
                    >
                      <td className="px-3 py-2.5 font-mono" style={{ color: '#5C3A1E' }}>
                        <div className="flex items-center gap-2">
                          {dk}
                          {!rec && (
                            <span className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: '#EAE0CC', color: '#8B6F47' }}>未量測</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: '#8B6F47' }}>
                        {rec?.time ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium"
                        style={{ color: tempAbnormal ? '#A53838' : '#5C2828' }}>
                        {rec ? <>{rec.temp}{tempAbnormal && <AlertCircle size={12} className="inline ml-1"/>}</> : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium" style={{ color: '#5C2828' }}>
                        {rec?.pulse ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium"
                        style={{ color: bpAbnormal ? '#A53838' : '#5C2828' }}>
                        {rec ? (
                          <>{rec.systolic}/{rec.diastolic}{bpAbnormal && <AlertCircle size={12} className="inline ml-1"/>}</>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#8B6F47' }}>
                        {rec?.notes || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#8B6F47' }}>
                        {rec?.recorder ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 量測 Modal（新增 / 編輯）── */}
      {modalData && (
        <MeasureModal
          initial={modalData.initial}
          recipientName={recipient.name}
          caregivers={CAREGIVERS}
          onSave={handleSave}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  )
}

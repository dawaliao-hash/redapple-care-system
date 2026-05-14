import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, Plus, AlertCircle, Activity, Heart, Droplets, Wind, FileText, X, Check } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useData } from '../context/DataContext.jsx'
import VitalCard from '../components/VitalCard.jsx'
import LegendDot from '../components/LegendDot.jsx'

// ── 工具函式 ─────────────────────────────────────────────
const nowFull = () => {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}
const nowDate = () => {
  const d = new Date()
  return `${d.getMonth()+1}/${d.getDate()}`
}
const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── 新增量測 Modal ────────────────────────────────────────
function AddMeasurementModal({ recipientName, caregivers, onSave, onClose }) {
  const defaultRecorder = caregivers[0]?.name ?? '魏寶玫'

  const [form, setForm] = useState({
    fullDate: nowFull(),
    time:     nowTime(),
    temp:     '',
    pulse:    '',
    systolic: '',
    diastolic:'',
    weight:   '',
    notes:    '',
    recorder: defaultRecorder,
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.temp || isNaN(+form.temp) || +form.temp < 34 || +form.temp > 42)
      e.temp = '請輸入正確體溫（34–42 °C）'
    if (!form.pulse || isNaN(+form.pulse) || +form.pulse < 30 || +form.pulse > 200)
      e.pulse = '請輸入正確脈搏（30–200）'
    if (!form.systolic || isNaN(+form.systolic) || +form.systolic < 60 || +form.systolic > 250)
      e.systolic = '請輸入正確收縮壓（60–250）'
    if (!form.diastolic || isNaN(+form.diastolic) || +form.diastolic < 40 || +form.diastolic > 160)
      e.diastolic = '請輸入正確舒張壓（40–160）'
    if (!form.recorder.trim()) e.recorder = '請填寫紀錄者'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    // 從 fullDate 拆出 date 短格式
    const parts = form.fullDate.split('/')
    const dateShort = parts.length === 3
      ? `${parseInt(parts[1])}/${parseInt(parts[2])}`
      : nowDate()

    onSave({
      fullDate:  form.fullDate,
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
      style={{ background: 'rgba(60,30,15,0.6)' }}
      onClick={onClose}>
      <div className="rounded-2xl border-2 w-full max-w-lg overflow-hidden"
        style={{ background: '#FFFAF0', borderColor: '#C4A87A', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ background: '#FBF1DD', borderColor: '#E5D5B7' }}>
          <div>
            <h3 className="font-display text-lg font-semibold" style={{ color: '#5C2828' }}>新增量測紀錄</h3>
            <p className="text-xs mt-0.5" style={{ color: '#8B6F47' }}>長者：{recipientName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-orange-100 transition">
            <X size={20} style={{ color: '#5C2828' }} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">

          {/* 日期 + 時間 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>日期</label>
              <input type="date" className={inputCls} style={inputSt}
                value={form.fullDate.replace(/\//g, '-')}
                onChange={e => set('fullDate', e.target.value.replace(/-/g, '/'))} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>時間</label>
              <input type="time" className={inputCls} style={inputSt}
                value={form.time}
                onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          {/* 生命徵象 */}
          <div className="rounded-xl p-4 border" style={{ background: '#FBF6EC', borderColor: '#E5D5B7' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#8B6F47' }}>生命徵象（必填）</p>
            <div className="grid grid-cols-2 gap-3">

              {/* 體溫 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: '#C68B4F' }}>
                  <Activity size={12} /> 體溫 °C
                </label>
                <input type="number" step="0.1" min="34" max="42"
                  className={inputCls} style={{ ...inputSt, borderColor: errors.temp ? '#A53838' : '#C4A87A' }}
                  placeholder="36.5"
                  value={form.temp}
                  onChange={e => set('temp', e.target.value)} />
                {errors.temp && <p className="text-xs mt-1" style={{ color: '#A53838' }}>{errors.temp}</p>}
              </div>

              {/* 脈搏 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: '#A53838' }}>
                  <Heart size={12} /> 脈搏 bpm
                </label>
                <input type="number" min="30" max="200"
                  className={inputCls} style={{ ...inputSt, borderColor: errors.pulse ? '#A53838' : '#C4A87A' }}
                  placeholder="72"
                  value={form.pulse}
                  onChange={e => set('pulse', e.target.value)} />
                {errors.pulse && <p className="text-xs mt-1" style={{ color: '#A53838' }}>{errors.pulse}</p>}
              </div>

              {/* 收縮壓 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: '#5B7B8C' }}>
                  <Droplets size={12} /> 收縮壓 mmHg
                </label>
                <input type="number" min="60" max="250"
                  className={inputCls} style={{ ...inputSt, borderColor: errors.systolic ? '#A53838' : '#C4A87A' }}
                  placeholder="120"
                  value={form.systolic}
                  onChange={e => set('systolic', e.target.value)} />
                {errors.systolic && <p className="text-xs mt-1" style={{ color: '#A53838' }}>{errors.systolic}</p>}
              </div>

              {/* 舒張壓 */}
              <div>
                <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: '#7A9474' }}>
                  <Wind size={12} /> 舒張壓 mmHg
                </label>
                <input type="number" min="40" max="160"
                  className={inputCls} style={{ ...inputSt, borderColor: errors.diastolic ? '#A53838' : '#C4A87A' }}
                  placeholder="80"
                  value={form.diastolic}
                  onChange={e => set('diastolic', e.target.value)} />
                {errors.diastolic && <p className="text-xs mt-1" style={{ color: '#A53838' }}>{errors.diastolic}</p>}
              </div>
            </div>
          </div>

          {/* 體重（選填） */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>體重 kg（選填）</label>
            <input type="number" min="20" max="150"
              className={inputCls} style={inputSt}
              placeholder="例：58"
              value={form.weight}
              onChange={e => set('weight', e.target.value)} />
          </div>

          {/* 異常備記 */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>異常備記（選填）</label>
            <textarea rows={2} className={inputCls} style={inputSt}
              placeholder="例：頭暈、腳水腫、拒量等異常情形"
              value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>

          {/* 紀錄者 */}
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>紀錄者 *</label>
            <select className={inputCls} style={{ ...inputSt, borderColor: errors.recorder ? '#A53838' : '#C4A87A' }}
              value={form.recorder}
              onChange={e => set('recorder', e.target.value)}>
              {caregivers.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="護理師">護理師</option>
              <option value="社工師">社工師</option>
            </select>
            {errors.recorder && <p className="text-xs mt-1" style={{ color: '#A53838' }}>{errors.recorder}</p>}
          </div>

          {/* 異常預警提示 */}
          {(+form.temp > 37.5 || +form.systolic > 140 || +form.systolic < 90) && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(165,56,56,0.08)', border: '1px solid rgba(165,56,56,0.3)' }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#A53838' }} />
              <div className="text-xs" style={{ color: '#A53838' }}>
                <p className="font-semibold mb-0.5">偵測到異常數值：</p>
                {+form.temp > 37.5 && <p>· 體溫 {form.temp} °C — 高於正常值（≤37.5）</p>}
                {+form.systolic > 140 && <p>· 收縮壓 {form.systolic} mmHg — 偏高（建議 ≤140）</p>}
                {+form.systolic < 90 && +form.systolic > 0 && <p>· 收縮壓 {form.systolic} mmHg — 偏低（建議 ≥90）</p>}
                <p className="mt-1" style={{ color: '#8B6F47' }}>請在備記欄記錄當下情形，並通知護理人員。</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 border-t" style={{ borderColor: '#E5D5B7' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border transition hover:bg-orange-50"
            style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>
            取消
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition hover:shadow-md"
            style={{ background: '#A53838', color: 'white' }}>
            <Check size={15} /> 儲存量測
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 主 HealthView ─────────────────────────────────────────
export default function HealthView({ healthRecords, setHealthRecords, addHealthRecord, onSelectRecipient }) {
  const { recipients: RECIPIENTS, caregivers: CAREGIVERS } = useData()
  const [pickedId, setPickedId]     = useState(RECIPIENTS[0]?.id ?? '')
  const [showModal, setShowModal]   = useState(false)

  // RECIPIENTS 從 Supabase 載入後，確保 pickedId 有效
  useEffect(() => {
    if (pickedId === '' && RECIPIENTS.length > 0) {
      setPickedId(RECIPIENTS[0].id)
    }
  }, [RECIPIENTS, pickedId])

  const recipient  = RECIPIENTS.find(r => r.id === pickedId)
  const records    = healthRecords[pickedId] || []
  const recent     = [...records].slice(-7).reverse()

  const avg = useMemo(() => {
    if (records.length === 0) return null
    const sum = records.reduce((acc, r) => ({
      temp:      acc.temp      + r.temp,
      pulse:     acc.pulse     + r.pulse,
      systolic:  acc.systolic  + r.systolic,
      diastolic: acc.diastolic + r.diastolic,
    }), { temp: 0, pulse: 0, systolic: 0, diastolic: 0 })
    return {
      temp:      (sum.temp      / records.length).toFixed(1),
      pulse:     Math.round(sum.pulse     / records.length),
      systolic:  Math.round(sum.systolic  / records.length),
      diastolic: Math.round(sum.diastolic / records.length),
    }
  }, [records])

  const lastRecord = records[records.length - 1]

  const handleAddRecord = async (newRec) => {
    if (addHealthRecord) {
      await addHealthRecord(pickedId, newRec)
    } else {
      setHealthRecords(prev => ({
        ...prev,
        [pickedId]: [...(prev[pickedId] || []), newRec],
      }))
    }
    setShowModal(false)
  }

  if (!recipient) return null

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
              style={{ background: '#A53838', color: 'white' }}>
              {recipient.name[0]}
            </div>
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
                {recipient.conditions.map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'rgba(165,56,56,0.1)', color: '#A53838' }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => onSelectRecipient(recipient)}
            className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition hover:shadow-md"
            style={{ background: '#A53838', color: 'white' }}>
            <FileText size={16} /> 完整資料
          </button>
        </div>

        {/* 最新量測 + 平均值 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <VitalCard icon={<Activity size={18} />} label="體溫"   value={lastRecord?.temp      ?? '–'} unit="°C"   avg={avg?.temp}      color="#C68B4F" />
          <VitalCard icon={<Heart    size={18} />} label="脈搏"   value={lastRecord?.pulse     ?? '–'} unit="bpm"  avg={avg?.pulse}     color="#A53838" />
          <VitalCard icon={<Droplets size={18} />} label="收縮壓" value={lastRecord?.systolic  ?? '–'} unit="mmHg" avg={avg?.systolic}  color="#5B7B8C" />
          <VitalCard icon={<Wind     size={18} />} label="舒張壓" value={lastRecord?.diastolic ?? '–'} unit="mmHg" avg={avg?.diastolic} color="#7A9474" />
        </div>

        {/* 趨勢圖 */}
        <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
          <h3 className="font-display font-semibold mb-4" style={{ color: '#5C2828' }}>本月趨勢圖（近 30 日）</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE0CC" />
                <XAxis dataKey="date" tick={{ fill: '#8B6F47', fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fill: '#8B6F47', fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8B6F47', fontSize: 11 }} domain={[35, 38]} />
                <Tooltip contentStyle={{ background: '#FFFAF0', border: '1px solid #C4A87A', borderRadius: 8 }}
                  labelStyle={{ color: '#5C2828', fontWeight: 600 }} />
                <Line yAxisId="left"  type="monotone" dataKey="systolic"  stroke="#5B7B8C" strokeWidth={2} dot={{ r: 3 }} name="收縮壓" />
                <Line yAxisId="left"  type="monotone" dataKey="diastolic" stroke="#7A9474" strokeWidth={2} dot={{ r: 3 }} name="舒張壓" />
                <Line yAxisId="left"  type="monotone" dataKey="pulse"     stroke="#A53838" strokeWidth={2} dot={{ r: 3 }} name="脈搏" />
                <Line yAxisId="right" type="monotone" dataKey="temp"      stroke="#C68B4F" strokeWidth={2} dot={{ r: 3 }} name="體溫" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs justify-center">
            <LegendDot color="#5B7B8C" label="收縮壓" />
            <LegendDot color="#7A9474" label="舒張壓" />
            <LegendDot color="#A53838" label="脈搏" />
            <LegendDot color="#C68B4F" label="體溫（右軸）" />
          </div>
        </div>

        {/* 近 7 日紀錄表 */}
        <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold" style={{ color: '#5C2828' }}>近 7 日紀錄</h3>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 font-medium transition hover:shadow-md active:scale-95"
              style={{ background: '#A53838', color: 'white' }}>
              <Plus size={14} /> 新增量測
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: '#A09684' }}>
              尚無量測紀錄，點擊「新增量測」開始記錄
            </div>
          ) : (
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
                  {recent.map((rec, i) => {
                    const tempAbnormal = rec.temp > 37.5
                    const bpAbnormal   = rec.systolic > 140 || rec.systolic < 90
                    return (
                      <tr key={i} className="border-t" style={{ borderColor: '#EAE0CC' }}>
                        <td className="px-3 py-2.5 font-mono" style={{ color: '#5C3A1E' }}>{rec.fullDate}</td>
                        <td className="px-3 py-2.5 font-mono text-xs" style={{ color: '#8B6F47' }}>{rec.time}</td>
                        <td className="px-3 py-2.5 text-center font-medium"
                          style={{ color: tempAbnormal ? '#A53838' : '#5C2828' }}>
                          {rec.temp}
                          {tempAbnormal && <AlertCircle size={12} className="inline ml-1" />}
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium" style={{ color: '#5C2828' }}>{rec.pulse}</td>
                        <td className="px-3 py-2.5 text-center font-medium"
                          style={{ color: bpAbnormal ? '#A53838' : '#5C2828' }}>
                          {rec.systolic}/{rec.diastolic}
                          {bpAbnormal && <AlertCircle size={12} className="inline ml-1" />}
                        </td>
                        <td className="px-3 py-2.5 text-xs" style={{ color: '#8B6F47' }}>
                          {rec.notes || '–'}
                        </td>
                        <td className="px-3 py-2.5 text-xs" style={{ color: '#8B6F47' }}>{rec.recorder}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 新增量測 Modal */}
      {showModal && (
        <AddMeasurementModal
          recipientName={recipient.name}
          caregivers={CAREGIVERS}
          onSave={handleAddRecord}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

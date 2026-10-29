import { useState, useEffect, useMemo, useRef } from 'react'
import { LogOut, Search, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { fetchHealthRecordsByDate, upsertHealthRecordByDate } from '../api/index.js'

// ════════════════════════════════════════════════════════
// 護理師專用畫面（手機優先）：只能登記健康紀錄
// 流程：選日期 → 點長者 → 輸入體溫/脈搏/血壓 → 儲存（或儲存並下一位）
// ════════════════════════════════════════════════════════

const fmt = (d) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
const nowHHMM = () => {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}
const WD = ['日', '一', '二', '三', '四', '五', '六']
const RECORDER_KEY = 'redapple_nurse_recorder'

// 異常提示門檻
const isAbnormal = (r) => r && (r.temp >= 37.5 || r.systolic >= 140 || r.diastolic >= 90 || r.pulse > 100 || r.pulse < 50)

const C = {
  bg: '#FBF6EC', card: '#FFFAF0', line: '#E5D5B7', brown: '#5C2828',
  sub: '#8B6F47', red: '#A53838', green: '#2E6E3E', greenBg: '#DFF0E0',
}

export default function NurseApp({ user, signOut }) {
  const { activeRecipients, loading: dataLoading } = useData()
  const [date, setDate]       = useState(() => new Date())
  const dateStr               = fmt(date)
  const [records, setRecords] = useState({})        // { recipientId: record }（當日）
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('todo')    // 'todo' | 'done' | 'all'
  const [search, setSearch]   = useState('')
  const [editing, setEditing] = useState(null)      // 正在登記的長者

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchHealthRecordsByDate(dateStr).then(r => { if (alive) { setRecords(r); setLoading(false) } })
    return () => { alive = false }
  }, [dateStr])

  const doneCount = activeRecipients.filter(r => records[r.id]).length
  const list = useMemo(() => activeRecipients.filter(r => {
    if (search && !r.name.includes(search) && !(r.code || '').includes(search)) return false
    if (filter === 'todo') return !records[r.id]
    if (filter === 'done') return !!records[r.id]
    return true
  }), [activeRecipients, records, filter, search])

  const shiftDate = (n) => setDate(d => { const x = new Date(d); x.setDate(x.getDate() + n); return x })
  const isToday = dateStr === fmt(new Date())

  const handleSaved = (rid, rec, goNext) => {
    const next = { ...records, [rid]: rec }
    setRecords(next)
    if (goNext) {
      const nextR = activeRecipients.find(r => r.id !== rid && !next[r.id])
      setEditing(nextR ?? null)
    } else {
      setEditing(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: '#3D2817' }}>
      {/* 頂部：機構 + 登出 */}
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b"
        style={{ background: C.card, borderColor: C.line }}>
        <div className="min-w-0">
          <div className="font-display font-bold text-lg" style={{ color: C.brown }}>🍎 健康紀錄</div>
          <div className="text-xs truncate" style={{ color: C.sub }}>護理師 · {user?.email}</div>
        </div>
        <button onClick={() => window.confirm('確定要登出嗎？') && signOut()}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm border"
          style={{ borderColor: C.line, color: C.sub }}>
          <LogOut size={16} /> 登出
        </button>
      </header>

      <div className="px-4 py-4 space-y-3 max-w-xl mx-auto">
        {/* 日期切換 */}
        <div className="flex items-center justify-between rounded-2xl p-2 border" style={{ background: C.card, borderColor: C.line }}>
          <button onClick={() => shiftDate(-1)} className="p-3 rounded-xl" style={{ color: C.brown }} aria-label="前一天">
            <ChevronLeft size={22} />
          </button>
          <label className="text-center relative">
            <div className="font-display font-bold text-lg" style={{ color: isToday ? C.red : C.brown }}>
              {date.getMonth() + 1}/{date.getDate()}（{WD[date.getDay()]}）{isToday && ' 今天'}
            </div>
            <div className="text-xs" style={{ color: C.sub }}>點此選擇日期</div>
            <input type="date" className="absolute inset-0 opacity-0"
              value={dateStr.replace(/\//g, '-')}
              onChange={e => e.target.value && setDate(new Date(e.target.value + 'T00:00:00'))} />
          </label>
          <button onClick={() => shiftDate(1)} className="p-3 rounded-xl" style={{ color: C.brown }} aria-label="後一天">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* 進度 */}
        <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm" style={{ color: C.sub }}>已量測</span>
            <span className="font-display font-bold text-2xl" style={{ color: C.brown }}>
              {doneCount}<span className="text-base font-normal" style={{ color: C.sub }}> / {activeRecipients.length} 位</span>
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EAE0CC' }}>
            <div className="h-full transition-all" style={{
              width: `${activeRecipients.length ? doneCount / activeRecipients.length * 100 : 0}%`,
              background: '#7A9474' }} />
          </div>
        </div>

        {/* 篩選 */}
        <div className="grid grid-cols-3 gap-2">
          {[['todo', `未量測 ${activeRecipients.length - doneCount}`], ['done', `已量測 ${doneCount}`], ['all', '全部']].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="py-2.5 rounded-xl text-sm font-semibold border"
              style={{
                background: filter === k ? C.red : C.card,
                color:      filter === k ? 'white' : C.sub,
                borderColor: filter === k ? C.red : C.line,
              }}>{label}</button>
          ))}
        </div>

        {/* 搜尋 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.sub }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜尋長者姓名或編號"
            className="w-full pl-9 pr-3 py-3 rounded-xl border text-base outline-none"
            style={{ background: C.card, borderColor: C.line, color: C.brown }} />
        </div>

        {/* 長者清單 */}
        {(loading || dataLoading) ? (
          <p className="text-center py-10 text-sm" style={{ color: C.sub }}>載入中⋯</p>
        ) : list.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: C.sub }}>
            {filter === 'todo' ? '🎉 今天都量完了！' : '沒有符合的長者'}
          </p>
        ) : (
          <div className="space-y-2 pb-10">
            {list.map(r => {
              const rec = records[r.id]
              const abn = isAbnormal(rec)
              return (
                <button key={r.id} onClick={() => setEditing(r)}
                  className="w-full text-left rounded-2xl p-4 border flex items-center gap-3 active:scale-[0.99] transition"
                  style={{ background: rec ? (abn ? '#FBE8DC' : C.greenBg) : C.card, borderColor: rec ? (abn ? '#E8B4A0' : '#B8DDBE') : C.line }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                    style={{ background: rec ? (abn ? C.red : '#7A9474') : '#C4A87A' }}>
                    {rec ? <Check size={20} /> : r.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-lg" style={{ color: C.brown }}>{r.name}</div>
                    {rec ? (
                      <div className="text-sm font-mono" style={{ color: abn ? C.red : C.green }}>
                        {rec.temp}° · 脈 {rec.pulse} · {rec.systolic}/{rec.diastolic}
                        {abn && ' ⚠︎'}
                      </div>
                    ) : (
                      <div className="text-sm" style={{ color: C.sub }}>{r.code} · 未量測</div>
                    )}
                  </div>
                  <ChevronRight size={20} style={{ color: C.sub }} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {editing && (
        <MeasureSheet
          key={editing.id}
          recipient={editing}
          dateStr={dateStr}
          initial={records[editing.id]}
          defaultRecorder={user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

// ── 全螢幕量測表單 ────────────────────────────────────────
function MeasureSheet({ recipient, dateStr, initial, defaultRecorder, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    let rememberedRecorder = ''
    try { rememberedRecorder = localStorage.getItem(RECORDER_KEY) || '' } catch {}
    return {
      time:      initial?.time ?? nowHHMM(),
      temp:      initial?.temp != null ? String(initial.temp) : '',
      pulse:     initial?.pulse != null ? String(initial.pulse) : '',
      systolic:  initial?.systolic != null ? String(initial.systolic) : '',
      diastolic: initial?.diastolic != null ? String(initial.diastolic) : '',
      notes:     initial?.notes ?? '',
      recorder:  initial?.recorder ?? (rememberedRecorder || defaultRecorder),
    }
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const firstRef = useRef(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.temp || isNaN(+form.temp) || +form.temp < 34 || +form.temp > 42) e.temp = '34–42 °C'
    if (!form.pulse || isNaN(+form.pulse) || +form.pulse < 30 || +form.pulse > 200) e.pulse = '30–200'
    if (!form.systolic || isNaN(+form.systolic) || +form.systolic < 60 || +form.systolic > 250) e.systolic = '60–250'
    if (!form.diastolic || isNaN(+form.diastolic) || +form.diastolic < 40 || +form.diastolic > 160) e.diastolic = '40–160'
    if (!form.recorder.trim()) e.recorder = '請填寫紀錄者'
    return e
  }

  const save = async (goNext) => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true); setSaveErr('')
    const [, m, d] = dateStr.split('/')
    const rec = {
      fullDate: dateStr, date: `${+m}/${+d}`, time: form.time,
      temp: +form.temp, pulse: +form.pulse, systolic: +form.systolic, diastolic: +form.diastolic,
      weight: initial?.weight ?? null, notes: form.notes.trim(), recorder: form.recorder.trim(),
    }
    try {
      await upsertHealthRecordByDate(recipient.id, rec)
      try { localStorage.setItem(RECORDER_KEY, rec.recorder) } catch {}
      onSaved(recipient.id, rec, goNext)
    } catch (err) {
      console.error(err)
      setSaveErr('儲存失敗，請檢查網路後再試一次')
      setSaving(false)
    }
  }

  const Num = ({ k, label, unit, ph, decimal, inputRef }) => (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: C.sub }}>{label}</label>
      <div className="relative">
        <input ref={inputRef} type="number" inputMode={decimal ? 'decimal' : 'numeric'} step={decimal ? '0.1' : '1'}
          value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
          className="w-full px-4 py-4 pr-14 rounded-2xl border-2 text-2xl font-bold outline-none"
          style={{ background: 'white', borderColor: errors[k] ? C.red : C.line, color: C.brown }} />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.sub }}>{unit}</span>
      </div>
      {errors[k] && <p className="text-xs mt-1" style={{ color: C.red }}>請輸入 {errors[k]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.bg }}>
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ background: C.card, borderColor: C.line }}>
        <button onClick={onClose} className="p-2 -ml-2" aria-label="關閉"><X size={24} style={{ color: C.brown }} /></button>
        <div className="text-center">
          <div className="font-display font-bold text-xl" style={{ color: C.brown }}>{recipient.name}</div>
          <div className="text-xs" style={{ color: C.sub }}>{dateStr} · {initial ? '修改紀錄' : '新增紀錄'}</div>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-xl w-full mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {Num({ k: 'temp', label: '體溫', unit: '°C', ph: '36.5', decimal: true, inputRef: firstRef })}
          {Num({ k: 'pulse', label: '脈搏', unit: 'bpm', ph: '72' })}
          {Num({ k: 'systolic', label: '收縮壓（高）', unit: 'mmHg', ph: '120' })}
          {Num({ k: 'diastolic', label: '舒張壓（低）', unit: 'mmHg', ph: '80' })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: C.sub }}>時間</label>
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
              className="w-full px-3 py-3 rounded-xl border text-base outline-none"
              style={{ background: 'white', borderColor: C.line, color: C.brown }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: C.sub }}>紀錄者</label>
            <input value={form.recorder} onChange={e => set('recorder', e.target.value)}
              className="w-full px-3 py-3 rounded-xl border text-base outline-none"
              style={{ background: 'white', borderColor: errors.recorder ? C.red : C.line, color: C.brown }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: C.sub }}>異常備記（選填）</label>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="例：精神較差、咳嗽"
            className="w-full px-3 py-3 rounded-xl border text-base outline-none"
            style={{ background: 'white', borderColor: C.line, color: C.brown }} />
        </div>

        {saveErr && <p className="text-sm p-3 rounded-xl" style={{ background: '#FBE8DC', color: C.red }}>{saveErr}</p>}
      </div>

      {/* 底部固定按鈕（拇指好按） */}
      <div className="px-4 pt-3 pb-6 border-t grid grid-cols-2 gap-3 max-w-xl w-full mx-auto"
        style={{ background: C.card, borderColor: C.line, paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <button disabled={saving} onClick={() => save(false)}
          className="py-4 rounded-2xl text-base font-semibold border-2"
          style={{ borderColor: C.red, color: C.red, background: 'white', opacity: saving ? 0.6 : 1 }}>
          儲存
        </button>
        <button disabled={saving} onClick={() => save(true)}
          className="py-4 rounded-2xl text-base font-semibold text-white"
          style={{ background: C.red, opacity: saving ? 0.6 : 1 }}>
          {saving ? '儲存中⋯' : '儲存並下一位 →'}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Users, UserCheck, AlertTriangle, RotateCcw, Cloud, HardDrive, ArchiveRestore, Archive } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { isOnline } from '../lib/supabase.js'

// ── 顏色選項（照服員） ────────────────────────────────
const CG_COLORS = ['#B8543A','#7A9474','#C68B4F','#8E6BA8','#5B7B8C',
                   '#4A7FA5','#A0522D','#6B8E6B','#B8860B','#8B4789']

const BATH_OPTIONS = ['一','二','三','四','五']

// ── 服務身份類別（政府報表用）────────────────────────────
const SERVICE_CATEGORIES = [
  { value: 'elderly',        label: '65歲以上老人',         desc: '含IADLs失能且獨居之老人' },
  { value: 'disabled_65up',  label: '65歲以上身障',          desc: '領有身心障礙證明者' },
  { value: 'disabled_64down',label: '64歲以下身障',          desc: '領有身心障礙證明者' },
  { value: 'indigenous',     label: '55-64歲原住民',        desc: '' },
  { value: 'dementia',       label: '50歲以上失智症者',      desc: '' },
]

// ── 身障證明 ──────────────────────────────────────────────
const DISABILITY_CATEGORIES = [
  { value: '1', label: '第一類', desc: '神經系統構造及精神、心智功能' },
  { value: '2', label: '第二類', desc: '眼、耳及相關構造與感官功能及疼痛' },
  { value: '3', label: '第三類', desc: '聲音與言語構造及其功能' },
  { value: '4', label: '第四類', desc: '循環、造血、免疫與呼吸系統構造及其功能' },
  { value: '5', label: '第五類', desc: '消化、新陳代謝與內分泌系統相關構造及其功能' },
  { value: '6', label: '第六類', desc: '泌尿與生殖系統相關構造及其功能' },
  { value: '7', label: '第七類', desc: '神經、肌肉、骨骼之移動相關構造及其功能' },
  { value: '8', label: '第八類', desc: '皮膚與相關構造及其功能' },
]
const DISABILITY_LEVELS = ['輕度', '中度', '重度', '極重度']
const DISABILITY_MAX = 3

const LEVEL_OPTIONS = [
  { value: '第一類', label: '第一類', desc: '低收入戶' },
  { value: '第二類', label: '第二類', desc: '中低收入戶' },
  { value: '第三類', label: '第三類', desc: '一般戶' },
]
const CMS_OPTIONS   = [1,2,3,4,5,6,7,8]

// ── 共用 style ────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-cranberry'
const inputSt  = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }
const labelSt  = { color: '#8B6F47', fontSize: 12, marginBottom: 4, display: 'block' }

// ════════════════════════════════════════════════════════
// 長者表單 Modal
// ════════════════════════════════════════════════════════
// 民國年 ↔ 西元年轉換（民國元年 = 西元1912）
const ROC_OFFSET = 1911
function calcAgeFromBirth(y, m, d) {
  if (!y || !m || !d) return null
  const today = new Date()
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--
  return age >= 0 ? age : null
}

// 確保 disabilities 永遠是 { categories: [], level: '輕度' } 格式
function normalizeDisabilities(d) {
  if (!d || Array.isArray(d)) return { categories: [], level: '輕度' }
  return {
    categories: Array.isArray(d.categories) ? d.categories : [],
    level: d.level ?? '輕度',
  }
}

function RecipientModal({ initial, caregivers, allRecipients, onSave, onClose }) {
  const isNew = !initial?.id
  const [form, setForm] = useState(() => {
    if (!initial) return {
      id: `r${Date.now()}`, code: '', name: '', gender: '女', age: '',
      cms: 5, primaryCaregiver: '',   // 預設未選擇
      conditions: [], emergencyContact: '', phone: '', address: '',
      bathDays: [], notes: '', level: '第三類',
      disabilities: { categories: [], level: '輕度' },
      serviceCategory: 'elderly',
    }
    return { ...initial, disabilities: normalizeDisabilities(initial.disabilities) }
  })
  const [condInput, setCondInput] = useState((initial?.conditions ?? []).join('、'))
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)   // 防呆：送出中鎖定，避免連點重複新增

  // 出生年月日（民國）— UI only，計算後寫入 form.age
  const [bY, setBY] = useState('')  // 民國年
  const [bM, setBM] = useState('')
  const [bD, setBD] = useState('')

  const computedAge = calcAgeFromBirth(
    bY ? Number(bY) + ROC_OFFSET : null,
    bM ? Number(bM) : null,
    bD ? Number(bD) : null,
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleBath = (day) => set('bathDays',
    form.bathDays.includes(day)
      ? form.bathDays.filter(d => d !== day)
      : [...form.bathDays, day]
  )

  const handleSave = () => {
    if (saving) return                                   // 防呆①：避免連點重複送出
    if (!form.name.trim()) { setErr('請填寫姓名'); return }
    if (!form.code.trim()) { setErr('請填寫個案編號'); return }
    const codeNorm = form.code.trim()
    // 防呆②：個案編號不可重複（去空白比對，排除自己）
    const dup = (allRecipients ?? []).find(r =>
      r.id !== form.id && (r.code || '').trim() === codeNorm
    )
    if (dup) {
      setErr(`個案編號「${codeNorm}」已存在（${dup.name}${dup.isActive === false ? '，已結案' : ''}），不可重複新增`)
      return
    }
    setSaving(true)
    const age = computedAge ?? (form.age !== '' ? Number(form.age) : 0)
    onSave({ ...form, code: codeNorm, conditions: condInput.split(/[、,，\s]+/).filter(Boolean), age })
  }

  // 民國年選項：民國20年(1931)到民國120年(2031)
  const rocYears = Array.from({ length: 101 }, (_, i) => 20 + i)
  const months   = Array.from({ length: 12 }, (_, i) => i + 1)
  const days     = Array.from({ length: 31 }, (_, i) => i + 1)
  const selSt    = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828',
                     borderWidth: 1, borderStyle: 'solid', borderRadius: 8,
                     padding: '6px 8px', fontSize: 13, outline: 'none' }

  return (
    <Overlay onClose={onClose}>
      <ModalBox title={isNew ? '新增長者' : `編輯：${initial.name}`} onClose={onClose}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="姓名 *">
            <input className={inputCls} style={inputSt} value={form.name}
              onChange={e => set('name', e.target.value)} placeholder="例：黃淑" />
          </Field>
          <Field label="個案編號 *">
            <input className={inputCls} style={inputSt} value={form.code}
              onChange={e => set('code', e.target.value)} placeholder="例：108I01011" />
          </Field>
          <Field label="性別">
            <div className="flex gap-2">
              {['女','男'].map(g => (
                <button key={g} onClick={() => set('gender', g)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium border transition"
                  style={{ background: form.gender === g ? '#A53838' : '#FBF6EC',
                           color: form.gender === g ? 'white' : '#5C3A1E',
                           borderColor: '#C4A87A' }}>
                  {g}
                </button>
              ))}
            </div>
          </Field>
          <Field label="出生年月日">
            <div className="space-y-1.5">
              <div className="flex gap-1.5 items-center">
                <select value={bY} onChange={e => setBY(e.target.value)} style={selSt}>
                  <option value="">民國年</option>
                  {rocYears.map(y => <option key={y} value={y}>民國{y}年</option>)}
                </select>
                <select value={bM} onChange={e => setBM(e.target.value)} style={selSt}>
                  <option value="">月</option>
                  {months.map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
                <select value={bD} onChange={e => setBD(e.target.value)} style={selSt}>
                  <option value="">日</option>
                  {days.map(d => <option key={d} value={d}>{d}日</option>)}
                </select>
              </div>
              {computedAge !== null ? (
                <div className="flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: '#A53838' }}>
                  <span>→</span>
                  <span>年齡：{computedAge} 歲</span>
                </div>
              ) : form.age ? (
                <div className="text-xs" style={{ color: '#8B6F47' }}>目前年齡：{form.age} 歲</div>
              ) : null}
            </div>
          </Field>
          <Field label="CMS 等級">
            <div className="flex gap-1 flex-wrap">
              {CMS_OPTIONS.map(n => (
                <button key={n} onClick={() => set('cms', n)}
                  className="w-9 h-9 rounded-lg text-sm font-bold border transition"
                  style={{ background: form.cms === n ? '#A53838' : '#FBF6EC',
                           color: form.cms === n ? 'white' : '#5C3A1E',
                           borderColor: '#C4A87A' }}>
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field label="身分別">
            <div className="flex gap-2 flex-wrap">
              {LEVEL_OPTIONS.map(({ value, label, desc }) => (
                <button key={value} onClick={() => set('level', value)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border transition flex flex-col items-center leading-tight"
                  style={{ background: form.level === value ? '#C68B4F' : '#FBF6EC',
                           color: form.level === value ? 'white' : '#5C3A1E',
                           borderColor: '#C4A87A', minWidth: 72 }}>
                  <span>{label}</span>
                  <span style={{ fontSize: 10, opacity: 0.8 }}>{desc}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="服務身份類別（政府報表）" cls="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map(({ value, label, desc }) => (
                <button key={value} onClick={() => set('serviceCategory', value)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border transition flex flex-col items-start leading-tight"
                  style={{ background: form.serviceCategory === value ? '#5B7B8C' : '#FBF6EC',
                           color: form.serviceCategory === value ? 'white' : '#5C3A1E',
                           borderColor: '#C4A87A', minWidth: 80 }}>
                  <span>{label}</span>
                  {desc && <span style={{ fontSize: 10, opacity: 0.8 }}>{desc}</span>}
                </button>
              ))}
            </div>
          </Field>
          <Field label="主責照服員">
            <div className="space-y-2">
              {/* 未選擇選項 */}
              <label className="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition hover:bg-orange-50"
                style={{ borderColor: form.primaryCaregiver === '' ? '#A53838' : '#C4A87A',
                         background: form.primaryCaregiver === '' ? '#FBE8DC' : '#FBF6EC' }}>
                <input type="radio" name="caregiver" value=""
                  checked={form.primaryCaregiver === ''}
                  onChange={() => set('primaryCaregiver', '')}
                  style={{ accentColor: '#A53838' }} />
                <span className="text-sm italic" style={{ color: '#A09684' }}>（目前沒有照服員）</span>
              </label>
              {/* 各照服員選項 */}
              {caregivers.map(c => {
                const MAX = 8
                // 計算此照服員目前的負責人數（排除正在編輯的這位長者本人）
                const load = (allRecipients ?? []).filter(r =>
                  r.primaryCaregiver === c.id && r.id !== form.id && r.isActive !== false
                ).length
                const isFull    = load >= MAX
                const isSelected = form.primaryCaregiver === c.id
                return (
                  <label key={c.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition ${isFull && !isSelected ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-orange-50'}`}
                    style={{ borderColor: isSelected ? '#A53838' : '#C4A87A',
                             background: isSelected ? '#FBE8DC' : '#FBF6EC' }}>
                    <input type="radio" name="caregiver" value={c.id}
                      checked={isSelected}
                      disabled={isFull && !isSelected}
                      onChange={() => !isFull && set('primaryCaregiver', c.id)}
                      style={{ accentColor: '#A53838' }} />
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: c.color }}>{c.avatar}</div>
                    <span className="text-sm font-medium flex-1" style={{ color: '#5C2828' }}>{c.name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#EAE0CC' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${Math.min(load / MAX * 100, 100)}%`,
                                   background: isFull ? '#A53838' : '#7A9474' }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: isFull ? '#A53838' : '#8B6F47' }}>
                        {load}/{MAX}
                      </span>
                      {isFull && !isSelected && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: '#A53838', color: 'white' }}>已額滿</span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </Field>
          <Field label="洗澡日">
            <div className="flex gap-1">
              {BATH_OPTIONS.map(d => (
                <button key={d} onClick={() => toggleBath(d)}
                  className="w-9 h-9 rounded-lg text-sm font-medium border transition"
                  style={{ background: form.bathDays.includes(d) ? '#7A9474' : '#FBF6EC',
                           color: form.bathDays.includes(d) ? 'white' : '#5C3A1E',
                           borderColor: '#C4A87A' }}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="健康狀況（逗號分隔）" cls="sm:col-span-2">
            <input className={inputCls} style={inputSt} value={condInput}
              onChange={e => setCondInput(e.target.value)} placeholder="例：高血壓、糖尿病" />
          </Field>
          <Field label="緊急聯絡人">
            <input className={inputCls} style={inputSt} value={form.emergencyContact}
              onChange={e => set('emergencyContact', e.target.value)} placeholder="例：黃大哥" />
          </Field>
          <Field label="聯絡電話">
            <input className={inputCls} style={inputSt} value={form.phone}
              onChange={e => set('phone', e.target.value)} placeholder="例：0912-345-678" />
          </Field>
          <Field label="住址" cls="sm:col-span-2">
            <input className={inputCls} style={inputSt} value={form.address}
              onChange={e => set('address', e.target.value)} placeholder="例：雲林縣水林鄉信義路 12 號" />
          </Field>
          <Field label="備註" cls="sm:col-span-2">
            <textarea rows={2} className={inputCls} style={inputSt} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="特殊注意事項" />
          </Field>

          {/* ── 身障證明 ── */}
          <Field label="身障證明（最多 3 類）" cls="sm:col-span-2">
            <div className="space-y-2">
              {/* 已選類別列表 */}
              {(form.disabilities?.categories ?? []).map((cat, idx) => {
                const catInfo = DISABILITY_CATEGORIES.find(c => c.value === cat)
                return (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={cat}
                      onChange={e => {
                        const next = [...(form.disabilities?.categories ?? [])]
                        next[idx] = e.target.value
                        set('disabilities', { ...form.disabilities, categories: next })
                      }}
                      style={{ ...selSt, flex: 1, minWidth: 0 }}>
                      {DISABILITY_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label} {c.desc}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const next = (form.disabilities?.categories ?? []).filter((_, i) => i !== idx)
                        set('disabilities', { ...form.disabilities, categories: next })
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition flex-shrink-0"
                      style={{ color: '#A53838' }} title="移除">
                      <X size={14} />
                    </button>
                  </div>
                )
              })}

              {/* 新增類別按鈕 */}
              {(form.disabilities?.categories ?? []).length < DISABILITY_MAX && (
                <button
                  onClick={() => set('disabilities', {
                    ...form.disabilities,
                    categories: [...(form.disabilities?.categories ?? []), '1'],
                    level: form.disabilities?.level ?? '輕度',
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition hover:bg-orange-50"
                  style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>
                  <Plus size={13} /> 新增障礙類別
                </button>
              )}

              {/* 障礙等級：只在有選類別時顯示，共用一個 */}
              {(form.disabilities?.categories ?? []).length > 0 && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-sm flex-shrink-0" style={{ color: '#8B6F47' }}>障礙等級</span>
                  <select
                    value={form.disabilities?.level ?? '輕度'}
                    onChange={e => set('disabilities', { ...form.disabilities, level: e.target.value })}
                    style={{ ...selSt, width: 110 }}>
                    {DISABILITY_LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 標籤預覽 */}
              {(form.disabilities?.categories ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(form.disabilities.categories).map((cat, idx) => {
                    const catInfo = DISABILITY_CATEGORIES.find(c => c.value === cat)
                    return (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ background: '#E8D5F5', color: '#6B3FA0' }}>
                        {catInfo?.label ?? `第${cat}類`}・{form.disabilities.level ?? '輕度'}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </Field>
        </div>
        {err && (
          <div className="mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
            style={{ background: '#FBE8DC', color: '#A53838' }}>
            <AlertTriangle size={14} />{err}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border transition hover:bg-orange-50"
            style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>取消</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
            style={{ background: saving ? '#D9C9A8' : '#A53838', color: saving ? '#8B6F47' : 'white',
                     cursor: saving ? 'not-allowed' : 'pointer' }}>
            <Check size={15} />{saving ? '儲存中⋯' : (isNew ? '新增' : '儲存')}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

// ════════════════════════════════════════════════════════
// 照服員離職 Modal
// ════════════════════════════════════════════════════════
function ResignModal({ caregiver, onConfirm, onClose }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`
  const [resignedAt, setResignedAt] = useState(todayStr)
  const [resignReason, setReason]   = useState('')
  return (
    <Overlay onClose={onClose}>
      <ModalBox title={`離職：${caregiver.name}`} onClose={onClose} maxW={400}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>離職日期 *</label>
            <input type="date" className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
              value={resignedAt.replace(/\//g, '-')}
              onChange={e => setResignedAt(e.target.value.replace(/-/g, '/'))} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>離職原因（選填）</label>
            <textarea rows={3} className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
              placeholder="例：個人因素、轉職…"
              value={resignReason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border transition hover:bg-orange-50"
            style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>取消</button>
          <button onClick={() => onConfirm(resignedAt, resignReason)}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: '#A53838', color: 'white' }}>
            <Archive size={14} /> 確認離職
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

// ════════════════════════════════════════════════════════
// 照服員表單 Modal（含指定負責長者）
// ════════════════════════════════════════════════════════
function CaregiverModal({ initial, allCaregivers, allRecipients, onSave, onClose }) {
  const isNew = !initial?.id

  // 產生下一個順序 ID：找現有最大數字 + 1
  const nextId = (() => {
    const nums = (allCaregivers ?? [])
      .map(c => parseInt(c.id.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n))
    const max = nums.length ? Math.max(...nums) : 0
    return `c${max + 1}`
  })()

  const [form, setForm] = useState(initial ?? {
    id: nextId, name: '', avatar: '', color: CG_COLORS[0],
  })
  const [err, setErr] = useState('')
  const [recSearch, setRecSearch] = useState('')

  // 目前已分配給此照服員的長者 ID 清單
  const [selectedIds, setSelectedIds] = useState(
    () => allRecipients.filter(r => r.primaryCaregiver === initial?.id).map(r => r.id)
  )

  const MAX = 8
  const overLimit = selectedIds.length > MAX

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleRecipient = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      // 勾選時若已達上限，更新 err 提示但不阻止（讓 handleSave 把關）
      return [...prev, id]
    })
    setErr('')   // 清除舊錯誤，讓即時計數提示負責
  }

  const filteredRecs = allRecipients.filter(r =>
    !recSearch || r.name.includes(recSearch) || r.code.includes(recSearch)
  )

  const handleSave = () => {
    if (!form.name.trim()) { setErr('請填寫姓名'); return }
    if (overLimit) {
      setErr(`已選 ${selectedIds.length} 位，超過每位照服員 ${MAX} 位上限，請取消部分選取後再儲存。`)
      return
    }
    onSave({ ...form, avatar: form.name[0] ?? '?' }, selectedIds)
  }

  return (
    <Overlay onClose={onClose}>
      <ModalBox title={isNew ? '新增照服員' : `編輯：${initial.name}`} onClose={onClose} maxW={560}>
        <div className="space-y-4">
          {/* 基本資料 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="姓名 *" cls="col-span-2 sm:col-span-1">
              <input className={inputCls} style={inputSt} value={form.name}
                onChange={e => set('name', e.target.value)} placeholder="例：魏寶玫" />
            </Field>
            <Field label="代表顏色" cls="col-span-2 sm:col-span-1">
              <div className="flex gap-1.5 flex-wrap">
                {CG_COLORS.map(c => (
                  <button key={c} onClick={() => set('color', c)}
                    className="w-7 h-7 rounded-full border-4 transition"
                    style={{ background: c, borderColor: form.color === c ? '#5C2828' : 'transparent' }} />
                ))}
              </div>
            </Field>
          </div>

          {/* 預覽 + 即時計數 */}
          <div className="flex items-center gap-3 p-3 rounded-xl border"
            style={{
              background: overLimit ? 'rgba(165,56,56,0.06)' : '#FBF6EC',
              borderColor: overLimit ? '#A53838' : '#E5D5B7',
            }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: form.color }}>{form.name[0] ?? '？'}</div>
            <div className="flex-1">
              <div className="font-display font-semibold text-sm" style={{ color: '#5C2828' }}>{form.name || '姓名預覽'}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold"
                  style={{ color: overLimit ? '#A53838' : selectedIds.length === MAX ? '#C68B4F' : '#7A9474' }}>
                  {selectedIds.length} / {MAX}
                </span>
                <span className="text-xs" style={{ color: '#8B6F47' }}>位長者</span>
                {overLimit && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: '#A53838', color: 'white' }}>
                    超過上限 {selectedIds.length - MAX} 位
                  </span>
                )}
                {!overLimit && selectedIds.length === MAX && (
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: '#FBE8DC', color: '#A53838' }}>已滿</span>
                )}
              </div>
            </div>
          </div>

          {/* 超過上限時的錯誤橫幅 */}
          {overLimit && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border"
              style={{ background: '#FBE8DC', borderColor: '#A53838' }}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#A53838' }} />
              <p className="text-sm" style={{ color: '#5C2828' }}>
                已選 <strong>{selectedIds.length}</strong> 位，超過每位照服員 <strong>{MAX}</strong> 位的服務上限。
                請取消至少 <strong>{selectedIds.length - MAX}</strong> 位後才能儲存。
              </p>
            </div>
          )}

          {/* 指定負責長者 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: '#8B6F47' }}>
                指定負責長者（可多選，上限 {MAX} 位）
              </label>
              <button className="text-xs underline" style={{ color: '#A53838' }}
                onClick={() => setSelectedIds([])}>全部取消</button>
            </div>
            {/* 搜尋 */}
            <input
              className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none mb-2"
              style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
              placeholder="搜尋姓名或編號…"
              value={recSearch}
              onChange={e => setRecSearch(e.target.value)}
            />
            {/* 長者清單 */}
            <div className="rounded-xl border overflow-y-auto"
              style={{ borderColor: '#E5D5B7', maxHeight: 220 }}>
              {filteredRecs.map(r => {
                const checked = selectedIds.includes(r.id)
                const otherCg = !checked && r.primaryCaregiver && r.primaryCaregiver !== initial?.id
                return (
                  <label key={r.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b hover:bg-orange-50 transition"
                    style={{ borderColor: '#EAE0CC' }}>
                    <input type="checkbox" checked={checked}
                      onChange={() => toggleRecipient(r.id)}
                      className="rounded" style={{ accentColor: '#A53838' }} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm" style={{ color: '#5C2828' }}>{r.name}</span>
                      <span className="text-xs ml-2 font-mono" style={{ color: '#A09684' }}>{r.code}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: '#EAE0CC', color: '#5C3A1E' }}>CMS {r.cms}</span>
                      {otherCg && (
                        <span className="text-xs" style={{ color: '#C68B4F' }}>已分配他人</span>
                      )}
                    </div>
                  </label>
                )
              })}
              {filteredRecs.length === 0 && (
                <div className="py-6 text-center text-xs" style={{ color: '#A09684' }}>沒有符合的長者</div>
              )}
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
            style={{ background: '#FBE8DC', color: '#A53838' }}>
            <AlertTriangle size={14} />{err}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border transition hover:bg-orange-50"
            style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>取消</button>
          <button
            onClick={handleSave}
            disabled={overLimit}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
            style={{
              background: overLimit ? '#D9C9A8' : '#A53838',
              color:      overLimit ? '#8B6F47' : 'white',
              cursor:     overLimit ? 'not-allowed' : 'pointer',
            }}
            title={overLimit ? `請先取消 ${selectedIds.length - MAX} 位長者` : undefined}
          >
            <Check size={15} />{isNew ? '新增' : '儲存'}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

// ════════════════════════════════════════════════════════
// 刪除確認 Modal
// ════════════════════════════════════════════════════════
function DeleteConfirm({ name, onConfirm, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalBox title="確認刪除" onClose={onClose} maxW={360}>
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" style={{ color: '#A53838' }} />
          <p className="text-sm" style={{ color: '#5C2828' }}>
            確定要刪除「<strong>{name}</strong>」嗎？此操作無法復原。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>取消</button>
          <button onClick={onConfirm}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: '#A53838', color: 'white' }}>
            <Trash2 size={14} /> 確認刪除
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

// ════════════════════════════════════════════════════════
// 結案 Modal
// ════════════════════════════════════════════════════════
function CloseModal({ recipient, onConfirm, onClose }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`
  const [closedAt, setClosedAt]   = useState(todayStr)
  const [closeReason, setReason]  = useState('')
  return (
    <Overlay onClose={onClose}>
      <ModalBox title={`結案：${recipient.name}`} onClose={onClose} maxW={400}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>結案日期 *</label>
            <input type="date" className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
              value={closedAt.replace(/\//g, '-')}
              onChange={e => setClosedAt(e.target.value.replace(/-/g, '/'))} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#8B6F47' }}>結案原因（選填）</label>
            <textarea rows={3} className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
              placeholder="例：轉入機構、往生、家屬撤案…"
              value={closeReason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border transition hover:bg-orange-50"
            style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>取消</button>
          <button onClick={() => onConfirm(closedAt, closeReason)}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: '#A53838', color: 'white' }}>
            <Archive size={14} /> 確認結案
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

// ════════════════════════════════════════════════════════
// 主 AdminView
// ════════════════════════════════════════════════════════
export default function AdminView() {
  const { recipients, addRecipient, updateRecipient, deleteRecipient,
          caregivers, addCaregiver, updateCaregiver, deleteCaregiver,
          setRecipients, setCaregivers } = useData()

  const [subTab, setSubTab]               = useState('recipients')
  const [recipientSubTab, setRecipientSubTab] = useState('active') // 'active' | 'closed'
  const [cgSubTab, setCgSubTab]           = useState('active')     // 'active' | 'resigned'
  const [editRecipient, setEditRecipient] = useState(null)
  const [deleteR, setDeleteR]             = useState(null)
  const [closeR, setCloseR]               = useState(null)
  const [editCaregiver, setEditCaregiver] = useState(null)
  const [deleteCG, setDeleteCG]           = useState(null)
  const [resignCG, setResignCG]           = useState(null)
  const [confirmReset, setConfirmReset]   = useState(false)

  const handleReset = () => {
    // 清除 localStorage 並恢復預設資料
    localStorage.removeItem('redapple_recipients')
    localStorage.removeItem('redapple_caregivers')
    localStorage.removeItem('redapple_monthly_attendance')
    localStorage.removeItem('redapple_daily_assignments')
    localStorage.removeItem('redapple_health_records')
    window.location.reload()
  }
  const [search, setSearch]               = useState('')

  const activeRecipients  = recipients.filter(r => r.isActive !== false)
  const closedRecipients  = recipients.filter(r => r.isActive === false)
  const activeCaregivers  = caregivers.filter(c => c.isActive !== false)
  const resignedCaregivers = caregivers.filter(c => c.isActive === false)
  const filteredR = (recipientSubTab === 'active' ? activeRecipients : closedRecipients).filter(r =>
    r.name.includes(search) || r.code.includes(search) || (r.conditions?.join('') ?? '').includes(search)
  )
  const filteredCG = (cgSubTab === 'active' ? activeCaregivers : resignedCaregivers)
    .filter(c => c.name.includes(search))

  return (
    <div className="space-y-5">
      {/* 頁頭 */}
      <div className="rounded-2xl p-5 border flex flex-wrap items-start justify-between gap-4"
        style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div>
          <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>機構資料管理</h2>
          <p className="text-sm mt-1" style={{ color: '#8B6F47' }}>
            新增、修改、刪除資料後自動儲存，重新整理頁面也不會遺失
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {isOnline ? (
              <>
                <Cloud size={13} style={{ color: '#7A9474' }} />
                <span className="text-xs font-medium" style={{ color: '#7A9474' }}>
                  已連接 Supabase 雲端資料庫 — 所有裝置即時共用同一份資料
                </span>
              </>
            ) : (
              <>
                <HardDrive size={13} style={{ color: '#C68B4F' }} />
                <span className="text-xs font-medium" style={{ color: '#C68B4F' }}>
                  離線模式 — 資料暫存於本機，連線後將自動同步
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition hover:bg-red-50"
          style={{ borderColor: '#E5D5B7', color: '#8B6F47' }}>
          <RotateCcw size={14} /> 重設為預設資料
        </button>
      </div>

      {/* 重設確認 */}
      {confirmReset && (
        <div className="rounded-2xl p-4 border flex items-start gap-3"
          style={{ background: '#FBE8DC', borderColor: '#A53838' }}>
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#A53838' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#5C2828' }}>確定要重設所有資料？</p>
            <p className="text-xs mt-0.5" style={{ color: '#8B6F47' }}>
              所有自訂的長者、照服員、出缺席、健康紀錄都將清除，恢復為系統預設資料。此操作無法復原。
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setConfirmReset(false)}
              className="px-3 py-1.5 rounded-lg text-sm border"
              style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>取消</button>
            <button onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: '#A53838', color: 'white' }}>確認重設</button>
          </div>
        </div>
      )}

      {/* 子頁籤 + 搜尋 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#C4A87A' }}>
          {[
            { id: 'recipients', label: '被照顧長者', icon: Users,     count: recipients.length },
            { id: 'caregivers', label: '照服員',     icon: UserCheck, count: caregivers.length },
          ].map(t => {
            const Icon   = t.icon
            const active = subTab === t.id
            return (
              <button key={t.id} onClick={() => { setSubTab(t.id); setSearch('') }}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition"
                style={{ background: active ? '#A53838' : '#FBF6EC', color: active ? 'white' : '#5C3A1E' }}>
                <Icon size={16} />
                {t.label}
                <span className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : '#EAE0CC',
                           color: active ? 'white' : '#8B6F47' }}>{t.count}</span>
              </button>
            )
          })}
        </div>

        {/* 在案 / 已結案 切換 */}
        {subTab === 'recipients' && (
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#C4A87A' }}>
            {[
              { id: 'active', label: '在案', count: activeRecipients.length },
              { id: 'closed', label: '已結案', count: closedRecipients.length },
            ].map(t => {
              const on = recipientSubTab === t.id
              return (
                <button key={t.id} onClick={() => { setRecipientSubTab(t.id); setSearch('') }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition"
                  style={{ background: on ? '#7A9474' : '#FBF6EC', color: on ? 'white' : '#5C3A1E' }}>
                  {t.label}
                  <span className="px-1.5 py-0.5 rounded-full text-xs"
                    style={{ background: on ? 'rgba(255,255,255,0.25)' : '#EAE0CC',
                             color: on ? 'white' : '#8B6F47' }}>{t.count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* 在職 / 已離職 切換 */}
        {subTab === 'caregivers' && (
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#C4A87A' }}>
            {[
              { id: 'active',   label: '在職',   count: activeCaregivers.length },
              { id: 'resigned', label: '已離職', count: resignedCaregivers.length },
            ].map(t => {
              const on = cgSubTab === t.id
              return (
                <button key={t.id} onClick={() => { setCgSubTab(t.id); setSearch('') }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition"
                  style={{ background: on ? '#7A9474' : '#FBF6EC', color: on ? 'white' : '#5C3A1E' }}>
                  {t.label}
                  <span className="px-1.5 py-0.5 rounded-full text-xs"
                    style={{ background: on ? 'rgba(255,255,255,0.25)' : '#EAE0CC',
                             color: on ? 'white' : '#8B6F47' }}>{t.count}</span>
                </button>
              )
            })}
          </div>
        )}

        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={subTab === 'recipients' ? '搜尋姓名 / 編號 / 疾病' : '搜尋姓名'}
          className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
        />
        {((subTab === 'recipients' && recipientSubTab === 'active') ||
          (subTab === 'caregivers' && cgSubTab === 'active')) && (
          <button
            onClick={() => subTab === 'recipients' ? setEditRecipient({}) : setEditCaregiver({})}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: '#A53838', color: 'white' }}>
            <Plus size={16} />
            {subTab === 'recipients' ? '新增長者' : '新增照服員'}
          </button>
        )}
      </div>

      {/* ── 長者列表 ── */}
      {subTab === 'recipients' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5D5B7' }}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#FBF1DD' }}>
                  {['序','姓名','個案編號','性別','年齡','CMS','主責照服員','健康狀況','洗澡日','操作'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-display font-semibold"
                      style={{ color: '#5C2828', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredR.map((r, i) => {
                  const cg = caregivers.find(c => c.id === r.primaryCaregiver)
                  return (
                    <tr key={r.id} className="border-t hover:bg-orange-50 transition"
                      style={{ borderColor: '#EAE0CC' }}>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: '#A09684' }}>{i + 1}</td>
                      <td className="px-3 py-2.5 font-display font-semibold" style={{ color: '#5C2828' }}>{r.name}</td>
                      <td className="px-3 py-2.5 font-mono text-xs" style={{ color: '#8B6F47' }}>{r.code}</td>
                      <td className="px-3 py-2.5 text-center">{r.gender}</td>
                      <td className="px-3 py-2.5 text-center">{r.age}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: '#EAE0CC', color: '#5C3A1E' }}>{r.cms}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {cg && <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: cg.color }}>{cg.avatar}</div>}
                          <span style={{ color: '#5C3A1E' }}>{cg?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(r.conditions ?? []).map(c => (
                            <span key={c} className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: '#F5E6D3', color: '#A0541E' }}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#8B6F47' }}>
                        {(r.bathDays ?? []).join('、')}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          {recipientSubTab === 'active' ? (
                            <>
                              <button onClick={() => setEditRecipient(r)}
                                className="p-1.5 rounded-lg hover:bg-orange-100 transition"
                                title="編輯" style={{ color: '#A53838' }}>
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setCloseR(r)}
                                className="p-1.5 rounded-lg hover:bg-orange-100 transition"
                                title="結案" style={{ color: '#8B6F47' }}>
                                <Archive size={14} />
                              </button>
                              <button onClick={() => setDeleteR(r)}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition"
                                title="刪除" style={{ color: '#A53838' }}>
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="text-xs mr-1" style={{ color: '#8B6F47' }}>
                                {r.closedAt}<br/>
                                <span style={{ color: '#A09684' }}>{r.closeReason}</span>
                              </div>
                              <button
                                onClick={() => updateRecipient({ ...r, isActive: true, closedAt: null, closeReason: '' })}
                                className="p-1.5 rounded-lg hover:bg-green-50 transition"
                                title="復原在案" style={{ color: '#7A9474' }}>
                                <ArchiveRestore size={14} />
                              </button>
                              <button onClick={() => setDeleteR(r)}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition"
                                title="刪除" style={{ color: '#A53838' }}>
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredR.length === 0 && (
                  <tr><td colSpan={10} className="py-10 text-center text-sm" style={{ color: '#A09684' }}>
                    {recipientSubTab === 'closed' ? '尚無已結案的長者' : '沒有符合條件的長者'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-right" style={{ color: '#A09684', borderTop: '1px solid #EAE0CC' }}>
            在案 {activeRecipients.length} 位 · 已結案 {closedRecipients.length} 位 · 顯示 {filteredR.length} 位
          </div>
        </div>
      )}

      {/* ── 照服員列表 ── */}
      {subTab === 'caregivers' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5D5B7' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#FBF1DD' }}>
                {['序','照服員','目前分配長者數','操作'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold"
                    style={{ color: '#5C2828' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCG.map((cg, i) => {
                const load = recipients.filter(r => r.primaryCaregiver === cg.id).length
                return (
                  <tr key={cg.id} className="border-t hover:bg-orange-50 transition"
                    style={{ borderColor: '#EAE0CC' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#A09684' }}>{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base"
                          style={{ background: cg.color }}>{cg.avatar}</div>
                        <div>
                          <div className="font-display font-semibold" style={{ color: '#5C2828' }}>{cg.name}</div>
                          <div className="text-xs font-mono" style={{ color: '#A09684' }}>{cg.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: '#EAE0CC' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${Math.min(load / 8 * 100, 100)}%`,
                                     background: load > 8 ? '#A53838' : '#7A9474' }} />
                        </div>
                        <span className="font-medium" style={{ color: load > 8 ? '#A53838' : '#5C2828' }}>
                          {load} / 8
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {cgSubTab === 'active' ? (
                          <>
                            <button onClick={() => setEditCaregiver(cg)}
                              className="p-1.5 rounded-lg hover:bg-orange-100 transition"
                              title="編輯" style={{ color: '#A53838' }}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setResignCG(cg)}
                              className="p-1.5 rounded-lg hover:bg-orange-100 transition"
                              title="離職" style={{ color: '#8B6F47' }}>
                              <Archive size={14} />
                            </button>
                            <button onClick={() => setDeleteCG(cg)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition"
                              title="刪除" style={{ color: '#A53838' }}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="text-xs mr-1" style={{ color: '#8B6F47' }}>
                              {cg.resignedAt}<br/>
                              <span style={{ color: '#A09684' }}>{cg.resignReason}</span>
                            </div>
                            <button
                              onClick={() => updateCaregiver({ ...cg, isActive: true, resignedAt: null, resignReason: '' })}
                              className="p-1.5 rounded-lg hover:bg-green-50 transition"
                              title="回聘" style={{ color: '#7A9474' }}>
                              <ArchiveRestore size={14} />
                            </button>
                            <button onClick={() => setDeleteCG(cg)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition"
                              title="刪除" style={{ color: '#A53838' }}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredCG.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-sm" style={{ color: '#A09684' }}>
                  {cgSubTab === 'resigned' ? '尚無已離職的照服員' : '沒有符合條件的照服員'}
                </td></tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-right" style={{ color: '#A09684', borderTop: '1px solid #EAE0CC' }}>
            在職 {activeCaregivers.length} 位 · 已離職 {resignedCaregivers.length} 位
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {editRecipient !== null && (
        <RecipientModal
          initial={editRecipient.id ? editRecipient : null}
          caregivers={caregivers}
          allRecipients={recipients}
          onSave={(r) => {
            editRecipient.id ? updateRecipient(r) : addRecipient(r)
            setEditRecipient(null)
          }}
          onClose={() => setEditRecipient(null)}
        />
      )}
      {deleteR && (
        <DeleteConfirm name={deleteR.name}
          onConfirm={async () => {
            await deleteRecipient(deleteR.id)
            setDeleteR(null)
          }}
          onClose={() => setDeleteR(null)} />
      )}
      {closeR && (
        <CloseModal recipient={closeR}
          onConfirm={(closedAt, closeReason) => {
            updateRecipient({ ...closeR, isActive: false, closedAt, closeReason })
            setCloseR(null)
          }}
          onClose={() => setCloseR(null)} />
      )}
      {resignCG && (
        <ResignModal caregiver={resignCG}
          onConfirm={(resignedAt, resignReason) => {
            updateCaregiver({ ...resignCG, isActive: false, resignedAt, resignReason })
            setResignCG(null)
          }}
          onClose={() => setResignCG(null)} />
      )}
      {editCaregiver !== null && (
        <CaregiverModal
          initial={editCaregiver.id ? editCaregiver : null}
          allCaregivers={caregivers}
          allRecipients={recipients}
          onSave={async (c, selectedRecipientIds) => {
            // 1. 儲存照服員基本資料
            await (editCaregiver.id ? updateCaregiver(c) : addCaregiver(c))
            // 2. 更新長者的 primaryCaregiver 欄位
            const cgId = c.id
            for (const r of recipients) {
              const wasAssigned = r.primaryCaregiver === cgId
              const isSelected  = selectedRecipientIds.includes(r.id)
              if (wasAssigned && !isSelected) {
                // 從此照服員移除
                await updateRecipient({ ...r, primaryCaregiver: null })
              } else if (!wasAssigned && isSelected) {
                // 指派給此照服員
                await updateRecipient({ ...r, primaryCaregiver: cgId })
              }
            }
            setEditCaregiver(null)
          }}
          onClose={() => setEditCaregiver(null)}
        />
      )}
      {deleteCG && (
        <DeleteConfirm name={deleteCG.name}
          onConfirm={async () => {
            await deleteCaregiver(deleteCG.id)
            setDeleteCG(null)
          }}
          onClose={() => setDeleteCG(null)} />
      )}
    </div>
  )
}

// ── 共用 UI 元件 ─────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(60,30,15,0.6)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

function ModalBox({ title, children, onClose, maxW = 680 }) {
  return (
    <div className="rounded-2xl border-2 overflow-hidden"
      style={{ background: '#FFFAF0', borderColor: '#C4A87A', width: '100%', maxWidth: maxW, maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: '#FBF1DD', borderColor: '#E5D5B7' }}>
        <h3 className="font-display text-lg font-semibold" style={{ color: '#5C2828' }}>{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-orange-100 transition">
          <X size={20} style={{ color: '#5C2828' }} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, children, cls = '' }) {
  return (
    <div className={cls}>
      <label style={labelSt}>{label}</label>
      {children}
    </div>
  )
}

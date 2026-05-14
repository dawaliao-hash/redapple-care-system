import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Users, UserCheck, AlertTriangle, RotateCcw, Cloud, HardDrive } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { isOnline } from '../lib/supabase.js'

// ── 顏色選項（照服員） ────────────────────────────────
const CG_COLORS = ['#B8543A','#7A9474','#C68B4F','#8E6BA8','#5B7B8C',
                   '#4A7FA5','#A0522D','#6B8E6B','#B8860B','#8B4789']

const BATH_OPTIONS = ['一','二','三','四','五']
const LEVEL_OPTIONS = ['一般戶','中低戶','低收戶']
const CMS_OPTIONS   = [1,2,3,4,5,6,7,8]

// ── 共用 style ────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-cranberry'
const inputSt  = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }
const labelSt  = { color: '#8B6F47', fontSize: 12, marginBottom: 4, display: 'block' }

// ════════════════════════════════════════════════════════
// 長者表單 Modal
// ════════════════════════════════════════════════════════
function RecipientModal({ initial, caregivers, onSave, onClose }) {
  const isNew = !initial?.id
  const [form, setForm] = useState(initial ?? {
    id: `r${Date.now()}`, code: '', name: '', gender: '女', age: '',
    cms: 5, primaryCaregiver: caregivers[0]?.id ?? '',
    conditions: [], emergencyContact: '', phone: '', address: '',
    bathDays: [], notes: '', level: '一般戶',
  })
  const [condInput, setCondInput] = useState((initial?.conditions ?? []).join('、'))
  const [err, setErr] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleBath = (day) => set('bathDays',
    form.bathDays.includes(day)
      ? form.bathDays.filter(d => d !== day)
      : [...form.bathDays, day]
  )

  const handleSave = () => {
    if (!form.name.trim()) { setErr('請填寫姓名'); return }
    if (!form.code.trim()) { setErr('請填寫個案編號'); return }
    onSave({ ...form, conditions: condInput.split(/[、,，\s]+/).filter(Boolean), age: Number(form.age) })
  }

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
          <Field label="年齡">
            <input type="number" className={inputCls} style={inputSt} value={form.age}
              onChange={e => set('age', e.target.value)} placeholder="例：82" min={0} max={120} />
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
              {LEVEL_OPTIONS.map(l => (
                <button key={l} onClick={() => set('level', l)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border transition"
                  style={{ background: form.level === l ? '#C68B4F' : '#FBF6EC',
                           color: form.level === l ? 'white' : '#5C3A1E',
                           borderColor: '#C4A87A' }}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="主責照服員">
            <select className={inputCls} style={inputSt} value={form.primaryCaregiver}
              onChange={e => set('primaryCaregiver', e.target.value)}>
              {caregivers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
          <button onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: '#A53838', color: 'white' }}>
            <Check size={15} />{isNew ? '新增' : '儲存'}
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

// ════════════════════════════════════════════════════════
// 照服員表單 Modal（含指定負責長者）
// ════════════════════════════════════════════════════════
function CaregiverModal({ initial, allRecipients, onSave, onClose }) {
  const isNew = !initial?.id
  const [form, setForm] = useState(initial ?? {
    id: `c${Date.now()}`, name: '', avatar: '', color: CG_COLORS[0],
  })
  const [err, setErr] = useState('')
  const [recSearch, setRecSearch] = useState('')

  // 目前已分配給此照服員的長者 ID 清單
  const [selectedIds, setSelectedIds] = useState(
    () => allRecipients.filter(r => r.primaryCaregiver === initial?.id).map(r => r.id)
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleRecipient = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const filteredRecs = allRecipients.filter(r =>
    !recSearch || r.name.includes(recSearch) || r.code.includes(recSearch)
  )

  const handleSave = () => {
    if (!form.name.trim()) { setErr('請填寫姓名'); return }
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

          {/* 預覽 */}
          <div className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ background: '#FBF6EC', borderColor: '#E5D5B7' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: form.color }}>{form.name[0] ?? '？'}</div>
            <div>
              <div className="font-display font-semibold text-sm" style={{ color: '#5C2828' }}>{form.name || '姓名預覽'}</div>
              <div className="text-xs" style={{ color: '#8B6F47' }}>已選 {selectedIds.length} 位長者</div>
            </div>
          </div>

          {/* 指定負責長者 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: '#8B6F47' }}>
                指定負責長者（可多選，已選 {selectedIds.length} 位）
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
          <button onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: '#A53838', color: 'white' }}>
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
// 主 AdminView
// ════════════════════════════════════════════════════════
export default function AdminView() {
  const { recipients, addRecipient, updateRecipient, deleteRecipient,
          caregivers, addCaregiver, updateCaregiver, deleteCaregiver,
          setRecipients, setCaregivers } = useData()

  const [subTab, setSubTab]               = useState('recipients')
  const [editRecipient, setEditRecipient] = useState(null)
  const [deleteR, setDeleteR]             = useState(null)
  const [editCaregiver, setEditCaregiver] = useState(null)
  const [deleteCG, setDeleteCG]           = useState(null)
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

  const filteredR = recipients.filter(r =>
    r.name.includes(search) || r.code.includes(search) || (r.conditions?.join('') ?? '').includes(search)
  )
  const filteredCG = caregivers.filter(c => c.name.includes(search))

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
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={subTab === 'recipients' ? '搜尋姓名 / 編號 / 疾病' : '搜尋姓名'}
          className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
        />
        <button
          onClick={() => subTab === 'recipients' ? setEditRecipient({}) : setEditCaregiver({})}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: '#A53838', color: 'white' }}>
          <Plus size={16} />
          {subTab === 'recipients' ? '新增長者' : '新增照服員'}
        </button>
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
                          <button onClick={() => setEditRecipient(r)}
                            className="p-1.5 rounded-lg hover:bg-orange-100 transition"
                            title="編輯" style={{ color: '#A53838' }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteR(r)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition"
                            title="刪除" style={{ color: '#A53838' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredR.length === 0 && (
                  <tr><td colSpan={10} className="py-10 text-center text-sm" style={{ color: '#A09684' }}>
                    沒有符合條件的長者
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-right" style={{ color: '#A09684', borderTop: '1px solid #EAE0CC' }}>
            共 {recipients.length} 位長者，顯示 {filteredR.length} 位
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
                      <div className="flex gap-1">
                        <button onClick={() => setEditCaregiver(cg)}
                          className="p-1.5 rounded-lg hover:bg-orange-100 transition"
                          title="編輯" style={{ color: '#A53838' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteCG(cg)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="刪除" style={{ color: '#A53838' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredCG.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-sm" style={{ color: '#A09684' }}>
                  沒有符合條件的照服員
                </td></tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-right" style={{ color: '#A09684', borderTop: '1px solid #EAE0CC' }}>
            共 {caregivers.length} 位照服員
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {editRecipient !== null && (
        <RecipientModal
          initial={editRecipient.id ? editRecipient : null}
          caregivers={caregivers}
          onSave={async (r) => {
            await (editRecipient.id ? updateRecipient(r) : addRecipient(r))
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
      {editCaregiver !== null && (
        <CaregiverModal
          initial={editCaregiver.id ? editCaregiver : null}
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

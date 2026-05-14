import { useState, useMemo, useRef, useCallback } from 'react'
import { Search, GripVertical, RotateCcw } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { STATUS_TYPES } from '../data/statusTypes.js'
import FilterChip from '../components/FilterChip.jsx'
import { todayStr, weekDay } from '../utils/date.js'

export default function AttendanceView({
  attendance, setAttendance,
  recipientOrder, setRecipientOrder,   // 由 App.jsx 傳入，與月度點名、配對總覽共用
  onSelectRecipient, holidays = {},
}) {
  const { recipients: RECIPIENTS, caregivers: CAREGIVERS } = useData()
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch]             = useState('')

  // 根據 recipientOrder 排列長者清單（新增的長者接在最後）
  const sortedRecipients = useMemo(() => {
    const orderIds = recipientOrder.filter(id => RECIPIENTS.find(r => r.id === id))
    const unordered = RECIPIENTS.filter(r => !recipientOrder.includes(r.id))
    return [
      ...orderIds.map(id => RECIPIENTS.find(r => r.id === id)),
      ...unordered,
    ].filter(Boolean)
  }, [recipientOrder, RECIPIENTS])

  const filtered = useMemo(() => {
    return sortedRecipients.filter(r => {
      if (search && !r.name.includes(search) && !r.code.includes(search)) return false
      if (filterStatus !== 'all' && (attendance[r.id] ?? 'present') !== filterStatus) return false
      return true
    })
  }, [attendance, filterStatus, search, sortedRecipients])

  const statusCounts = useMemo(() => {
    const c = { all: RECIPIENTS.length }
    Object.keys(STATUS_TYPES).forEach(k => { c[k] = 0 })
    RECIPIENTS.forEach(r => { c[attendance[r.id] ?? 'present'] = (c[attendance[r.id] ?? 'present'] || 0) + 1 })
    return c
  }, [attendance, RECIPIENTS])

  // ── 拖曳排序 ─────────────────────────────────────────────
  const [dragId,     setDragId]     = useState(null) // 被拖的 ID
  const [dragOverId, setDragOverId] = useState(null) // 目標行 ID
  const [dragAbove,  setDragAbove]  = useState(true) // 插入在目標行上方還是下方
  const dragNode = useRef(null)

  const handleDragStart = useCallback((e, id) => {
    setDragId(id)
    dragNode.current = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    // 拖曳時讓原始行半透明
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = '0.4'
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = ''
    setDragId(null)
    setDragOverId(null)
    dragNode.current = null
  }, [])

  const handleDragOver = useCallback((e, id) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id === dragId) { setDragOverId(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setDragAbove(e.clientY < rect.top + rect.height / 2)
    setDragOverId(id)
  }, [dragId])

  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return

    setRecipientOrder?.(prev => {
      // 建立以目前 sortedRecipients 為基礎的順序（確保 filtered 中排好的也能正確移動）
      const base = sortedRecipients.map(r => r.id)
      const fromIdx = base.indexOf(dragId)
      const toIdx   = base.indexOf(targetId)
      if (fromIdx === -1 || toIdx === -1) return prev

      const next = [...base]
      next.splice(fromIdx, 1)
      const insertAt = dragAbove ? toIdx : toIdx + 1
      next.splice(insertAt > fromIdx ? insertAt - 1 : insertAt, 0, dragId)
      return next
    })

    setDragId(null)
    setDragOverId(null)
  }, [dragId, dragAbove, sortedRecipients, setRecipientOrder])

  const resetOrder = () => setRecipientOrder?.(RECIPIENTS.map(r => r.id))

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>今日出缺席點名</h2>
            <p className="text-sm mt-1" style={{ color: '#8B6F47' }}>
              {todayStr}（星期{weekDay}）· 拖曳 <GripVertical size={12} className="inline" /> 調整順序 · 點擊狀態快速更改
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetOrder}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs transition hover:bg-orange-50"
              style={{ borderColor: '#E5D5B7', color: '#8B6F47' }}
              title="重設為預設順序">
              <RotateCcw size={13} /> 重設順序
            </button>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8B6F47' }} />
              <input
                type="text"
                placeholder="搜尋姓名 / 編號"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border text-sm w-48 outline-none"
                style={{ background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b" style={{ borderColor: '#E5D5B7' }}>
          <FilterChip active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} color="#5C2828" label="全部" count={statusCounts.all} />
          {Object.entries(STATUS_TYPES).map(([key, s]) => (
            <FilterChip key={key} active={filterStatus === key} onClick={() => setFilterStatus(key)} color={s.dot} label={s.label} count={statusCounts[key] || 0} />
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#E5D5B7' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#FBF1DD' }}>
                {['', '序', '長者姓名', '案號', '性別', 'CMS', '主責照服員', '狀態', '快速點名'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-display font-semibold" style={{ color: '#5C2828' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const s  = STATUS_TYPES[attendance[r.id]] ?? STATUS_TYPES.present
                const cg = CAREGIVERS.find(c => c.id === r.primaryCaregiver)
                const isOver  = dragOverId === r.id
                const isDragging = dragId === r.id

                return (
                  <tr
                    key={r.id}
                    draggable
                    onDragStart={e => handleDragStart(e, r.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleDragOver(e, r.id)}
                    onDrop={e => handleDrop(e, r.id)}
                    className="border-t transition-colors"
                    style={{
                      borderColor: '#EAE0CC',
                      background: isDragging ? '#FBE8DC' : 'transparent',
                      borderTop: isOver && dragAbove
                        ? '2.5px solid #A53838'
                        : undefined,
                      borderBottom: isOver && !dragAbove
                        ? '2.5px solid #A53838'
                        : undefined,
                    }}
                  >
                    {/* 拖曳把手 */}
                    <td className="pl-3 pr-1 py-3" style={{ width: 32 }}>
                      <div
                        className="flex items-center justify-center rounded cursor-grab active:cursor-grabbing"
                        style={{ color: '#C4A87A', touchAction: 'none' }}
                        title="拖曳調整順序"
                      >
                        <GripVertical size={16} />
                      </div>
                    </td>

                    <td className="px-3 py-3 font-mono text-xs" style={{ color: '#8B6F47' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => onSelectRecipient(r)}
                        className="font-display font-medium hover:underline" style={{ color: '#5C2828' }}>
                        {r.name}
                      </button>
                      <div className="text-xs mt-0.5" style={{ color: '#A09684' }}>{r.age} 歲</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs" style={{ color: '#8B6F47' }}>{r.code}</td>
                    <td className="px-3 py-3 text-center" style={{ color: '#5C3A1E' }}>{r.gender}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: '#EAE0CC', color: '#5C3A1E' }}>{r.cms}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: cg?.color }}>{cg?.avatar}</div>
                        <span style={{ color: '#5C3A1E' }}>{cg?.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: s.bg, color: s.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }}></span>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-start gap-1 flex-wrap">
                        {Object.entries(STATUS_TYPES).map(([key, st]) => (
                          <button
                            key={key}
                            onClick={() => setAttendance(prev => ({ ...prev, [r.id]: key }))}
                            title={st.label}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                            style={{
                              background: (attendance[r.id] ?? 'present') === key ? st.dot : '#FBF6EC',
                              color:      (attendance[r.id] ?? 'present') === key ? 'white' : st.text,
                              border:     `1.5px solid ${st.dot}`,
                            }}
                          >
                            {st.short.length > 1 ? st.short[0] : st.short}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center" style={{ color: '#A09684' }}>
                    沒有符合條件的長者
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

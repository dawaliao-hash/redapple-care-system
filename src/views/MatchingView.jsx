import { useState, useMemo, useRef, useCallback } from 'react'
import { useData } from '../context/DataContext.jsx'
import { STATUS_TYPES } from '../data/statusTypes.js'
import KpiCard from '../components/KpiCard.jsx'
import LegendDot from '../components/LegendDot.jsx'

const THRESHOLD = 8   // px 位移閾值

export default function MatchingView({ attendance, assignments, setAssignments, onSelectRecipient }) {
  const { recipients, caregivers } = useData()
  const [draggedId, setDraggedId]  = useState(null)
  const drag = useRef({ id: null, ghost: null, offsetX: 0, offsetY: 0,
                        startX: 0, startY: 0, moved: false })

  // ── 建立跟隨游標 / 手指的幽靈元素 ─────────────────────
  const spawnGhost = (el, clientX, clientY) => {
    const rect = el.getBoundingClientRect()
    const g    = el.cloneNode(true)
    Object.assign(g.style, {
      position:      'fixed',
      left:          `${rect.left}px`,
      top:           `${rect.top}px`,
      width:         `${rect.width}px`,
      zIndex:        '9999',
      opacity:       '0.88',
      pointerEvents: 'none',
      borderRadius:  '8px',
      boxShadow:     '0 10px 28px rgba(92,40,40,0.3)',
      transform:     'scale(1.07)',
      transition:    'box-shadow 0.1s',
    })
    document.body.appendChild(g)
    drag.current.ghost   = g
    drag.current.offsetX = clientX - rect.left
    drag.current.offsetY = clientY - rect.top
  }

  const killGhost = () => {
    if (drag.current.ghost) { drag.current.ghost.remove(); drag.current.ghost = null }
  }

  // ── Pointer Events（滑鼠 + 觸控 統一處理）────────────
  const onPtrDown = useCallback((e, recipientId) => {
    // 只接受左鍵或觸控，右鍵略過
    if (e.button !== undefined && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      id: recipientId, ghost: null,
      startX: e.clientX, startY: e.clientY,
      offsetX: 0, offsetY: 0, moved: false,
    }
  }, [])

  const onPtrMove = useCallback((e) => {
    if (!drag.current.id) return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY

    if (!drag.current.moved && Math.sqrt(dx * dx + dy * dy) > THRESHOLD) {
      drag.current.moved = true
      const el = document.querySelector(`[data-recipient-id="${drag.current.id}"]`)
      if (el) spawnGhost(el, drag.current.startX, drag.current.startY)
      setDraggedId(drag.current.id)
    }

    if (drag.current.moved && drag.current.ghost) {
      drag.current.ghost.style.left = `${e.clientX - drag.current.offsetX}px`
      drag.current.ghost.style.top  = `${e.clientY - drag.current.offsetY}px`
    }
  }, [])

  const onPtrUp = useCallback((e) => {
    const { id, moved } = drag.current
    killGhost()
    setDraggedId(null)
    drag.current.id    = null
    drag.current.moved = false

    if (!id) return

    if (moved) {
      // 找放開位置下方有 data-caregiver-id 的元素
      const els    = document.elementsFromPoint(e.clientX, e.clientY)
      const target = els.find(el => el.dataset.caregiverId)
      if (target) setAssignments(prev => ({ ...prev, [id]: target.dataset.caregiverId }))
    } else {
      // 靜止點擊 → 開啟長者資料
      const r = recipients.find(x => x.id === id)
      if (r) onSelectRecipient(r)
    }
  }, [recipients, setAssignments, onSelectRecipient])

  // ── 資料計算 ────────────────────────────────────────
  const counts = useMemo(() => {
    const map = {}
    caregivers.forEach(c => { map[c.id] = [] })
    recipients.forEach(r => {
      if (['present', 'respite', 'blood'].includes(attendance[r.id])) {
        const cgId = assignments[r.id]
        if (cgId && map[cgId]) map[cgId].push(r)
      }
    })
    return map
  }, [attendance, assignments, recipients, caregivers])

  const totalActive = useMemo(() =>
    recipients.filter(r => ['present', 'respite', 'blood'].includes(attendance[r.id])).length,
    [attendance, recipients]
  )

  const isDragging = draggedId !== null

  return (
    <div className="space-y-6">
      {/* KPI 列 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="今日在場長者" value={totalActive}         unit="人"   max={29} note={`容量 ${totalActive}/29`} accent="#A53838" />
        <KpiCard label="照服員人數"   value={caregivers.length}   unit="位"   note="1:8 比例"  accent="#7A9474" />
        <KpiCard label="平均服務數"   value={caregivers.length ? (totalActive / caregivers.length).toFixed(1) : 0} unit="人/員" note="未超過 8" accent="#C68B4F" />
        <KpiCard label="今日缺席"     value={recipients.length - totalActive} unit="人" note="含住院、回診" accent="#8E6BA8" />
      </div>

      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>即時配對總覽</h2>
            <p className="text-sm mt-1" style={{ color: '#8B6F47' }}>
              拖曳卡片到照服員欄位重新分配（電腦滑鼠 / 手機觸控均可）· 點擊長者查看詳細資料
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <LegendDot color="#7A9474" label="出席" />
            <LegendDot color="#D4A574" label="休假" />
            <LegendDot color="#5B7B8C" label="回診" />
            <LegendDot color="#A53838" label="住院" />
            <LegendDot color="#8E6BA8" label="喘息" />
          </div>
        </div>

        {isDragging && (
          <div className="mb-3 px-4 py-2 rounded-xl text-sm font-medium text-center"
            style={{ background: '#FBE8DC', color: '#A53838', border: '1.5px dashed #A53838' }}>
            拖曳到照服員欄位後放開以重新分配
          </div>
        )}

        {/* 照服員欄位格線 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {caregivers.map(cg => {
            const list  = counts[cg.id] ?? []
            const ratio = list.length / 8
            return (
              <div
                key={cg.id}
                data-caregiver-id={cg.id}
                className="rounded-xl p-3 border-2 transition-all"
                style={{
                  background:  '#FBF6EC',
                  borderColor: isDragging ? '#A53838' : '#E5D5B7',
                  borderStyle: isDragging ? 'dashed' : 'solid',
                  minHeight:   280,
                }}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: '#E5D5B7' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: cg.color }}>{cg.avatar}</div>
                  <div className="flex-1">
                    <div className="font-display font-semibold text-sm" style={{ color: '#5C2828' }}>{cg.name}</div>
                    <div className="text-xs" style={{ color: '#8B6F47' }}>{list.length}/8 人</div>
                  </div>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: '#EAE0CC' }}>
                  <div className="h-full transition-all"
                    style={{ width: `${Math.min(ratio * 100, 100)}%`,
                             background: ratio > 1 ? '#A53838' : ratio === 1 ? '#C68B4F' : '#7A9474' }} />
                </div>

                <div className="space-y-1.5">
                  {list.map(r => {
                    const s = STATUS_TYPES[attendance[r.id]] ?? STATUS_TYPES.present
                    return (
                      <div
                        key={r.id}
                        data-recipient-id={r.id}
                        onPointerDown={e => onPtrDown(e, r.id)}
                        onPointerMove={onPtrMove}
                        onPointerUp={onPtrUp}
                        className="rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 select-none"
                        style={{
                          background:   s.bg,
                          color:        s.text,
                          opacity:      draggedId === r.id ? 0.35 : 1,
                          cursor:       'grab',
                          touchAction:  'none',
                          userSelect:   'none',
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                          <span className="text-sm font-medium truncate">{r.name}</span>
                        </div>
                        <span className="text-xs font-mono opacity-70 flex-shrink-0">CMS{r.cms}</span>
                      </div>
                    )
                  })}
                  {list.length === 0 && (
                    <div className="text-center py-6 text-xs" style={{ color: '#A09684' }}>
                      {isDragging ? '放開此處分配' : '尚無分配'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 缺席列表 */}
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <h3 className="font-display font-semibold mb-3" style={{ color: '#5C2828' }}>今日未到 / 缺席</h3>
        <div className="flex flex-wrap gap-2">
          {recipients
            .filter(r => !['present', 'respite', 'blood'].includes(attendance[r.id]))
            .map(r => {
              const s = STATUS_TYPES[attendance[r.id]] ?? STATUS_TYPES.absent
              return (
                <button key={r.id} onClick={() => onSelectRecipient(r)}
                  className="px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition hover:shadow-sm"
                  style={{ background: s.bg, color: s.text }}>
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs opacity-80">{s.label}</span>
                </button>
              )
            })}
          {recipients.filter(r => !['present', 'respite', 'blood'].includes(attendance[r.id])).length === 0 && (
            <p className="text-sm" style={{ color: '#A09684' }}>今日全員到齊</p>
          )}
        </div>
      </div>
    </div>
  )
}

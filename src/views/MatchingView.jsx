import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { CAREGIVERS } from '../data/caregivers.js'
import { RECIPIENTS } from '../data/recipients.js'
import { STATUS_TYPES } from '../data/statusTypes.js'
import KpiCard from '../components/KpiCard.jsx'
import LegendDot from '../components/LegendDot.jsx'

// 拖曳狀態（跨 render 共享，不觸發 re-render）
const DRAG_THRESHOLD = 8 // px，超過才視為拖曳而非點擊

export default function MatchingView({ attendance, assignments, setAssignments, onSelectRecipient }) {
  const [draggedId, setDraggedId] = useState(null)
  const drag = useRef({
    id: null,
    ghost: null,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  })

  // ── 觸控拖曳：建立幽靈元素 ───────────────────────────
  const createGhost = useCallback((sourceEl, touchX, touchY) => {
    const rect = sourceEl.getBoundingClientRect()
    const ghost = sourceEl.cloneNode(true)
    Object.assign(ghost.style, {
      position:      'fixed',
      left:          `${rect.left}px`,
      top:           `${rect.top}px`,
      width:         `${rect.width}px`,
      zIndex:        '9999',
      opacity:       '0.88',
      pointerEvents: 'none',
      borderRadius:  '8px',
      boxShadow:     '0 10px 28px rgba(92,40,40,0.35)',
      transform:     'scale(1.07)',
      transition:    'transform 0.1s',
    })
    document.body.appendChild(ghost)
    drag.current.ghost    = ghost
    drag.current.offsetX  = touchX - rect.left
    drag.current.offsetY  = touchY - rect.top
  }, [])

  const removeGhost = useCallback(() => {
    if (drag.current.ghost) {
      drag.current.ghost.remove()
      drag.current.ghost = null
    }
  }, [])

  // ── touchstart：只記錄起點，尚未建立幽靈 ────────────
  const handleTouchStart = useCallback((e, recipientId) => {
    const touch = e.touches[0]
    drag.current = {
      id:      recipientId,
      ghost:   null,
      offsetX: 0,
      offsetY: 0,
      startX:  touch.clientX,
      startY:  touch.clientY,
      moved:   false,
    }
  }, [])

  // ── touchmove（non-passive，掛在 window）─────────────
  const handleTouchMove = useCallback((e) => {
    if (!drag.current.id) return
    const touch = e.touches[0]
    const dx = touch.clientX - drag.current.startX
    const dy = touch.clientY - drag.current.startY

    if (!drag.current.moved) {
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return
      // 距離超過閾值 → 正式開始拖曳
      drag.current.moved = true
      const sourceEl = document.querySelector(`[data-recipient-id="${drag.current.id}"]`)
      if (sourceEl) createGhost(sourceEl, drag.current.startX, drag.current.startY)
      setDraggedId(drag.current.id)
    }

    // 拖曳中：阻止頁面滾動並移動幽靈
    e.preventDefault()
    if (drag.current.ghost) {
      drag.current.ghost.style.left = `${touch.clientX - drag.current.offsetX}px`
      drag.current.ghost.style.top  = `${touch.clientY - drag.current.offsetY}px`
    }
  }, [createGhost])

  // ── touchend（掛在 window）──────────────────────────
  const handleTouchEnd = useCallback((e) => {
    const { id, moved } = drag.current
    removeGhost()
    setDraggedId(null)
    drag.current.id    = null
    drag.current.moved = false

    if (!id) return

    if (moved) {
      // 拖曳結束：找手指下方的照服員欄位
      const touch = e.changedTouches[0]
      const els   = document.elementsFromPoint(touch.clientX, touch.clientY)
      const target = els.find(el => el.dataset.caregiverId)
      if (target) {
        setAssignments(prev => ({ ...prev, [id]: target.dataset.caregiverId }))
      }
    }
    // moved === false → 視為點擊，由 onClick 處理
  }, [removeGhost, setAssignments])

  // ── 全域掛載（non-passive touchmove 需手動加）────────
  useEffect(() => {
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend',  handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend',  handleTouchEnd)
    }
  }, [handleTouchMove, handleTouchEnd])

  // ── 桌面 drag-and-drop ───────────────────────────────
  const handleDragStart = useCallback((recipientId) => {
    setDraggedId(recipientId)
    drag.current.id = recipientId
  }, [])

  const handleDrop = useCallback((caregiverId) => {
    if (drag.current.id) {
      setAssignments(prev => ({ ...prev, [drag.current.id]: caregiverId }))
      drag.current.id = null
      setDraggedId(null)
    }
  }, [setAssignments])

  // ── 資料計算 ─────────────────────────────────────────
  const counts = useMemo(() => {
    const map = {}
    CAREGIVERS.forEach(c => { map[c.id] = [] })
    RECIPIENTS.forEach(r => {
      const status = attendance[r.id]
      if (['present', 'respite', 'blood'].includes(status)) {
        const cgId = assignments[r.id]
        if (cgId && map[cgId]) map[cgId].push(r)
      }
    })
    return map
  }, [attendance, assignments])

  const totalActive = useMemo(() =>
    RECIPIENTS.filter(r => ['present', 'respite', 'blood'].includes(attendance[r.id])).length,
    [attendance]
  )

  const isDragging = draggedId !== null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="今日在場長者" value={totalActive} unit="人" max={29} note={`容量 ${totalActive}/29`} accent="#A53838" />
        <KpiCard label="照服員人數"   value={CAREGIVERS.length} unit="位" note="1:8 比例" accent="#7A9474" />
        <KpiCard label="平均服務數"   value={(totalActive / CAREGIVERS.length).toFixed(1)} unit="人/員" note="未超過 8" accent="#C68B4F" />
        <KpiCard label="今日缺席"     value={RECIPIENTS.length - totalActive} unit="人" note="含住院、回診" accent="#8E6BA8" />
      </div>

      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>即時配對總覽</h2>
            <p className="text-sm mt-1" style={{ color: '#8B6F47' }}>
              拖曳長者卡片到照服員欄位重新分配（手機長按拖曳）· 點擊長者查看詳細資料
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: '#5C3A1E' }}>
            <LegendDot color="#7A9474" label="出席" />
            <LegendDot color="#D4A574" label="休假" />
            <LegendDot color="#5B7B8C" label="回診" />
            <LegendDot color="#A53838" label="住院" />
            <LegendDot color="#8E6BA8" label="喘息" />
          </div>
        </div>

        {/* 拖曳提示列（拖曳中才顯示） */}
        {isDragging && (
          <div
            className="mb-3 px-4 py-2 rounded-xl text-sm font-medium text-center"
            style={{ background: '#FBE8DC', color: '#A53838', border: '1.5px dashed #A53838' }}
          >
            拖曳到下方照服員欄位放開以重新分配
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {CAREGIVERS.map(cg => {
            const list  = counts[cg.id]
            const ratio = list.length / 8
            return (
              <div
                key={cg.id}
                data-caregiver-id={cg.id}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(cg.id)}
                className="rounded-xl p-3 border-2 transition-all"
                style={{
                  background:  '#FBF6EC',
                  borderColor: isDragging ? '#A53838' : '#E5D5B7',
                  borderStyle: isDragging ? 'dashed' : 'solid',
                  minHeight:   280,
                }}
              >
                {/* 照服員頭 */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: '#E5D5B7' }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-white"
                    style={{ background: cg.color }}
                  >
                    {cg.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-semibold text-sm" style={{ color: '#5C2828' }}>{cg.name}</div>
                    <div className="text-xs" style={{ color: '#8B6F47' }}>{list.length}/8 人</div>
                  </div>
                </div>

                {/* 進度條 */}
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: '#EAE0CC' }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width:      `${Math.min(ratio * 100, 100)}%`,
                      background: ratio > 1 ? '#A53838' : ratio === 1 ? '#C68B4F' : '#7A9474',
                    }}
                  />
                </div>

                {/* 長者列表 */}
                <div className="space-y-1.5">
                  {list.map(r => {
                    const s        = STATUS_TYPES[attendance[r.id]]
                    const isActive = draggedId === r.id
                    return (
                      <div
                        key={r.id}
                        data-recipient-id={r.id}
                        draggable
                        onDragStart={() => handleDragStart(r.id)}
                        onDragEnd={() => { setDraggedId(null); drag.current.id = null }}
                        onTouchStart={e => handleTouchStart(e, r.id)}
                        onClick={() => {
                          // 觸控拖曳結束後不觸發 onClick（moved 為 true 時已在 touchend 處理）
                          if (!drag.current.moved) onSelectRecipient(r)
                        }}
                        className="rounded-lg px-2.5 py-1.5 cursor-grab active:cursor-grabbing transition-all flex items-center justify-between gap-2 select-none"
                        style={{
                          background: s.bg,
                          color:      s.text,
                          opacity:    isActive ? 0.4 : 1,
                          boxShadow:  isActive ? 'none' : undefined,
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }}></span>
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

      {/* 今日缺席 */}
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <h3 className="font-display font-semibold mb-3" style={{ color: '#5C2828' }}>今日未到 / 缺席</h3>
        <div className="flex flex-wrap gap-2">
          {RECIPIENTS
            .filter(r => !['present', 'respite', 'blood'].includes(attendance[r.id]))
            .map(r => {
              const s = STATUS_TYPES[attendance[r.id]]
              return (
                <button
                  key={r.id}
                  onClick={() => onSelectRecipient(r)}
                  className="px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition hover:shadow-sm"
                  style={{ background: s.bg, color: s.text }}
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs opacity-80">{s.label}</span>
                </button>
              )
            })}
          {RECIPIENTS.filter(r => !['present', 'respite', 'blood'].includes(attendance[r.id])).length === 0 && (
            <p className="text-sm" style={{ color: '#A09684' }}>今日全員到齊</p>
          )}
        </div>
      </div>
    </div>
  )
}

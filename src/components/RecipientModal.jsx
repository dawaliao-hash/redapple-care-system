import { X, Phone, MapPin, Users, Activity, FileText, Pill } from 'lucide-react'
import { useData } from '../context/DataContext.jsx'
import { STATUS_TYPES } from '../data/statusTypes.js'

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: '#A53838' }} className="mt-0.5">{icon}</span>
      <div className="flex-1">
        <span style={{ color: '#8B6F47' }}>{label}：</span>
        <span style={{ color: '#5C2828' }}>{value}</span>
      </div>
    </div>
  )
}

function MiniVital({ label, value }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: '#FBF6EC', border: '1px solid #E5D5B7' }}>
      <div className="text-xs" style={{ color: '#8B6F47' }}>{label}</div>
      <div className="font-display font-bold" style={{ color: '#5C2828' }}>{value}</div>
    </div>
  )
}

export default function RecipientModal({ recipient, healthRecords, attendance, onClose }) {
  const { caregivers } = useData()
  const cg = caregivers.find(c => c.id === recipient.primaryCaregiver)
  const status = STATUS_TYPES[attendance]
  const last = healthRecords[healthRecords.length - 1]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(60, 30, 15, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border-2"
        style={{ background: '#FFFAF0', borderColor: '#C4A87A' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-start justify-between" style={{ background: 'linear-gradient(135deg, #FBE8DC, #FBF1DD)', borderColor: '#E5D5B7' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-display font-bold text-2xl" style={{ background: '#A53838' }}>
              {recipient.name[0]}
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold" style={{ color: '#5C2828' }}>{recipient.name}</h3>
              <div className="text-sm mt-1 flex items-center gap-2 flex-wrap" style={{ color: '#8B6F47' }}>
                <span>{recipient.gender} · {recipient.age} 歲</span>
                <span>·</span>
                <span className="font-mono">{recipient.code}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#A53838', color: 'white' }}>
                  CMS {recipient.cms}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EAE0CC', color: '#5C3A1E' }}>
                  {recipient.level}
                </span>
                {status && (
                  <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: status.bg, color: status.text }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }}></span>
                    今日{status.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-orange-100 transition">
            <X size={22} style={{ color: '#5C2828' }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 基本資料 */}
            <div>
              <h4 className="font-display font-semibold mb-3 pb-2 border-b" style={{ color: '#5C2828', borderColor: '#E5D5B7' }}>基本資料</h4>
              <div className="space-y-2.5 text-sm">
                <InfoRow icon={<Phone size={14} />} label="緊急聯絡人" value={`${recipient.emergencyContact}（${recipient.phone}）`} />
                <InfoRow icon={<MapPin size={14} />} label="住址" value={recipient.address} />
                <InfoRow
                  icon={<Users size={14} />}
                  label="主責照服員"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: cg?.color }}>
                        {cg?.avatar}
                      </span>
                      {cg?.name}
                    </span>
                  }
                />
                <InfoRow icon={<Activity size={14} />} label="洗澡日" value={recipient.bathDays.join('、')} />
                <InfoRow icon={<FileText size={14} />} label="備註" value={recipient.notes} />
              </div>
            </div>

            {/* 健康狀態 */}
            <div>
              <h4 className="font-display font-semibold mb-3 pb-2 border-b" style={{ color: '#5C2828', borderColor: '#E5D5B7' }}>健康狀態</h4>
              <div className="mb-3">
                <div className="text-xs mb-1.5" style={{ color: '#8B6F47' }}>健康病史</div>
                <div className="flex flex-wrap gap-1.5">
                  {recipient.conditions.map(c => (
                    <span key={c} className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1" style={{ background: 'rgba(165,56,56,0.1)', color: '#A53838' }}>
                      <Pill size={11} /> {c}
                    </span>
                  ))}
                </div>
              </div>
              {last && (
                <div>
                  <div className="text-xs mb-2" style={{ color: '#8B6F47' }}>最新量測（{last.fullDate} {last.time}）</div>
                  <div className="grid grid-cols-2 gap-2">
                    <MiniVital label="體溫" value={`${last.temp}°C`} />
                    <MiniVital label="脈搏" value={`${last.pulse} bpm`} />
                    <MiniVital label="收縮壓" value={`${last.systolic}`} />
                    <MiniVital label="舒張壓" value={`${last.diastolic}`} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 近期出席 */}
          <div className="mt-6">
            <h4 className="font-display font-semibold mb-3 pb-2 border-b" style={{ color: '#5C2828', borderColor: '#E5D5B7' }}>近 14 日出席紀錄</h4>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 14 }).map((_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (13 - i))
                const dow = d.getDay()
                if (dow === 0 || dow === 6) {
                  return (
                    <div key={i} className="flex flex-col items-center" style={{ width: 38 }}>
                      <div className="text-xs mb-1" style={{ color: '#A09684' }}>{d.getMonth() + 1}/{d.getDate()}</div>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs" style={{ background: '#F0E8D8', color: '#A09684' }}>－</div>
                    </div>
                  )
                }
                const isToday = i === 13
                const stKey = isToday ? attendance : (Math.random() > 0.85 ? 'rest' : 'present')
                const st = STATUS_TYPES[stKey]
                return (
                  <div key={i} className="flex flex-col items-center" style={{ width: 38 }}>
                    <div className="text-xs mb-1" style={{ color: isToday ? '#A53838' : '#8B6F47', fontWeight: isToday ? 700 : 400 }}>
                      {d.getMonth() + 1}/{d.getDate()}
                    </div>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: st.bg, color: st.text, border: isToday ? '2px solid #A53838' : 'none' }}
                    >
                      {st.short.length > 1 ? st.short[0] : st.short}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

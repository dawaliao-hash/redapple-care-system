import { X, ChevronRight } from 'lucide-react'

export default function CaregiverDayModal({ data, onClose, onSelectRecipient }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(60, 30, 15, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border-2"
        style={{ background: '#FFFAF0', borderColor: '#C4A87A' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: '#FBF1DD', borderColor: '#E5D5B7' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-display font-bold text-lg"
              style={{ background: data.caregiver.color }}
            >
              {data.caregiver.avatar}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold" style={{ color: '#5C2828' }}>
                {data.caregiver.name} · {data.day.label}（星期{data.day.wd}）
              </h3>
              <p className="text-sm" style={{ color: '#8B6F47' }}>當日服務 {data.recipients.length} 位長者</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-orange-100 transition">
            <X size={20} style={{ color: '#5C2828' }} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.recipients.map(r => (
              <button
                key={r.id}
                onClick={() => onSelectRecipient(r)}
                className="text-left p-3 rounded-xl border transition-all hover:shadow-md group"
                style={{ background: '#FBF6EC', borderColor: '#E5D5B7' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display font-semibold" style={{ color: '#5C2828' }}>{r.name}</div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: '#8B6F47' }}>{r.code}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EAE0CC', color: '#5C3A1E' }}>
                      CMS {r.cms}
                    </span>
                    <ChevronRight size={16} style={{ color: '#A53838' }} className="group-hover:translate-x-1 transition" />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.conditions.map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded" style={{ background: '#F5E6D3', color: '#A0541E' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

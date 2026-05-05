export default function KpiCard({ label, value, unit, max, note, accent }) {
  const ratio = max ? Math.min(value / max, 1) : 0
  return (
    <div className="rounded-2xl p-4 border relative overflow-hidden" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10" style={{ background: accent, transform: 'translate(30%, -30%)' }}></div>
      <div className="relative">
        <div className="text-xs font-medium tracking-wide" style={{ color: '#8B6F47' }}>{label}</div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-3xl font-bold" style={{ color: accent }}>{value}</span>
          <span className="text-sm" style={{ color: '#8B6F47' }}>{unit}</span>
        </div>
        {max && (
          <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: '#EAE0CC' }}>
            <div className="h-full" style={{ width: `${ratio * 100}%`, background: accent }} />
          </div>
        )}
        <div className="text-xs mt-1.5" style={{ color: '#A09684' }}>{note}</div>
      </div>
    </div>
  )
}

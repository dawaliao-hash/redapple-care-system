export default function VitalCard({ icon, label, value, unit, avg, color }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {icon}
        <span className="text-xs font-medium tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold" style={{ color: '#5C2828' }}>{value}</span>
        <span className="text-xs" style={{ color: '#8B6F47' }}>{unit}</span>
      </div>
      <div className="text-xs mt-1" style={{ color: '#A09684' }}>
        平均 {avg ?? '–'} {unit}
      </div>
    </div>
  )
}

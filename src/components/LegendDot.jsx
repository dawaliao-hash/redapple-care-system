export default function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }}></span>
      <span className="text-xs" style={{ color: '#5C3A1E' }}>{label}</span>
    </span>
  )
}

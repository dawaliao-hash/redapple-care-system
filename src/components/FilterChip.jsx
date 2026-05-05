export default function FilterChip({ active, onClick, color, label, count }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-2"
      style={{
        background: active ? color : '#FBF6EC',
        color: active ? 'white' : '#5C3A1E',
        border: `1.5px solid ${color}`,
      }}
    >
      <span>{label}</span>
      <span
        className="text-xs px-1.5 py-0.5 rounded-full"
        style={{ background: active ? 'rgba(255,255,255,0.25)' : 'white', color: active ? 'white' : color }}
      >
        {count}
      </span>
    </button>
  )
}

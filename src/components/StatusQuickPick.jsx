import { STATUS_TYPES, SELFPAY_KEYS, isSelfpay } from '../data/statusTypes.js'

// 快速點名：一般狀態用圓形按鈕，自費類（11 種）收進一個下拉選單
export default function StatusQuickPick({ current = 'present', onPick, size = 7 }) {
  const sp = STATUS_TYPES.selfpay
  const spActive = isSelfpay(current)
  return (
    <div className="flex justify-start gap-1 flex-wrap items-center">
      {Object.entries(STATUS_TYPES).filter(([, st]) => !st.selfpay).map(([key, st]) => (
        <button
          key={key}
          onClick={() => onPick(key)}
          title={st.label}
          className={`rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110`}
          style={{
            width: size * 4, height: size * 4,   // Tailwind 不支援動態 class，改用 inline 尺寸
            background: current === key ? st.dot : '#FBF6EC',
            color:      current === key ? 'white' : st.text,
            border:     `1.5px solid ${st.dot}`,
          }}
        >
          {st.short.length > 1 ? st.short[0] : st.short}
        </button>
      ))}
      <select
        value={spActive ? current : ''}
        onChange={e => e.target.value && onPick(e.target.value)}
        title="自費項目"
        className="rounded-full text-xs font-bold px-2 outline-none cursor-pointer"
        style={{
          height: size * 4,
          background: spActive ? sp.dot : '#FBF6EC',
          color:      spActive ? 'white' : sp.text,
          border:     `1.5px solid ${sp.dot}`,
          maxWidth: 150,
        }}
      >
        <option value="" disabled>自費⋯</option>
        {SELFPAY_KEYS.map(k => <option key={k} value={k}>{STATUS_TYPES[k].label}</option>)}
      </select>
    </div>
  )
}

import { todayStr, weekDay } from '../utils/date.js'

export default function Header() {
  return (
    <header className="border-b-2" style={{ background: 'linear-gradient(135deg, #FFFAF0 0%, #FBF1DD 100%)', borderColor: '#C4A87A' }}>
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg viewBox="0 0 60 60" className="w-12 h-12">
              <path d="M30 12 C 28 8, 24 6, 22 9" stroke="#7A9474" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <ellipse cx="32" cy="36" rx="18" ry="20" fill="#A53838" />
              <ellipse cx="26" cy="28" rx="6" ry="8" fill="#C85A5A" opacity="0.6" />
              <path d="M30 12 Q 32 14, 30 18" stroke="#5C3A1E" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide" style={{ color: '#5C2828' }}>
              水林紅蘋果長照中心
            </h1>
            <p className="text-xs tracking-widest font-body" style={{ color: '#8B6F47' }}>
              雲林縣家園關懷協會附設雲林縣私立紅蘋果社區式服務類長期照顧服務機構
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-body">
          <div className="flex flex-col items-end">
            <span className="text-xs" style={{ color: '#8B6F47' }}>今天</span>
            <span className="font-medium text-base" style={{ color: '#5C2828' }}>{todayStr} 星期{weekDay}</span>
          </div>
          <div className="h-10 w-px" style={{ background: '#C4A87A' }}></div>
          <div className="flex flex-col items-end">
            <span className="text-xs" style={{ color: '#8B6F47' }}>承辦</span>
            <span className="font-medium" style={{ color: '#5C2828' }}>吳國良 社工師</span>
          </div>
        </div>
      </div>
    </header>
  )
}

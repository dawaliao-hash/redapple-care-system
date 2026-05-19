import { Clock, XCircle, LogOut } from 'lucide-react'

export default function PendingApprovalPage({ status, user, signOut }) {
  const isPending  = status === 'pending'
  const accentColor = isPending ? '#C68B4F' : '#A53838'
  const bgColor     = isPending ? '#FBF1DD' : '#FBE8DC'

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #FBF6EC 0%, #F5E8D0 100%)' }}>
      <div className="w-full max-w-md rounded-3xl border-2 overflow-hidden shadow-2xl"
        style={{ background: '#FFFAF0', borderColor: '#C4A87A' }}>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center"
          style={{ background: 'linear-gradient(180deg, #FBF1DD 0%, #FFFAF0 100%)' }}>
          <svg viewBox="0 0 60 60" style={{ width: 56, height: 56, margin: '0 auto 12px', filter: 'drop-shadow(0 6px 12px rgba(165,56,56,0.2))' }}>
            <path d="M30 12 C 28 8, 24 6, 22 9" stroke="#7A9474" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <ellipse cx="32" cy="36" rx="18" ry="20" fill="#A53838"/>
            <ellipse cx="26" cy="28" rx="6" ry="8" fill="#C85A5A" opacity="0.6"/>
          </svg>
          <h1 className="font-display text-xl font-bold" style={{ color: '#5C2828' }}>水林紅蘋果長照中心</h1>
          <p className="text-xs mt-1" style={{ color: '#8B6F47' }}>案務管理系統</p>
        </div>

        <div className="px-8 pb-10 space-y-5 text-center">
          {/* Status icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: bgColor }}>
            {isPending
              ? <Clock size={32} style={{ color: accentColor }}/>
              : <XCircle size={32} style={{ color: accentColor }}/>
            }
          </div>

          {/* Message */}
          <div className="space-y-2">
            <p className="font-display font-semibold text-lg" style={{ color: '#5C2828' }}>
              {isPending ? '帳號審核中' : '帳號申請未通過'}
            </p>
            <div className="px-4 py-3 rounded-xl text-sm leading-relaxed"
              style={{ background: bgColor, color: '#5C2828', border: `1px solid ${accentColor}40` }}>
              {isPending ? (
                <>
                  您的帳號申請（<strong>{user?.email}</strong>）<br/>
                  正在等待管理員審核，<br/>
                  審核通過後即可登入使用系統。
                </>
              ) : (
                <>
                  您的帳號申請（<strong>{user?.email}</strong>）<br/>
                  未獲核准。如有疑問，<br/>
                  請聯絡機構管理員。
                </>
              )}
            </div>
            {isPending && (
              <p className="text-xs" style={{ color: '#A09684' }}>
                如需加速審核，請聯絡機構管理員
              </p>
            )}
          </div>

          {/* Sign out */}
          <button onClick={signOut}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition hover:shadow-sm"
            style={{ borderColor: '#C4A87A', color: '#5C2828', background: '#FBF6EC' }}>
            <LogOut size={15}/> 登出
          </button>
        </div>
      </div>
    </div>
  )
}

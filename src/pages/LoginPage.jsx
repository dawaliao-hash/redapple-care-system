import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('請輸入帳號與密碼'); return }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(
        authError.message.includes('Invalid login credentials')
          ? '帳號或密碼錯誤，請重新確認'
          : authError.message.includes('Email not confirmed')
          ? '帳號尚未驗證，請聯絡管理員'
          : `登入失敗：${authError.message}`
      )
    }
    setLoading(false)
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border text-sm outline-none transition'
  const inputSt  = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #FBF6EC 0%, #F5E8D0 100%)' }}>

      {/* 背景紋理 */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(165,56,56,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(122,148,116,0.05) 0%, transparent 50%)'
      }} />

      <div className="relative w-full max-w-md">
        {/* 卡片 */}
        <div className="rounded-3xl border-2 overflow-hidden shadow-2xl"
          style={{ background: '#FFFAF0', borderColor: '#C4A87A' }}>

          {/* 上方橫幅 */}
          <div className="px-8 pt-10 pb-8 text-center"
            style={{ background: 'linear-gradient(180deg, #FBF1DD 0%, #FFFAF0 100%)' }}>
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 60 60" style={{ width: 64, height: 64 }}
                filter="drop-shadow(0 8px 16px rgba(165,56,56,0.25))">
                <path d="M30 12 C 28 8, 24 6, 22 9" stroke="#7A9474" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="32" cy="36" rx="18" ry="20" fill="#A53838" />
                <ellipse cx="26" cy="28" rx="6" ry="8" fill="#C85A5A" opacity="0.6" />
                <path d="M30 12 Q 32 14, 30 18" stroke="#5C3A1E" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#5C2828' }}>
              水林紅蘋果長照中心
            </h1>
            <p className="text-xs mt-1" style={{ color: '#8B6F47' }}>
              案務管理系統 · 請登入以繼續
            </p>
          </div>

          {/* 表單 */}
          <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B6F47' }}>
                帳號（Email）
              </label>
              <input
                type="email"
                className={inputCls}
                style={inputSt}
                placeholder="請輸入電子郵件"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B6F47' }}>
                密碼
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={inputCls}
                  style={{ ...inputSt, paddingRight: '3rem' }}
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-70 transition"
                  style={{ color: '#A09684' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 錯誤提示 */}
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: '#FBE8DC', color: '#A53838', border: '1px solid rgba(165,56,56,0.3)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-display font-semibold text-base flex items-center justify-center gap-2 transition hover:shadow-lg active:scale-[0.98]"
              style={{
                background: loading ? '#D9C9A8' : '#A53838',
                color:      loading ? '#8B6F47' : 'white',
                cursor:     loading ? 'not-allowed' : 'pointer',
                marginTop:  '8px',
              }}>
              {loading
                ? <><span className="animate-spin">⋯</span> 登入中</>
                : <><LogIn size={18} /> 登入系統</>
              }
            </button>
          </form>
        </div>

        {/* 底部版本資訊 */}
        <p className="text-center text-xs mt-6" style={{ color: '#B5A285' }}>
          雲林縣家園關懷協會附設雲林縣私立紅蘋果社區式服務類長期照顧服務機構
        </p>
      </div>
    </div>
  )
}

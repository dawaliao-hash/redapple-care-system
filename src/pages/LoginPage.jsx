import { useState } from 'react'
import { Eye, EyeOff, LogIn, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

// ── 登入表單 ─────────────────────────────────────────────
function SignInForm({ onForgot }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('請輸入帳號與密碼'); return }
    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(
        authError.message.includes('Invalid login credentials') ? '帳號或密碼錯誤，請重新確認' :
        authError.message.includes('Email not confirmed')       ? '帳號尚未驗證，請聯絡管理員' :
        `登入失敗：${authError.message}`
      )
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B6F47' }}>帳號（Email）</label>
        <input type="email" className={inputCls} style={inputSt}
          placeholder="請輸入電子郵件" value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          autoComplete="email" autoFocus />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B6F47' }}>密碼</label>
        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} className={inputCls}
            style={{ ...inputSt, paddingRight: '3rem' }}
            placeholder="請輸入密碼" value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoComplete="current-password" />
          <button type="button" onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-70 transition"
            style={{ color: '#A09684' }}>
            {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        </div>
      </div>
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm"
          style={{ background: '#FBE8DC', color: '#A53838', border: '1px solid rgba(165,56,56,0.3)' }}>
          {error}
        </div>
      )}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-xl font-display font-semibold text-base flex items-center justify-center gap-2 transition hover:shadow-lg active:scale-[0.98]"
        style={{ background: loading ? '#D9C9A8' : '#A53838', color: loading ? '#8B6F47' : 'white',
                 cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
        {loading ? <><span className="animate-spin">⋯</span> 登入中</> : <><LogIn size={18}/> 登入系統</>}
      </button>
      <button type="button" onClick={onForgot}
        className="w-full text-sm text-center transition hover:underline"
        style={{ color: '#8B6F47' }}>
        忘記密碼？
      </button>
    </form>
  )
}

// ── 忘記密碼表單 ──────────────────────────────────────────
function ForgotForm({ onBack }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('請輸入電子郵件'); return }
    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (authError) {
      setError(`發送失敗：${authError.message}`)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="px-8 pb-8 text-center space-y-4">
        <CheckCircle size={48} className="mx-auto" style={{ color: '#7A9474' }}/>
        <p className="font-display font-semibold" style={{ color: '#5C2828' }}>重設信已寄出</p>
        <p className="text-sm" style={{ color: '#8B6F47' }}>
          請至 <strong>{email}</strong> 信箱收取密碼重設連結。<br/>
          連結有效期限為 1 小時。
        </p>
        <button onClick={onBack}
          className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 border transition hover:bg-orange-50"
          style={{ borderColor: '#C4A87A', color: '#5C2828' }}>
          <ArrowLeft size={16}/> 返回登入
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleReset} className="px-8 pb-8 space-y-4">
      <p className="text-sm" style={{ color: '#8B6F47' }}>
        輸入帳號 Email，系統將寄送密碼重設連結至該信箱。
      </p>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B6F47' }}>帳號 Email</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A09684' }}/>
          <input type="email" className={inputCls} style={{ ...inputSt, paddingLeft: '2.5rem' }}
            placeholder="請輸入電子郵件" value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            autoFocus />
        </div>
      </div>
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm"
          style={{ background: '#FBE8DC', color: '#A53838', border: '1px solid rgba(165,56,56,0.3)' }}>
          {error}
        </div>
      )}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-xl font-display font-semibold flex items-center justify-center gap-2 transition hover:shadow-lg"
        style={{ background: loading ? '#D9C9A8' : '#A53838', color: loading ? '#8B6F47' : 'white',
                 cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '寄送中⋯' : <><Mail size={16}/> 寄送重設連結</>}
      </button>
      <button type="button" onClick={onBack}
        className="w-full text-sm text-center flex items-center justify-center gap-1 transition hover:underline"
        style={{ color: '#8B6F47' }}>
        <ArrowLeft size={13}/> 返回登入
      </button>
    </form>
  )
}

// ── 共用樣式 ──────────────────────────────────────────────
const inputCls = 'w-full px-4 py-3 rounded-xl border text-sm outline-none transition focus:border-cranberry'
const inputSt  = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }

// ── 主元件 ────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'forgot'

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #FBF6EC 0%, #F5E8D0 100%)' }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(165,56,56,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(122,148,116,0.05) 0%, transparent 50%)'
      }}/>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border-2 overflow-hidden shadow-2xl"
          style={{ background: '#FFFAF0', borderColor: '#C4A87A' }}>

          {/* 上方橫幅 */}
          <div className="px-8 pt-10 pb-6 text-center"
            style={{ background: 'linear-gradient(180deg, #FBF1DD 0%, #FFFAF0 100%)' }}>
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 60 60" style={{ width: 64, height: 64 }}
                filter="drop-shadow(0 8px 16px rgba(165,56,56,0.25))">
                <path d="M30 12 C 28 8, 24 6, 22 9" stroke="#7A9474" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <ellipse cx="32" cy="36" rx="18" ry="20" fill="#A53838"/>
                <ellipse cx="26" cy="28" rx="6" ry="8" fill="#C85A5A" opacity="0.6"/>
                <path d="M30 12 Q 32 14, 30 18" stroke="#5C3A1E" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#5C2828' }}>
              水林紅蘋果長照中心
            </h1>
            <p className="text-xs mt-1" style={{ color: '#8B6F47' }}>
              {mode === 'login' ? '案務管理系統 · 請登入以繼續' : '忘記密碼 · 重設您的登入密碼'}
            </p>
          </div>

          {mode === 'login'
            ? <SignInForm onForgot={() => setMode('forgot')} />
            : <ForgotForm onBack={() => setMode('login')} />
          }
        </div>
        <p className="text-center text-xs mt-5" style={{ color: '#B5A285' }}>
          雲林縣家園關懷協會附設雲林縣私立紅蘋果社區式服務類長期照顧服務機構
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

export default function ResetPasswordPage({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8)    { setError('密碼至少需要 8 個字元'); return }
    if (password !== confirm)   { setError('兩次輸入的密碼不符'); return }
    setLoading(true); setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(`更新失敗：${updateError.message}`)
    } else {
      setSuccess(true)
      setTimeout(() => onDone?.(), 3000)
    }
    setLoading(false)
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border text-sm outline-none transition'
  const inputSt  = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }

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
          <h1 className="font-display text-xl font-bold" style={{ color: '#5C2828' }}>設定新密碼</h1>
          <p className="text-xs mt-1" style={{ color: '#8B6F47' }}>水林紅蘋果長照中心 · 案務管理系統</p>
        </div>

        {success ? (
          <div className="px-8 pb-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: '#DFF0E0' }}>
              <CheckCircle size={32} style={{ color: '#2E6E3E' }}/>
            </div>
            <p className="font-display font-semibold text-lg" style={{ color: '#5C2828' }}>密碼更新成功！</p>
            <p className="text-sm" style={{ color: '#8B6F47' }}>3 秒後自動跳回登入頁⋯</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <div className="p-3 rounded-xl text-sm text-center"
              style={{ background: '#FBF1DD', color: '#8B6F47', border: '1px solid #E5D5B7' }}>
              請設定您的新密碼（至少 8 個字元）
            </div>

            {[
              { label: '新密碼',   val: password, set: setPassword, ph: '請輸入新密碼' },
              { label: '確認新密碼', val: confirm,  set: setConfirm,  ph: '請再次輸入新密碼' },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B6F47' }}>{label}</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} className={inputCls}
                    style={{ ...inputSt, paddingRight: '3rem' }}
                    placeholder={ph} value={val}
                    onChange={e => { set(e.target.value); setError('') }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#A09684' }}>
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm flex items-start gap-2"
                style={{ background: '#FBE8DC', color: '#A53838', border: '1px solid rgba(165,56,56,0.3)' }}>
                <span>⚠</span><span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-display font-semibold flex items-center justify-center gap-2 transition hover:shadow-lg"
              style={{ background: loading ? '#D9C9A8' : '#A53838', color: loading ? '#8B6F47' : 'white',
                       cursor: loading ? 'not-allowed' : 'pointer' }}>
              <KeyRound size={16}/> {loading ? '更新中⋯' : '確認設定新密碼'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Eye, EyeOff, KeyRound, Mail, User, Shield, Send, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { fetchPendingUsers, setUserApprovalStatus } from '../api/index.js'

// ── 修改自己的密碼 ─────────────────────────────────────────
function ChangePasswordSection({ user }) {
  const [cur,      setCur]      = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [msg,      setMsg]      = useState(null) // { type: 'ok'|'err', text }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cur)                     { setMsg({ type: 'err', text: '請輸入目前密碼' }); return }
    if (next.length < 8)          { setMsg({ type: 'err', text: '新密碼至少 8 個字元' }); return }
    if (next !== confirm)         { setMsg({ type: 'err', text: '兩次新密碼不符' }); return }
    setLoading(true); setMsg(null)

    // 先用目前密碼重新登入確認身分
    const { error: reAuthErr } = await supabase.auth.signInWithPassword({
      email: user.email, password: cur,
    })
    if (reAuthErr) { setMsg({ type: 'err', text: '目前密碼錯誤，請重新確認' }); setLoading(false); return }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    if (updateErr) {
      setMsg({ type: 'err', text: `更新失敗：${updateErr.message}` })
    } else {
      setMsg({ type: 'ok', text: '密碼已成功更新！' })
      setCur(''); setNext(''); setConfirm('')
    }
    setLoading(false)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition'
  const inputSt  = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {[
        { label: '目前密碼', val: cur,     set: setCur },
        { label: '新密碼',   val: next,    set: setNext },
        { label: '確認新密碼', val: confirm, set: setConfirm },
      ].map(({ label, val, set }) => (
        <div key={label}>
          <label className="block text-xs font-medium mb-1" style={{ color: '#8B6F47' }}>{label}</label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} className={inputCls}
              style={{ ...inputSt, paddingRight: '2.5rem' }}
              placeholder="請輸入密碼" value={val}
              onChange={e => { set(e.target.value); setMsg(null) }} />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: '#A09684' }}>
              {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
      ))}
      {msg && (
        <div className="px-3 py-2 rounded-lg text-sm"
          style={{ background: msg.type === 'ok' ? '#DFF0E0' : '#FBE8DC',
                   color:      msg.type === 'ok' ? '#2E6E3E' : '#A53838',
                   border:     `1px solid ${msg.type === 'ok' ? 'rgba(46,110,62,0.3)' : 'rgba(165,56,56,0.3)'}` }}>
          {msg.text}
        </div>
      )}
      <button type="submit" disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:shadow-md"
        style={{ background: loading ? '#D9C9A8' : '#A53838', color: loading ? '#8B6F47' : 'white',
                 cursor: loading ? 'not-allowed' : 'pointer' }}>
        <KeyRound size={15}/> {loading ? '更新中⋯' : '確認更新密碼'}
      </button>
    </form>
  )
}

// ── 寄送密碼重設信 ─────────────────────────────────────────
function SendResetSection() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState(null)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setMsg({ type: 'err', text: '請輸入 Email' }); return }
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })
    if (error) {
      setMsg({ type: 'err', text: `發送失敗：${error.message}` })
    } else {
      setMsg({ type: 'ok', text: `已將重設連結寄至 ${email}，有效期 1 小時。` })
      setEmail('')
    }
    setLoading(false)
  }

  const inputCls = 'flex-1 px-3 py-2.5 rounded-lg border text-sm outline-none transition'
  const inputSt  = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }

  return (
    <form onSubmit={handleSend} className="space-y-3">
      <p className="text-sm" style={{ color: '#8B6F47' }}>
        輸入任一帳號的 Email，系統將寄送密碼重設連結。對方點擊連結後即可自行設定新密碼。
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#A09684' }}/>
          <input type="email" className={inputCls} style={{ ...inputSt, paddingLeft: '2.2rem' }}
            placeholder="輸入帳號 Email" value={email}
            onChange={e => { setEmail(e.target.value); setMsg(null) }} />
        </div>
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition hover:shadow-md flex-shrink-0"
          style={{ background: loading ? '#D9C9A8' : '#A53838', color: loading ? '#8B6F47' : 'white',
                   cursor: loading ? 'not-allowed' : 'pointer' }}>
          <Send size={14}/> {loading ? '寄送中⋯' : '寄送'}
        </button>
      </div>
      {msg && (
        <div className="px-3 py-2 rounded-lg text-sm"
          style={{ background: msg.type === 'ok' ? '#DFF0E0' : '#FBE8DC',
                   color:      msg.type === 'ok' ? '#2E6E3E' : '#A53838',
                   border:     `1px solid ${msg.type === 'ok' ? 'rgba(46,110,62,0.3)' : 'rgba(165,56,56,0.3)'}` }}>
          {msg.text}
        </div>
      )}
    </form>
  )
}

// ── 帳號審核（管理員）──────────────────────────────────────
function ApprovalSection() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [busy,    setBusy]    = useState({}) // userId → true while processing

  const load = () => {
    setLoading(true)
    fetchPendingUsers().then(data => { setUsers(data); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handle = async (userId, status) => {
    setBusy(b => ({ ...b, [userId]: true }))
    try {
      await setUserApprovalStatus(userId, status)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(b => ({ ...b, [userId]: false }))
    }
  }

  const inputSt = { background: '#FBF6EC', borderColor: '#C4A87A', color: '#5C2828' }

  return (
    <div className="rounded-2xl p-5 border" style={{ background: '#FBF6EC', borderColor: '#C4A87A' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={18} style={{ color: '#A53838' }}/>
          <h3 className="font-display font-semibold" style={{ color: '#5C2828' }}>帳號審核</h3>
        </div>
        <button onClick={load} disabled={loading}
          className="p-1.5 rounded-lg hover:bg-orange-100 transition" title="重新整理">
          <RefreshCw size={15} style={{ color: '#8B6F47', animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-center py-4" style={{ color: '#A09684' }}>載入中⋯</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: '#A09684' }}>目前沒有待審核的帳號</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: '#FFFAF0', border: '1px solid #E5D5B7' }}>
              {/* 狀態圖示 */}
              <div className="flex-shrink-0">
                {u.status === 'pending'  && <Clock      size={18} style={{ color: '#C68B4F' }}/>}
                {u.status === 'approved' && <CheckCircle2 size={18} style={{ color: '#2E6E3E' }}/>}
                {u.status === 'rejected' && <XCircle    size={18} style={{ color: '#A53838' }}/>}
              </div>

              {/* Email 與時間 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: '#5C2828' }}>{u.email}</div>
                <div className="text-xs" style={{ color: '#A09684' }}>
                  申請時間：{new Date(u.created_at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="flex gap-1.5 flex-shrink-0">
                {u.status !== 'approved' && (
                  <button onClick={() => handle(u.id, 'approved')} disabled={!!busy[u.id]}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:shadow-sm"
                    style={{ background: '#7A9474', color: 'white', opacity: busy[u.id] ? 0.5 : 1 }}>
                    核准
                  </button>
                )}
                {u.status !== 'rejected' && (
                  <button onClick={() => handle(u.id, 'rejected')} disabled={!!busy[u.id]}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:shadow-sm"
                    style={{ background: '#F0D5D0', color: '#8B2C20', opacity: busy[u.id] ? 0.5 : 1 }}>
                    拒絕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 主 AccountView ─────────────────────────────────────────
export default function AccountView({ user }) {
  const userDisplay = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '使用者'
  const isAdmin     = user?.user_metadata?.role === 'admin'

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* 頁頭 */}
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <h2 className="font-display text-xl font-semibold" style={{ color: '#5C2828' }}>帳號設定</h2>
        <p className="text-sm mt-1" style={{ color: '#8B6F47' }}>管理登入資訊與密碼</p>
      </div>

      {/* 目前帳號資訊 */}
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <h3 className="font-display font-semibold mb-4" style={{ color: '#5C2828' }}>目前帳號</h3>
        <div className="flex items-center gap-4 p-4 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #FBF1DD, #FBF6EC)', border: '1px solid #E5D5B7' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: '#A53838' }}>
            <User size={20}/>
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold" style={{ color: '#5C2828' }}>{userDisplay}</div>
            <div className="text-sm" style={{ color: '#8B6F47' }}>{user?.email}</div>
          </div>
          {isAdmin && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: '#A53838', color: 'white' }}>
              <Shield size={12}/> 管理員
            </span>
          )}
        </div>
      </div>

      {/* 修改自己的密碼 */}
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={18} style={{ color: '#A53838' }}/>
          <h3 className="font-display font-semibold" style={{ color: '#5C2828' }}>修改我的密碼</h3>
        </div>
        <ChangePasswordSection user={user}/>
      </div>

      {/* 寄送密碼重設信 */}
      <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} style={{ color: '#A53838' }}/>
          <h3 className="font-display font-semibold" style={{ color: '#5C2828' }}>寄送密碼重設信</h3>
        </div>
        <SendResetSection/>
      </div>

      {/* 帳號審核（管理員才看得到） */}
      {isAdmin && <ApprovalSection />}
    </div>
  )
}

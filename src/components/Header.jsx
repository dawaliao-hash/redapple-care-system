import { useState, useEffect } from 'react'
import { LogOut, User, RefreshCw } from 'lucide-react'
import { todayStr, weekDay } from '../utils/date.js'

export default function Header({ syncing, lastSync, isOnline, user, signOut, onSync }) {
  const [confirmLogout, setConfirmLogout] = useState(false)

  const userDisplay = user?.user_metadata?.display_name
    || user?.email?.split('@')[0]
    || '使用者'

  return (
    <header className="border-b-2" style={{ background: 'linear-gradient(135deg, #FFFAF0 0%, #FBF1DD 100%)', borderColor: '#C4A87A' }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">

        {/* 左：Logo + 機構名稱 */}
        <div className="flex items-center gap-4">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg viewBox="0 0 60 60" className="w-11 h-11">
              <path d="M30 12 C 28 8, 24 6, 22 9" stroke="#7A9474" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <ellipse cx="32" cy="36" rx="18" ry="20" fill="#A53838" />
              <ellipse cx="26" cy="28" rx="6" ry="8" fill="#C85A5A" opacity="0.6" />
              <path d="M30 12 Q 32 14, 30 18" stroke="#5C3A1E" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-wide" style={{ color: '#5C2828' }}>
              水林紅蘋果長照中心
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs font-body hidden md:block" style={{ color: '#8B6F47' }}>
                雲林縣家園關懷協會附設雲林縣私立紅蘋果社區式服務類長期照顧服務機構
              </p>
              {/* 同步狀態 */}
              <span className="flex items-center gap-1 text-xs flex-shrink-0"
                style={{ color: syncing ? '#C68B4F' : '#7A9474' }}>
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ background: syncing ? '#C68B4F' : '#7A9474' }}></span>
                {syncing ? '更新中' : '假日已更新'}
              </span>
              <span className="flex items-center gap-1 text-xs flex-shrink-0"
                style={{ color: isOnline ? '#7A9474' : '#C68B4F' }}>
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ background: isOnline ? '#7A9474' : '#C68B4F' }}></span>
                {isOnline ? '雲端同步' : '離線模式'}
              </span>
              {/* 手動同步按鈕 */}
              {isOnline && onSync && (
                <button onClick={onSync}
                  className="flex items-center gap-1 text-xs flex-shrink-0 hover:opacity-70 transition"
                  style={{ color: '#7A9474' }} title="立即同步最新資料">
                  <RefreshCw size={11}/> 同步
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右：日期 + 登入者 + 登出 */}
        <div className="flex items-center gap-4 text-sm font-body">
          <div className="flex flex-col items-end">
            <span className="text-xs" style={{ color: '#8B6F47' }}>今天</span>
            <span className="font-medium" style={{ color: '#5C2828' }}>{todayStr} 星期{weekDay}</span>
          </div>

          <div className="h-8 w-px" style={{ background: '#C4A87A' }}></div>

          {/* 使用者資訊 */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: '#A53838' }}>
              <User size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: '#5C2828' }}>{userDisplay}</span>
              <span className="text-xs" style={{ color: '#8B6F47' }}>
                {user?.user_metadata?.role === 'admin' ? '管理員' : '承辦'}
              </span>
            </div>
          </div>

          {/* 登出按鈕 */}
          {!confirmLogout ? (
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition hover:bg-red-50"
              style={{ borderColor: '#E5D5B7', color: '#8B6F47' }}
              title="登出">
              <LogOut size={14} /> 登出
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: '#A53838' }}>確認登出？</span>
              <button
                onClick={() => { signOut?.(); setConfirmLogout(false) }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ background: '#A53838', color: 'white' }}>
                確認
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="px-2.5 py-1 rounded-lg text-xs border"
                style={{ borderColor: '#C4A87A', color: '#5C3A1E' }}>
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

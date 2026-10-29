import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// 自動更新：切回頁面或每 5 分鐘檢查一次，若已部署新版本（入口 JS 檔名不同）就重新載入，
// 避免長時間開著的分頁一直跑舊程式（例如新增的權限限制沒生效）
const currentEntry = () =>
  document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute('src')
async function checkForUpdate() {
  const mine = currentEntry()
  if (!mine) return   // 開發模式（vite dev）沒有打包檔名，不檢查
  try {
    const html = await fetch('/', { cache: 'no-store' }).then(r => r.text())
    const latest = html.match(/\/assets\/index-[^"]+\.js/)?.[0]
    if (latest && latest !== mine) window.location.reload()
  } catch { /* 離線時略過 */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate()
})
setInterval(checkForUpdate, 5 * 60 * 1000)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

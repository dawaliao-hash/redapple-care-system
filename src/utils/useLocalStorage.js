import { useState, useEffect } from 'react'

/**
 * useState 的 localStorage 版本。
 * 第一次載入從 localStorage 讀取，若無資料則用 initialValue（可為函式）。
 * 每次狀態變動後自動寫回 localStorage。
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored)
    } catch { /* ignore parse errors */ }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch { /* ignore quota errors */ }
  }, [key, value])

  return [value, setValue]
}

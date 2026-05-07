import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('[Supabase] 缺少環境變數，將以離線模式（localStorage）運行')
}

export const supabase = url && key
  ? createClient(url, key)
  : null

export const isOnline = !!supabase

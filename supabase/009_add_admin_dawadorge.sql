-- 009_add_admin_dawadorge.sql
-- 將 dawadorge@gmail.com 設為管理員
-- 前提：該帳號必須已經在系統「建立新帳號」註冊過（auth.users 裡要有這筆）
-- 在 Supabase Dashboard > SQL Editor 貼上執行

-- 1. 設定 role = admin
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'dawadorge@gmail.com';

-- 2. 審核狀態標記為 approved（若 user_approvals 表存在）
INSERT INTO public.user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', now()
FROM auth.users
WHERE email = 'dawadorge@gmail.com'
ON CONFLICT (id) DO UPDATE SET status = 'approved', approved_at = now();

-- 3. 確認結果（執行後可看到該帳號 role 已是 admin）
SELECT email, raw_user_meta_data ->> 'role' AS role
FROM auth.users
WHERE email = 'dawadorge@gmail.com';

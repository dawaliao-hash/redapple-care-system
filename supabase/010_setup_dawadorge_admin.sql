-- 010_setup_dawadorge_admin.sql
-- 一次設定好 dawadorge@gmail.com：密碼 = Bright213、確認信箱、設為管理員、審核通過
-- 在 Supabase Dashboard > SQL Editor 貼上執行
-- （此帳號已於 2026-05-20 註冊存在，這支 SQL 直接覆寫密碼與狀態）

-- 1. 設定密碼為 Bright213 + 確認信箱（免驗證即可登入）+ 設為 admin
UPDATE auth.users
SET
  encrypted_password = extensions.crypt('Bright213', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb,
  updated_at = now()
WHERE email = 'dawadorge@gmail.com';

-- 2. 審核狀態標記為 approved（若 user_approvals 表已存在）
INSERT INTO public.user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', now()
FROM auth.users
WHERE email = 'dawadorge@gmail.com'
ON CONFLICT (id) DO UPDATE SET status = 'approved', approved_at = now();

-- 3. 確認結果
SELECT
  email,
  (email_confirmed_at IS NOT NULL) AS email_confirmed,
  raw_user_meta_data ->> 'role'    AS role
FROM auth.users
WHERE email = 'dawadorge@gmail.com';

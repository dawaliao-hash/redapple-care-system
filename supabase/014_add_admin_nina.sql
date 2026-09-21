-- 014_add_admin_nina.sql
-- 將 nina0626790@gmail.com 設為管理員：確認信箱 + role=admin + 審核通過
-- 前提：該帳號已註冊（auth.users 內已存在）
-- 在 Supabase Dashboard > SQL Editor 貼上執行

UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb,
  updated_at = now()
WHERE email = 'nina0626790@gmail.com';

INSERT INTO public.user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', now()
FROM auth.users
WHERE email = 'nina0626790@gmail.com'
ON CONFLICT (id) DO UPDATE SET status = 'approved', approved_at = now();

-- 確認結果（應顯示 email_confirmed = true, role = admin）
SELECT email, (email_confirmed_at IS NOT NULL) AS email_confirmed,
       raw_user_meta_data ->> 'role' AS role
FROM auth.users WHERE email = 'nina0626790@gmail.com';

-- 008_auto_approval_trigger.sql
-- 當任何新用戶在 Supabase 完成註冊時，自動建立「待審核」記錄
-- 這樣即使前端 registerApprovalRequest() 失敗，也不會漏掉審核
-- SECURITY DEFINER 表示以資料庫擁有者身份執行，不受 RLS 限制

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_approvals (id, email, status)
  VALUES (NEW.id, NEW.email, 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 移除舊 trigger（若已存在）再重建
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 設定管理員（amuy.chen 與 dawadorge）— 寫入 role=admin 並標記 approved
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email IN ('amuy.chen@gmail.com', 'dawadorge@gmail.com');

INSERT INTO public.user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', now()
FROM auth.users
WHERE email IN ('amuy.chen@gmail.com', 'dawadorge@gmail.com')
ON CONFLICT (id) DO UPDATE SET status = 'approved';

-- 其他沒有記錄的舊用戶補上 approved（已存在的舊帳號）
INSERT INTO public.user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', now()
FROM auth.users
WHERE email != 'amuy.chen@gmail.com'
ON CONFLICT (id) DO NOTHING;

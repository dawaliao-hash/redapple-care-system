-- ================================================================
-- 004: 帳號審核系統（安全版 — 可重複執行，不會因已存在而報錯）
-- 在 Supabase Dashboard > SQL Editor 貼上並執行
-- ================================================================

-- ── 1. 建立帳號審核資料表 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_approvals (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz DEFAULT now(),
  approved_at timestamptz,
  note        text
);

-- ── 2. RLS 政策（先刪舊的再建新的，避免重複執行報錯）────────────
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own"   ON user_approvals;
DROP POLICY IF EXISTS "admin_read_all"   ON user_approvals;
DROP POLICY IF EXISTS "admin_update"     ON user_approvals;
DROP POLICY IF EXISTS "users_insert_own" ON user_approvals;
DROP POLICY IF EXISTS "self_read"        ON user_approvals;
DROP POLICY IF EXISTS "admin_all"        ON user_approvals;
DROP POLICY IF EXISTS "self_insert"      ON user_approvals;

-- 使用者可讀取自己的審核狀態
CREATE POLICY "users_read_own" ON user_approvals
  FOR SELECT USING (auth.uid() = id);

-- Admin 可讀取所有審核記錄
CREATE POLICY "admin_read_all" ON user_approvals
  FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Admin 可更新審核狀態
CREATE POLICY "admin_update" ON user_approvals
  FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 任何已登入使用者可新增自己的申請
CREATE POLICY "users_insert_own" ON user_approvals
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── 3. 設定 amuy.chen@gmail.com 為管理員 ─────────────────────────
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb)
  || '{"role": "admin", "display_name": "Amy Chen"}'::jsonb
WHERE email = 'amuy.chen@gmail.com';

-- 管理員標記為 approved
INSERT INTO user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', NOW()
FROM auth.users
WHERE email = 'amuy.chen@gmail.com'
ON CONFLICT (id) DO UPDATE SET status = 'approved', approved_at = NOW();

-- 所有現有帳號一律標為 approved（舊帳號不需重新審核）
INSERT INTO user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', NOW()
FROM auth.users
WHERE email != 'amuy.chen@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- ── 4. 開啟 Realtime 即時同步（安全版）──────────────────────────
-- 若資料表已在 publication 中會忽略錯誤
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
EXCEPTION WHEN others THEN
  NULL; -- 已存在則跳過
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
EXCEPTION WHEN others THEN
  NULL;
END $$;

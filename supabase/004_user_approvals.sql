-- ================================================================
-- 004: 帳號審核系統
-- 在 Supabase Dashboard > SQL Editor 貼上並執行
-- ================================================================

-- ── 1. 建立帳號審核資料表 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_approvals (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',  -- pending / approved / rejected
  created_at  timestamptz DEFAULT now(),
  approved_at timestamptz,
  note        text
);

-- ── 2. RLS 政策 ─────────────────────────────────────────────────
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;

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

-- 將管理員帳號標記為 approved（避免自己被擋在審核外）
INSERT INTO user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', NOW()
FROM auth.users
WHERE email = 'amuy.chen@gmail.com'
ON CONFLICT (id) DO UPDATE SET status = 'approved', approved_at = NOW();

-- 同樣 approved 現有其他帳號（舊帳號不需要重新審核）
INSERT INTO user_approvals (id, email, status, approved_at)
SELECT id, email, 'approved', NOW()
FROM auth.users
WHERE email != 'amuy.chen@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- ── 5. 開啟 Realtime（讓多用戶同步即時生效）────────────────────
-- 將出缺席與配對資料表加入 realtime 訂閱
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;

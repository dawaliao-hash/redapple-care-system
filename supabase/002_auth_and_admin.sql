-- ================================================================
-- 水林紅蘋果長照中心 · 002_auth_and_admin.sql
-- 請在 Supabase Dashboard > SQL Editor 執行此檔案
-- ================================================================

-- ── 1. 更新 RLS 政策：改為需要登入才可存取 ────────────────────

-- 先移除舊的公開政策
DROP POLICY IF EXISTS "public_all" ON caregivers;
DROP POLICY IF EXISTS "public_all" ON recipients;
DROP POLICY IF EXISTS "public_all" ON attendance;
DROP POLICY IF EXISTS "public_all" ON assignments;
DROP POLICY IF EXISTS "public_all" ON health_records;

-- 建立新政策：需要登入（authenticated）才可讀寫
CREATE POLICY "auth_all" ON caregivers     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON recipients     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON attendance     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON assignments    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON health_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 2. 建立 admin 帳號 ────────────────────────────────────────
-- 帳號：admin@redapple.care
-- 密碼：RedApple@2026!
-- （請登入後立即到「個人設定」修改密碼）

DO $$
DECLARE
  new_uid UUID := gen_random_uuid();
BEGIN
  -- 若帳號已存在則跳過
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@redapple.care') THEN

    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      recovery_token, email_change_token_new, email_change,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token
    ) VALUES (
      new_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin@redapple.care',
      crypt('RedApple@2026!', gen_salt('bf')),
      now(),
      '', '', '',
      now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"管理員","role":"admin"}',
      false, ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data,
      provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      new_uid,
      new_uid::text,
      jsonb_build_object('sub', new_uid::text, 'email', 'admin@redapple.care'),
      'email', now(), now(), now()
    );

    RAISE NOTICE '✅ admin 帳號建立成功：admin@redapple.care';
  ELSE
    RAISE NOTICE '⚠️  admin 帳號已存在，跳過建立';
  END IF;
END $$;

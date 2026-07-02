-- 012_fix_rls_authenticated.sql
-- 【根本修正】開放「已登入使用者(authenticated)」讀寫核心資料表
-- 問題：原本 RLS 只允許 anon，登入後(authenticated)讀到 0 筆、寫入被 403 擋下
-- 導致所有裝置各自用 localStorage、完全不同步。
-- 在 Supabase Dashboard > SQL Editor 貼上執行（可重複執行，安全）

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['recipients','caregivers','attendance','assignments','health_records']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- 已登入使用者：完整讀寫
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "authenticated_all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    -- 未登入(anon)：也允許（離線/未登入情境的相容）
    EXECUTE format('DROP POLICY IF EXISTS "anon_all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "anon_all" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- 確認每個表都有 authenticated_all 政策
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('recipients','caregivers','attendance','assignments','health_records')
ORDER BY tablename, policyname;

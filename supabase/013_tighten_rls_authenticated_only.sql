-- 013_tighten_rls_authenticated_only.sql
-- 【資安收緊】移除「未登入(anon)也能讀寫」的權限，只允許已登入使用者存取
--
-- 為什麼：anon 金鑰本來就公開在前端網頁原始碼中，若資料表開放 anon 全權存取，
-- 任何人拿到金鑰即可讀取全部長者的姓名/地址/電話/病史（長照個資外洩風險）。
--
-- 影響：App 本來就需登入才能使用，功能完全不受影響。
-- 保活排程(keepalive.yml)也不受影響（SELECT 在 RLS 下回傳空陣列 200，仍算專案活動）。
--
-- 前提：Supabase 專案需為 Active（若顯示 Paused 請先 Restore）
-- 在 Supabase Dashboard > SQL Editor 貼上執行（可重複執行，安全）

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['recipients','caregivers','attendance','assignments','health_records']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- 移除公開(未登入)存取權限
    EXECUTE format('DROP POLICY IF EXISTS "anon_all" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "public_all" ON public.%I', t);

    -- 只保留：已登入使用者可完整讀寫
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "authenticated_all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- 確認結果：每個資料表應該「只剩 authenticated_all 一條」（共 5 行）
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('recipients','caregivers','attendance','assignments','health_records')
ORDER BY tablename, policyname;

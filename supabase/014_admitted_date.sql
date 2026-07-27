-- 014_admitted_date.sql
-- 為 recipients 新增「開案日期 admitted_at」欄位
-- 用途：月度點名/月度人力依此判斷長者從哪個月份開始出現在名單
--（NULL = 系統建置前就在案，所有月份都顯示）
-- 在 Supabase Dashboard > SQL Editor 貼上執行（可重複執行，安全）

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='recipients' AND column_name='admitted_at') THEN
    ALTER TABLE recipients ADD COLUMN admitted_at TEXT DEFAULT NULL;
  END IF;
END $$;

-- 確認
SELECT column_name FROM information_schema.columns
WHERE table_name='recipients' AND column_name='admitted_at';

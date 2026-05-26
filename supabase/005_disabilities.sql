-- 005_disabilities.sql
-- 為 recipients 表新增 disabilities JSONB 欄位（儲存身障類別與等級陣列）
-- 安全：欄位不存在才新增，可重複執行

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipients' AND column_name = 'disabilities'
  ) THEN
    ALTER TABLE recipients ADD COLUMN disabilities JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

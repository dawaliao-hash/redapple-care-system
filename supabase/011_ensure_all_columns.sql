-- 011_ensure_all_columns.sql
-- 一次補齊 recipients / caregivers 所有新欄位（結案、離職、身障、服務類別）
-- 這是讓「結案狀態能永久存進雲端、跨裝置一致」的關鍵
-- 在 Supabase Dashboard > SQL Editor 貼上執行（可重複執行，安全）

-- ── recipients：身障、服務類別、結案管理 ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipients' AND column_name='disabilities') THEN
    ALTER TABLE recipients ADD COLUMN disabilities JSONB NOT NULL DEFAULT '{"categories":[],"level":"輕度"}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipients' AND column_name='service_category') THEN
    ALTER TABLE recipients ADD COLUMN service_category TEXT NOT NULL DEFAULT 'elderly';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipients' AND column_name='is_active') THEN
    ALTER TABLE recipients ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipients' AND column_name='closed_at') THEN
    ALTER TABLE recipients ADD COLUMN closed_at TEXT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipients' AND column_name='close_reason') THEN
    ALTER TABLE recipients ADD COLUMN close_reason TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- ── caregivers：離職管理 ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caregivers' AND column_name='is_active') THEN
    ALTER TABLE caregivers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caregivers' AND column_name='resigned_at') THEN
    ALTER TABLE caregivers ADD COLUMN resigned_at TEXT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='caregivers' AND column_name='resign_reason') THEN
    ALTER TABLE caregivers ADD COLUMN resign_reason TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- 確認欄位已存在
SELECT table_name, column_name
FROM information_schema.columns
WHERE (table_name='recipients' AND column_name IN ('disabilities','service_category','is_active','closed_at','close_reason'))
   OR (table_name='caregivers' AND column_name IN ('is_active','resigned_at','resign_reason'))
ORDER BY table_name, column_name;

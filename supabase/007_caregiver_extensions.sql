-- 007_caregiver_extensions.sql
-- 為 caregivers 表新增離職管理欄位

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

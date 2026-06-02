-- 006_recipient_extensions.sql
-- 新增服務身份類別、結案管理欄位

DO $$ BEGIN
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

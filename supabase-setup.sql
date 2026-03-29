-- ============================================================
-- NESHINDUSTRIES WORKERS APP - UPDATED DB SETUP
-- This script is safe to run even if tables already exist.
-- ============================================================

-- 1. Ensure Workers Table exists
CREATE TABLE IF NOT EXISTS workers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  daily_wage  NUMERIC DEFAULT 0,
  pin         TEXT DEFAULT '0000',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Attendance Table exists and has mod_count
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (worker_id, date)
);

-- ADD mod_count if it doesn't exist
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS mod_count INTEGER DEFAULT 0;

-- 3. Ensure Advances Table exists
CREATE TABLE IF NOT EXISTS advances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  amount      NUMERIC NOT NULL DEFAULT 0,
  date        DATE NOT NULL,
  reason      TEXT DEFAULT '',
  added_by    TEXT DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure Settings Table exists
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL
);

-- Insert default settings if they don't exist
INSERT INTO settings (key, value) VALUES 
  ('admin_password_hash', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'), -- admin123
  ('language_pref', 'en')
ON CONFLICT (key) DO NOTHING;

-- 5. ENABLE REAL-TIME (Safe way to add tables to publication)
-- This block checks if the table is already in the publication before adding it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'workers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE workers;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'attendance') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'advances') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE advances;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE settings;
  END IF;
END $$;

-- 6. DISABLE Row Level Security (Internal tool)
ALTER TABLE workers    DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE advances   DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings   DISABLE ROW LEVEL SECURITY;

-- ✅ All set!

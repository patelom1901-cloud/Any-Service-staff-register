-- ============================================================
-- NESHINDUSTRIES WORKERS APP - SUPABASE DATABASE SETUP
-- Run this ENTIRE script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- 1. WORKERS TABLE
CREATE TABLE IF NOT EXISTS workers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  daily_wage  NUMERIC DEFAULT 0,
  pin         TEXT DEFAULT '0000',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (worker_id, date)
);

-- 3. ADVANCES TABLE
CREATE TABLE IF NOT EXISTS advances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  amount      NUMERIC NOT NULL DEFAULT 0,
  date        DATE NOT NULL,
  reason      TEXT DEFAULT '',
  added_by    TEXT DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE REAL-TIME on all tables
-- (Required so changes instantly push to all connected devices)
ALTER PUBLICATION supabase_realtime ADD TABLE workers;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE advances;

-- 5. DISABLE Row Level Security
-- (This is an internal company tool — the anon key is only shared with staff)
ALTER TABLE workers   DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE advances  DISABLE ROW LEVEL SECURITY;

-- ✅ Done! Your database is ready.
-- The app will automatically migrate any existing data on first admin login.

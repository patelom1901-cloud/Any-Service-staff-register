import { supabase } from './supabase';
import { sanitizeInput } from './security';

// ─── Column mappers ───────────────────────────────────────────────────────────

export function mapWorker(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    dailyWage: Number(row.daily_wage) || 0,
    pin: row.pin || '0000',
    createdAt: row.created_at,
  };
}

export function mapAttendance(row) {
  return {
    id: row.id,
    workerId: row.worker_id,
    date: row.date,
    status: row.status,
  };
}

export function mapAdvance(row) {
  return {
    id: row.id,
    workerId: row.worker_id,
    amount: Number(row.amount) || 0,
    date: row.date,
    reason: row.reason || '',
    addedBy: row.added_by || 'admin',
    createdAt: row.created_at,
  };
}

// ─── Workers ──────────────────────────────────────────────────────────────────

export async function fetchWorkers() {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchWorkers:', error); return []; }
  return (data || []).map(mapWorker);
}

export async function addWorkerDB(worker) {
  const { data, error } = await supabase
    .from('workers')
    .insert([{
      name: sanitizeInput(worker.name),
      phone: sanitizeInput(worker.phone || ''),
      daily_wage: worker.dailyWage,
      pin: worker.pin || '0000',
    }])
    .select()
    .single();
  if (error) throw error;
  return mapWorker(data);
}

export async function updateWorkerDB(id, updates) {
  const payload = {};
  if (updates.name !== undefined) payload.name = sanitizeInput(updates.name);
  if (updates.phone !== undefined) payload.phone = sanitizeInput(updates.phone || '');
  if (updates.dailyWage !== undefined) payload.daily_wage = updates.dailyWage;
  if (updates.pin !== undefined) payload.pin = updates.pin;

  const { error } = await supabase.from('workers').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteWorkerDB(id) {
  const { error } = await supabase.from('workers').delete().eq('id', id);
  if (error) throw error;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function fetchAttendance(workerId = null) {
  let q = supabase.from('attendance').select('*');
  if (workerId) q = q.eq('worker_id', workerId);
  const { data, error } = await q.order('date', { ascending: false });
  if (error) { console.error('fetchAttendance:', error); return []; }
  return (data || []).map(mapAttendance);
}

export async function markAttendanceDB(workerId, date, status) {
  if (status === null) {
    // Remove record
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('worker_id', workerId)
      .eq('date', date);
    if (error) throw error;
    return;
  }

  // Upsert
  const { error } = await supabase.from('attendance').upsert(
    [{ worker_id: workerId, date, status }],
    { onConflict: 'worker_id,date' }
  );
  if (error) throw error;
}

// ─── Advances ─────────────────────────────────────────────────────────────────

export async function fetchAdvances(workerId = null) {
  let q = supabase.from('advances').select('*');
  if (workerId) q = q.eq('worker_id', workerId);
  const { data, error } = await q.order('date', { ascending: false });
  if (error) { console.error('fetchAdvances:', error); return []; }
  return (data || []).map(mapAdvance);
}

export async function addAdvanceDB(advance) {
  const { data, error } = await supabase
    .from('advances')
    .insert([{
      worker_id: advance.workerId,
      amount: advance.amount,
      date: advance.date,
      reason: sanitizeInput(advance.reason || ''),
      added_by: 'admin',
    }])
    .select()
    .single();
  if (error) throw error;
  return mapAdvance(data);
}

export async function deleteAdvanceDB(id) {
  const { error } = await supabase.from('advances').delete().eq('id', id);
  if (error) throw error;
}

// ─── Attendance window (stays local — pure time logic) ────────────────────────
const OPEN_HOUR = 8, OPEN_MINUTE = 30, CLOSE_HOUR = 11, CLOSE_MINUTE = 0;
const MAX_MODS = 2;
const MODS_KEY = 'asar_mods_v2';

export function isAttendanceWindowOpen() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= OPEN_HOUR * 60 + OPEN_MINUTE && mins <= CLOSE_HOUR * 60 + CLOSE_MINUTE;
}

export function getAttendanceWindowStatus() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const open = OPEN_HOUR * 60 + OPEN_MINUTE;
  const close = CLOSE_HOUR * 60 + CLOSE_MINUTE;
  if (mins < open) return { open: false, reason: `Opens in ${open - mins} minutes (8:30 AM)` };
  if (mins > close) return { open: false, reason: 'Attendance closed for today (11:00 AM)' };
  return { open: true, reason: `Closes in ${close - mins} minutes` };
}

function getModsStore() {
  try { return JSON.parse(localStorage.getItem(MODS_KEY) || '{}'); } catch { return {}; }
}

export function getModificationCount(workerId, date) {
  return getModsStore()[`${workerId}_${date}`] || 0;
}

export function incrementModification(workerId, date) {
  const store = getModsStore();
  const key = `${workerId}_${date}`;
  store[key] = (store[key] || 0) + 1;
  localStorage.setItem(MODS_KEY, JSON.stringify(store));
}

export function canMarkAttendance(workerId) {
  if (!isAttendanceWindowOpen()) {
    return { allowed: false, reason: getAttendanceWindowStatus().reason, remaining: 0 };
  }
  const today = new Date().toISOString().split('T')[0];
  const count = getModificationCount(workerId, today);
  if (count >= MAX_MODS) {
    return { allowed: false, reason: `Used all ${MAX_MODS} modifications today. Contact admin.`, remaining: 0 };
  }
  return { allowed: true, reason: null, remaining: MAX_MODS - count };
}

// ─── Stats helpers (operate on in-memory arrays) ──────────────────────────────

export function computeMonthlyStats(workerId, year, month, attendance, advances) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const att = attendance.filter(a => a.workerId === workerId && a.date.startsWith(prefix));
  const adv = advances.filter(a => a.workerId === workerId && a.date.startsWith(prefix));

  let present = 0, halfDay = 0, absent = 0;
  att.forEach(a => {
    if (a.status === 'present') present++;
    else if (a.status === 'half') halfDay++;
    else if (a.status === 'absent') absent++;
  });

  const totalAdvance = adv.reduce((s, a) => s + a.amount, 0);
  return { present, halfDay, absent, totalAdvance, attendanceDays: present + halfDay * 0.5 };
}

export function computeWorkerBalance(workerId, year, month, workers, attendance, advances) {
  const worker = workers.find(w => w.id === workerId);
  if (!worker) return { earned: 0, advance: 0, balance: 0 };
  const stats = computeMonthlyStats(workerId, year, month, attendance, advances);
  const earned = stats.attendanceDays * worker.dailyWage;
  return { earned, advance: stats.totalAdvance, balance: earned - stats.totalAdvance };
}

// ─── Migration: localStorage → Supabase (runs once on first admin login) ──────

export async function migrateLocalStorageToSupabase() {
  const migrated = localStorage.getItem('asar_migrated_to_supabase');
  if (migrated) return;

  try {
    const oldWorkers = JSON.parse(localStorage.getItem('asar_workers') || '[]');
    const oldAttendance = JSON.parse(localStorage.getItem('asar_attendance') || '[]');
    const oldAdvances = JSON.parse(localStorage.getItem('asar_advances') || '[]');

    if (oldWorkers.length === 0) {
      localStorage.setItem('asar_migrated_to_supabase', '1');
      return;
    }

    // Check if supabase already has data
    const { data: existing } = await supabase.from('workers').select('id').limit(1);
    if (existing && existing.length > 0) {
      localStorage.setItem('asar_migrated_to_supabase', '1');
      return;
    }

    // Insert workers preserving IDs
    if (oldWorkers.length > 0) {
      await supabase.from('workers').insert(
        oldWorkers.map(w => ({
          id: w.id,
          name: w.name,
          phone: w.phone || '',
          daily_wage: w.dailyWage || 0,
          pin: w.pin || '0000',
          created_at: w.createdAt || new Date().toISOString(),
        }))
      );
    }

    // Insert attendance
    if (oldAttendance.length > 0) {
      const attRows = oldAttendance
        .filter(a => a.status !== null && a.workerId)
        .map(a => ({
          worker_id: a.workerId,
          date: a.date,
          status: a.status,
        }));
      if (attRows.length > 0) await supabase.from('attendance').insert(attRows);
    }

    // Insert advances
    if (oldAdvances.length > 0) {
      await supabase.from('advances').insert(
        oldAdvances.map(a => ({
          id: a.id,
          worker_id: a.workerId,
          amount: a.amount,
          date: a.date,
          reason: a.reason || '',
          added_by: 'admin',
          created_at: a.createdAt || new Date().toISOString(),
        }))
      );
    }

    localStorage.setItem('asar_migrated_to_supabase', '1');
    console.log('✅ Migrated localStorage data to Supabase');
  } catch (err) {
    console.error('Migration error (non-fatal):', err);
  }
}

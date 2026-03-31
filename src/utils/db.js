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
    modCount: row.mod_count || 0,
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

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings() {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) { console.error('fetchSettings:', error); return {}; }
  const settings = {};
  (data || []).forEach(s => { settings[s.key] = s.value; });
  return settings;
}

export async function updateSetting(key, value) {
  const { error } = await supabase.from('settings').upsert({ key, value });
  if (error) throw error;
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

export async function markAttendanceDB(workerId, date, status, incrementMod = false) {
  if (status === null) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('worker_id', workerId)
      .eq('date', date);
    if (error) throw error;
    return;
  }

  if (incrementMod) {
    // We use a raw RPC or a careful select+update if we want to be safe, 
    // but for this app a simple upsert with increment logic or separate select is fine.
    // Let's do a select first to get current mod_count
    const { data: existing } = await supabase
      .from('attendance')
      .select('mod_count')
      .eq('worker_id', workerId)
      .eq('date', date)
      .single();
    
    const newModCount = (existing?.mod_count || 0) + 1;
    const { error } = await supabase.from('attendance').upsert(
      [{ worker_id: workerId, date, status, mod_count: newModCount }],
      { onConflict: 'worker_id,date' }
    );
    if (error) throw error;
  } else {
    const { error } = await supabase.from('attendance').upsert(
      [{ worker_id: workerId, date, status }],
      { onConflict: 'worker_id,date' }
    );
    if (error) throw error;
  }
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

export async function addRepaymentDB(repayment) {
  const { data, error } = await supabase
    .from('advances')
    .insert([{
      worker_id: repayment.workerId,
      amount: -Math.abs(repayment.amount), // negative = repayment
      date: repayment.date,
      reason: sanitizeInput(repayment.reason || 'Repayment'),
      added_by: 'repayment',
    }])
    .select()
    .single();
  if (error) throw error;
  return mapAdvance(data);
}

export function canMarkAttendance(workerId, attendance) {
  if (!isAttendanceWindowOpen()) {
    return { allowed: false, reason: getAttendanceWindowStatus().reason, remaining: 0 };
  }
  const today = new Date().toISOString().split('T')[0];
  const record = attendance.find(a => a.workerId === workerId && a.date === today);
  const count = record?.modCount || 0;
  
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

// Window logic (stays pure time logic) ────────────────────────
const OPEN_HOUR = 8, OPEN_MINUTE = 30, CLOSE_HOUR = 11, CLOSE_MINUTE = 0;
const MAX_MODS = 2;

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

import { sanitizeInput, generateSignature } from './security';

const WORKERS_KEY = 'asar_workers';
const ATTENDANCE_KEY = 'asar_attendance';
const ADVANCES_KEY = 'asar_advances';
const MODIFICATIONS_KEY = 'asar_modifications';
const SIGNATURE_KEY = 'asar_signature';

// Migrate old data from ni_ keys to asar_ keys
function migrateOldData() {
  const oldWorkers = localStorage.getItem('ni_workers');
  const oldAttendance = localStorage.getItem('ni_attendance');
  const oldAdvances = localStorage.getItem('ni_advances');

  if (oldWorkers && !localStorage.getItem(WORKERS_KEY)) {
    localStorage.setItem(WORKERS_KEY, oldWorkers);
  }
  if (oldAttendance && !localStorage.getItem(ATTENDANCE_KEY)) {
    localStorage.setItem(ATTENDANCE_KEY, oldAttendance);
  }
  if (oldAdvances && !localStorage.getItem(ADVANCES_KEY)) {
    localStorage.setItem(ADVANCES_KEY, oldAdvances);
  }
}

// Run migration on load
migrateOldData();

function get(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function updateDataIntegrity() {
  const dataString = (localStorage.getItem(WORKERS_KEY) || '') + 
                     (localStorage.getItem(ATTENDANCE_KEY) || '') + 
                     (localStorage.getItem(ADVANCES_KEY) || '');
  localStorage.setItem(SIGNATURE_KEY, generateSignature(dataString));
}

function set(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  updateDataIntegrity();
}

function getObj(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Workers
export function getWorkers() {
  return get(WORKERS_KEY);
}

export function saveWorkers(workers) {
  set(WORKERS_KEY, workers);
}

export function addWorker(worker) {
  const workers = getWorkers();
  
  // Sanitize
  worker.name = sanitizeInput(worker.name);
  worker.phone = sanitizeInput(worker.phone);
  
  workers.push(worker);
  saveWorkers(workers);
  return workers;
}

export function updateWorker(id, updates) {
  const workers = getWorkers();
  const idx = workers.findIndex(w => w.id === id);
  if (idx !== -1) {
    if (updates.name) updates.name = sanitizeInput(updates.name);
    if (updates.phone) updates.phone = sanitizeInput(updates.phone);
    workers[idx] = { ...workers[idx], ...updates };
    saveWorkers(workers);
  }
  return workers;
}

export function deleteWorker(id) {
  const workers = getWorkers().filter(w => w.id !== id);
  saveWorkers(workers);
  return workers;
}

// Attendance Time & Modification Logic
const OPEN_HOUR = 8;
const OPEN_MINUTE = 30;
const CLOSE_HOUR = 11;
const CLOSE_MINUTE = 0;
const MAX_MODIFICATIONS = 2;

export function isAttendanceWindowOpen() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const openTime = OPEN_HOUR * 60 + OPEN_MINUTE;
  const closeTime = CLOSE_HOUR * 60 + CLOSE_MINUTE;
  return minutes >= openTime && minutes <= closeTime;
}

export function getAttendanceWindowStatus() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const openTime = OPEN_HOUR * 60 + OPEN_MINUTE;
  const closeTime = CLOSE_HOUR * 60 + CLOSE_MINUTE;

  if (minutes < openTime) {
    const minsLeft = openTime - minutes;
    return { open: false, reason: `Opens in ${minsLeft} minutes (8:30 AM)` };
  }
  if (minutes > closeTime) {
    return { open: false, reason: 'Attendance closed for today (11:00 AM)' };
  }
  const minsLeft = closeTime - minutes;
  return { open: true, reason: `Closes in ${minsLeft} minutes` };
}

export function getModificationCount(workerId, date) {
  const mods = getObj(MODIFICATIONS_KEY);
  return mods[`${workerId}_${date}`] || 0;
}

export function incrementModification(workerId, date) {
  const mods = getObj(MODIFICATIONS_KEY);
  const key = `${workerId}_${date}`;
  mods[key] = (mods[key] || 0) + 1;
  localStorage.setItem(MODIFICATIONS_KEY, JSON.stringify(mods));
}

export function canMarkAttendance(workerId) {
  const today = new Date().toISOString().split('T')[0];

  if (!isAttendanceWindowOpen()) {
    const status = getAttendanceWindowStatus();
    return { allowed: false, reason: status.reason, remaining: 0 };
  }

  const count = getModificationCount(workerId, today);
  if (count >= MAX_MODIFICATIONS) {
    return { allowed: false, reason: `Used all ${MAX_MODIFICATIONS} modifications today. Contact admin.`, remaining: 0 };
  }

  return { allowed: true, reason: null, remaining: MAX_MODIFICATIONS - count };
}

// Attendance
export function getAttendance() {
  return get(ATTENDANCE_KEY);
}

export function saveAttendance(attendance) {
  set(ATTENDANCE_KEY, attendance);
}

export function markAttendance(workerId, date, status, isAdmin = false) {
  if (!isAdmin) {
    const canMark = canMarkAttendance(workerId);
    if (!canMark.allowed && status !== null) {
      return { success: false, reason: canMark.reason, attendance: getAttendance() };
    }
    incrementModification(workerId, date);
  }

  const attendance = getAttendance();
  const key = `${workerId}_${date}`;
  const idx = attendance.findIndex(a => `${a.workerId}_${a.date}` === key);
  if (idx !== -1) {
    attendance[idx].status = status;
  } else {
    attendance.push({ workerId, date, status });
  }
  saveAttendance(attendance);
  return { success: true, reason: null, attendance };
}

export function getAttendanceByDate(date) {
  return getAttendance().filter(a => a.date === date);
}

export function getAttendanceByWorker(workerId) {
  return getAttendance().filter(a => a.workerId === workerId);
}

export function getAttendanceByMonth(year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return getAttendance().filter(a => a.date.startsWith(prefix));
}

// Advances
export function getAdvances() {
  return get(ADVANCES_KEY);
}

export function saveAdvances(advances) {
  set(ADVANCES_KEY, advances);
}

export function addAdvance(advance) {
  const advances = getAdvances();
  if (advance.reason) advance.reason = sanitizeInput(advance.reason);
  advances.push(advance);
  saveAdvances(advances);
  return advances;
}

export function deleteAdvance(id) {
  const advances = getAdvances().filter(a => a.id !== id);
  saveAdvances(advances);
  return advances;
}

export function getAdvancesByWorker(workerId) {
  return getAdvances().filter(a => a.workerId === workerId);
}

export function getAdvancesByMonth(year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return getAdvances().filter(a => a.date.startsWith(prefix));
}

// Stats helpers
export function getMonthlyStats(workerId, year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const attendance = getAttendance().filter(
    a => a.workerId === workerId && a.date.startsWith(prefix)
  );
  const advances = getAdvances().filter(
    a => a.workerId === workerId && a.date.startsWith(prefix)
  );

  let present = 0, halfDay = 0, absent = 0;
  attendance.forEach(a => {
    if (a.status === 'present') present++;
    else if (a.status === 'half') halfDay++;
    else if (a.status === 'absent') absent++;
  });

  const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

  return { present, halfDay, absent, totalAdvance, attendanceDays: present + halfDay * 0.5 };
}

export function getWorkerBalance(workerId, year, month) {
  const workers = getWorkers();
  const worker = workers.find(w => w.id === workerId);
  if (!worker) return { earned: 0, advance: 0, balance: 0 };

  const stats = getMonthlyStats(workerId, year, month);
  const earned = stats.attendanceDays * worker.dailyWage;
  const balance = earned - stats.totalAdvance;

  return { earned, advance: stats.totalAdvance, balance };
}

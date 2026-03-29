import { hashPassword, generateFingerprint } from './security';

const ADMIN_PW_KEY = 'asar_admin_password_hash';
const SESSION_KEY = 'asar_session';
const DEFAULT_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // admin123
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

export function getAdminPasswordHash() {
  return localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PASSWORD_HASH;
}

export async function setAdminPassword(newPw) {
  const hash = await hashPassword(newPw);
  localStorage.setItem(ADMIN_PW_KEY, hash);
}

export async function verifyAdminPassword(pw) {
    const inputHash = await hashPassword(pw);
    const storedHash = getAdminPasswordHash();
    
    // Check if there's an old plaintext password, if so, migrate it
    const oldPlaintextPw = localStorage.getItem('asar_admin_password');
    if (oldPlaintextPw && oldPlaintextPw.length !== 64) {
        if (pw === oldPlaintextPw) {
            await setAdminPassword(pw);
            localStorage.removeItem('asar_admin_password');
            return true;
        }
    }

    return inputHash === storedHash;
}

export function verifyWorkerPin(worker, pin) {
    if (!worker.pin) return pin === '0000'; // Default PIN is 0000 if not set
    return worker.pin === pin;
}

export function setCurrentUser(role, workerId = null, name = null) {
  const session = { 
      role, 
      workerId, 
      name, 
      loginTime: Date.now(),
      fingerprint: generateFingerprint()
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getCurrentUser() {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    if (!data) return null;
    
    const session = JSON.parse(data);
    
    // Check timeout
    if (Date.now() - session.loginTime > SESSION_TIMEOUT) {
        logout();
        return null;
    }
    
    // Check fingerprint
    if (session.fingerprint !== generateFingerprint()) {
        logout();
        return null;
    }
    
    // Refresh session timeout on activity
    session.loginTime = Date.now();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    return session;
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAdmin() {
  return getCurrentUser()?.role === 'admin';
}

export function isWorker() {
  return getCurrentUser()?.role === 'worker';
}

export function getWorkerId() {
  return getCurrentUser()?.workerId || null;
}

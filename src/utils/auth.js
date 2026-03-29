const ADMIN_PW_KEY = 'asar_admin_password';
const SESSION_KEY = 'asar_session';
const DEFAULT_PASSWORD = 'admin123';

export function getAdminPassword() {
  return localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PASSWORD;
}

export function setAdminPassword(newPw) {
  localStorage.setItem(ADMIN_PW_KEY, newPw);
}

export function verifyAdminPassword(pw) {
  return pw === getAdminPassword();
}

export function setCurrentUser(role, workerId = null, name = null) {
  const session = { role, workerId, name, loginTime: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getCurrentUser() {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
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

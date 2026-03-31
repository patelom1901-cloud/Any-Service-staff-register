import { hashPassword, generateFingerprint } from './security';
import { fetchSettings, updateSetting } from './db';


const ADMIN_PW_KEY = 'admin_password_hash';
const DEFAULT_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // admin123
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

// In-memory session (resets on refresh as requested to remove all localStorage)
let _currentSession = null;

export async function getAdminPasswordHash() {
  const settings = await fetchSettings();
  return settings[ADMIN_PW_KEY] || DEFAULT_PASSWORD_HASH;
}

export async function setAdminPassword(newPw) {
  const hash = await hashPassword(newPw);
  await updateSetting(ADMIN_PW_KEY, hash);
}

export async function verifyAdminPassword(pw) {
    const inputHash = await hashPassword(pw);
    const storedHash = await getAdminPasswordHash();
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
  _currentSession = session;
  return session;
}

export function getCurrentUser() {
  if (!_currentSession) return null;
  
  // Check timeout
  if (Date.now() - _currentSession.loginTime > SESSION_TIMEOUT) {
    logout();
    return null;
  }
  
  // Check fingerprint
  if (_currentSession.fingerprint !== generateFingerprint()) {
    logout();
    return null;
  }
  
  // Refresh session timeout on activity
  _currentSession.loginTime = Date.now();
  
  return _currentSession;
}

export function logout() {
  _currentSession = null;
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

// ─── Biometric / WebAuthn ─────────────────────────────────────────────────────

export async function isBiometricAvailable() {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function getBiometricCredential(workerId) {
  try {
    const stored = localStorage.getItem(`bio_cred_${workerId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function enrollBiometric(workerId, workerName) {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBytes = new TextEncoder().encode(String(workerId));

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Any Service ASAR',
          id: window.location.hostname,
        },
        user: {
          id: userIdBytes,
          name: workerName,
          displayName: workerName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    });

    if (!credential) return false;

    const rawIdArray = new Uint8Array(credential.rawId);
    const credId = btoa(String.fromCharCode(...rawIdArray));
    localStorage.setItem(
      `bio_cred_${workerId}`,
      JSON.stringify({ credId, workerId, workerName })
    );
    return true;
  } catch (err) {
    console.error('Biometric enrollment error:', err);
    return false;
  }
}

export async function authenticateWithBiometric(workerId) {
  try {
    const stored = getBiometricCredential(workerId);
    if (!stored) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credIdBytes = Uint8Array.from(atob(stored.credId), (c) => c.charCodeAt(0));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          id: credIdBytes,
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch (err) {
    console.error('Biometric auth error:', err);
    return false;
  }
}

export function removeBiometricCredential(workerId) {
  try {
    localStorage.removeItem(`bio_cred_${workerId}`);
  } catch {}
}

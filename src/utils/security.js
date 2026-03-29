// Utility for SHA-256 Hashing
export async function hashPassword(plainText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Simple HTML tag stripper to prevent basic XSS
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

// HMAC-like simple integrity signature
export function generateSignature(dataString) {
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Rate Limiter
const LIMITER_KEY = 'asar_limiter';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

export function checkRateLimit(action) {
  try {
    const data = JSON.parse(localStorage.getItem(LIMITER_KEY) || '{}');
    const now = Date.now();
    const state = data[action] || { attempts: 0, lockoutUntil: 0 };

    if (now < state.lockoutUntil) {
      const remainingSecs = Math.ceil((state.lockoutUntil - now) / 1000);
      return { allowed: false, remainingSecs, attemptsLeft: 0 };
    }

    // Reset attempts if lockout expired
    if (state.lockoutUntil > 0 && now > state.lockoutUntil) {
      state.attempts = 0;
      state.lockoutUntil = 0;
      data[action] = state;
      localStorage.setItem(LIMITER_KEY, JSON.stringify(data));
    }

    return { 
      allowed: true, 
      remainingSecs: 0, 
      attemptsLeft: MAX_ATTEMPTS - state.attempts 
    };
  } catch {
    return { allowed: true, remainingSecs: 0, attemptsLeft: MAX_ATTEMPTS };
  }
}

export function recordFailedAttempt(action) {
  try {
    const data = JSON.parse(localStorage.getItem(LIMITER_KEY) || '{}');
    const state = data[action] || { attempts: 0, lockoutUntil: 0 };
    
    state.attempts += 1;
    if (state.attempts >= MAX_ATTEMPTS) {
      state.lockoutUntil = Date.now() + LOCKOUT_MS;
    }
    
    data[action] = state;
    localStorage.setItem(LIMITER_KEY, JSON.stringify(data));
  } catch {}
}

export function resetRateLimit(action) {
    try {
      const data = JSON.parse(localStorage.getItem(LIMITER_KEY) || '{}');
      if (data[action]) {
          delete data[action];
          localStorage.setItem(LIMITER_KEY, JSON.stringify(data));
      }
    } catch {}
}

// Session Fingerprint
export function generateFingerprint() {
  return `${navigator.userAgent}_${window.screen.width}x${window.screen.height}`;
}

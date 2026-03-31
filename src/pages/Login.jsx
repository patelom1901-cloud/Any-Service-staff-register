import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  verifyAdminPassword, setCurrentUser, verifyWorkerPin,
  isBiometricAvailable, getBiometricCredential,
  enrollBiometric, authenticateWithBiometric, isBiometricRegisteredGlobally
} from '../utils/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../utils/security';
import { useWorkers } from '../hooks/useData';
import { useTranslation } from '../utils/i18n';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [pin, setPin] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Biometric states
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioStep, setBioStep] = useState(null); // 'ask' = prompt to enroll after PIN login

  const { workers, loading: workersLoading } = useWorkers();

  // Check if device supports biometrics on mount
  useEffect(() => {
    isBiometricAvailable().then(ok => setBioAvailable(ok));
  }, []);

  useEffect(() => {
    let timer;
    if (lockoutTimer > 0) {
      timer = setInterval(() => setLockoutTimer(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const limit = checkRateLimit('admin_login');
    if (!limit.allowed) {
      setLockoutTimer(limit.remainingSecs);
      setError(`${t('tooManyAttempts')} ${Math.ceil(limit.remainingSecs / 60)} ${t('minutes')}.`);
      return;
    }
    const isValid = await verifyAdminPassword(password);
    if (isValid) {
      resetRateLimit('admin_login');
      setCurrentUser('admin');
      navigate('/admin');
    } else {
      recordFailedAttempt('admin_login');
      const upd = checkRateLimit('admin_login');
      if (!upd.allowed) {
        setLockoutTimer(upd.remainingSecs);
        setError(`${t('lockedOut')} ${Math.ceil(upd.remainingSecs / 60)} ${t('minutes')}.`);
      } else {
        setError(`${t('incorrectPassword')} ${upd.attemptsLeft} ${t('attemptsLeft')}.`);
      }
    }
  };

  // Called after successful PIN auth — decide whether to show enroll prompt
  const afterSuccessfulLogin = async (worker) => {
    const hasCred = getBiometricCredential(worker.id);
    if (bioAvailable && !hasCred) {
      // Offer enrollment only if not already registered on another device
      const isGlobal = await isBiometricRegisteredGlobally(worker.id);
      if (!isGlobal) {
        setBioStep('ask');
        return;
      }
    }
    navigate('/worker');
  };

  const handleWorkerLogin = (e) => {
    e.preventDefault();
    const limit = checkRateLimit(`worker_login_${selectedWorker.id}`);
    if (!limit.allowed) {
      setLockoutTimer(limit.remainingSecs);
      setError(`${t('tooManyAttempts')} ${Math.ceil(limit.remainingSecs / 60)} ${t('minutes')}.`);
      return;
    }
    const isValid = verifyWorkerPin(selectedWorker, pin);
    if (isValid) {
      resetRateLimit(`worker_login_${selectedWorker.id}`);
      setCurrentUser('worker', selectedWorker.id, selectedWorker.name);
      afterSuccessfulLogin(selectedWorker);
    } else {
      recordFailedAttempt(`worker_login_${selectedWorker.id}`);
      const upd = checkRateLimit(`worker_login_${selectedWorker.id}`);
      if (!upd.allowed) {
        setLockoutTimer(upd.remainingSecs);
        setError(`${t('lockedOut')} ${Math.ceil(upd.remainingSecs / 60)} ${t('minutes')}.`);
      } else {
        setError(`${t('incorrectPin')} ${upd.attemptsLeft} ${t('attemptsLeft')}.`);
      }
    }
  };

  // Fingerprint login — triggered by the fingerprint button
  const handleFingerprintLogin = async () => {
    if (!selectedWorker) return;
    setBioLoading(true);
    setError('');
    try {
      const success = await authenticateWithBiometric(selectedWorker.id);
      if (success) {
        setCurrentUser('worker', selectedWorker.id, selectedWorker.name);
        navigate('/worker');
      } else {
        setError(t('fingerprintFailed'));
      }
    } catch {
      setError(t('fingerprintFailed'));
    }
    setBioLoading(false);
  };

  // Enroll fingerprint after successful PIN login
  const handleEnrollYes = async () => {
    setBioLoading(true);
    try {
      await enrollBiometric(selectedWorker.id, selectedWorker.name);
    } catch {
      // enroll failed silently, still navigate
    }
    setBioLoading(false);
    navigate('/worker');
  };

  const handleWorkerSelect = async (worker) => {
    setSelectedWorker(worker);
    setPin('');
    setError('');
    setBioStep(null);
    
    const limit = checkRateLimit(`worker_login_${worker.id}`);
    if (!limit.allowed) {
      setLockoutTimer(limit.remainingSecs);
      return;
    }
    setLockoutTimer(0);

    const hasBio = getBiometricCredential(worker.id);
    if (bioAvailable && !!hasBio) {
      setBioLoading(true);
      const success = await authenticateWithBiometric(worker.id);
      if (success) {
        setCurrentUser('worker', worker.id, worker.name);
        navigate('/worker');
      } else {
        setError(t('fingerprintFailed'));
      }
      setBioLoading(false);
    }
  };

  // Helpers
  const workerHasBio = selectedWorker && bioAvailable && !!getBiometricCredential(selectedWorker.id);

  return (
    <div className="login-page">
      <div className="login-header">
        <img src="/favicon.png" alt="Logo" className="login-logo" />
        <h1>Any Service</h1>
        <p>Attendance Register</p>
      </div>

      {/* ── Mode selection ─────────────────────────────────────────── */}
      {!mode && (
        <div className="login-options">
          <button className="login-btn admin" onClick={() => { setMode('admin'); setPassword(''); setError(''); setLockoutTimer(0); }}>
            <span className="login-btn-icon">&#128274;</span>
            <div>
              <strong>{t('adminLogin')}</strong>
              <span>{t('manageWorkers')}</span>
            </div>
            <span className="login-arrow">&#8250;</span>
          </button>
          <button className="login-btn worker" onClick={() => { setMode('worker'); setSelectedWorker(null); setError(''); setLockoutTimer(0); }}>
            <span className="login-btn-icon">&#128100;</span>
            <div>
              <strong>{t('workerLogin')}</strong>
              <span>{t('markAttendance')}</span>
            </div>
            <span className="login-arrow">&#8250;</span>
          </button>
          <button className="login-btn team" onClick={() => navigate('/everyone')}>
            <span className="login-btn-icon">&#128101;</span>
            <div>
              <strong>{t('team')}</strong>
              <span>{t('teamSummary')}</span>
            </div>
            <span className="login-arrow">&#8250;</span>
          </button>
        </div>
      )}

      {/* ── Admin login form ───────────────────────────────────────── */}
      {mode === 'admin' && (
        <form className="login-form" onSubmit={handleAdminLogin}>
          <h3>{t('adminLogin')}</h3>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder={t('enterAdminPassword')}
            disabled={lockoutTimer > 0}
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          {lockoutTimer > 0 && <p className="lockout-text">{t('tryAgainIn')} {lockoutTimer}s</p>}
          <div className="login-form-actions">
            <button type="submit" className="btn btn-primary" disabled={lockoutTimer > 0}>{t('login')}</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setMode(null); setPassword(''); setError(''); }}>{t('back')}</button>
          </div>
        </form>
      )}

      {/* ── Worker name selection ──────────────────────────────────── */}
      {mode === 'worker' && !selectedWorker && (
        <div className="worker-select">
          <h3>{t('selectYourName')}</h3>
          {workersLoading ? (
            <div className="login-empty"><p>{t('loading')}</p></div>
          ) : workers.length === 0 ? (
            <div className="login-empty">
              <span>&#128679;</span>
              <p>{t('noWorkersContact')}</p>
            </div>
          ) : (
            <div className="worker-list-select">
              {workers.map(w => (
                <button key={w.id} className="worker-select-btn" onClick={() => handleWorkerSelect(w)}>
                  <span className="worker-avatar">{w.name.charAt(0).toUpperCase()}</span>
                  <span className="worker-select-name">{w.name}</span>
                  {/* Show fingerprint tag if this worker has a saved credential */}
                  {bioAvailable && getBiometricCredential(w.id) && (
                    <span className="bio-tag">&#128274;</span>
                  )}
                  <span className="worker-select-arrow">&#8250;</span>
                </button>
              ))}
            </div>
          )}
          <button className="btn btn-ghost back-btn" onClick={() => setMode(null)}>{t('back')}</button>
        </div>
      )}

      {/* ── Worker PIN form + optional fingerprint button ──────────── */}
      {mode === 'worker' && selectedWorker && !bioStep && (
        <form className="login-form" onSubmit={handleWorkerLogin}>
          <h3>{selectedWorker.name}</h3>
          <p className="pin-hint">{t('enterPin')} ({t('defaultPin')})</p>
          <input
            type="password"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength="4"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            placeholder="****"
            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '24px' }}
            disabled={lockoutTimer > 0}
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          {lockoutTimer > 0 && <p className="lockout-text">{t('tryAgainIn')} {lockoutTimer}s</p>}
          <div className="login-form-actions">
            <button type="submit" className="btn btn-primary" disabled={lockoutTimer > 0}>{t('enter')}</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setSelectedWorker(null); setPin(''); setError(''); }}>{t('back')}</button>
          </div>

          {/* Fingerprint button — only shown if this worker has enrolled on this device */}
          {workerHasBio && (
            <button
              type="button"
              className="fingerprint-btn"
              onClick={handleFingerprintLogin}
              disabled={bioLoading || lockoutTimer > 0}
            >
              {bioLoading ? (
                <span className="bio-spinner">&#9696;</span>
              ) : (
                <span className="bio-icon">&#128270;</span>
              )}
              <span>{bioLoading ? t('fingerprintChecking') : t('useFingerprint')}</span>
            </button>
          )}
        </form>
      )}

      {/* ── Post-PIN fingerprint enrollment prompt ─────────────────── */}
      {bioStep === 'ask' && selectedWorker && (
        <div className="login-form bio-enroll-card">
          <div className="bio-enroll-icon">&#128270;</div>
          <h3>{t('enableFingerprintTitle')}</h3>
          <p className="bio-enroll-desc">{t('enableFingerprintDesc')}</p>
          <div className="login-form-actions">
            <button
              className="btn btn-primary"
              onClick={handleEnrollYes}
              disabled={bioLoading}
            >
              {bioLoading ? t('fingerprintChecking') : t('enableFingerprintYes')}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/worker')}
              disabled={bioLoading}
            >
              {t('enableFingerprintSkip')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

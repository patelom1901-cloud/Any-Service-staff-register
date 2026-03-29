import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAdminPassword, setCurrentUser, verifyWorkerPin } from '../utils/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../utils/security';
import { migrateLocalStorageToSupabase } from '../utils/db';
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

  const { workers, loading: workersLoading } = useWorkers();

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
      // Migrate any existing localStorage data to Supabase (runs once)
      migrateLocalStorageToSupabase();
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
      navigate('/worker');
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

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    setPin('');
    setError('');
    const limit = checkRateLimit(`worker_login_${worker.id}`);
    setLockoutTimer(!limit.allowed ? limit.remainingSecs : 0);
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <img src="/favicon.png" alt="Logo" className="login-logo" />
        <h1>Any Service</h1>
        <p>Attendance Register</p>
      </div>

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
        </div>
      )}

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
                  <span className="worker-select-arrow">&#8250;</span>
                </button>
              ))}
            </div>
          )}
          <button className="btn btn-ghost back-btn" onClick={() => setMode(null)}>{t('back')}</button>
        </div>
      )}

      {mode === 'worker' && selectedWorker && (
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
        </form>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAdminPassword, setCurrentUser, verifyWorkerPin } from '../utils/auth';
import { getWorkers } from '../utils/storage';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../utils/security';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [pin, setPin] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const workers = getWorkers();

  // Admin Rate Limit timer
  useEffect(() => {
    let timer;
    if (lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    // Check Rate limit first
    const limit = checkRateLimit('admin_login');
    if (!limit.allowed) {
      setLockoutTimer(limit.remainingSecs);
      setError(`Too many attempts. Blocked for ${Math.ceil(limit.remainingSecs / 60)} minutes.`);
      return;
    }

    const isValid = await verifyAdminPassword(password);
    
    if (isValid) {
      resetRateLimit('admin_login');
      setCurrentUser('admin');
      navigate('/admin');
    } else {
      recordFailedAttempt('admin_login');
      const updatedLimit = checkRateLimit('admin_login');
      if (!updatedLimit.allowed) {
        setLockoutTimer(updatedLimit.remainingSecs);
        setError(`Locked out for ${Math.ceil(updatedLimit.remainingSecs / 60)} minutes.`);
      } else {
        setError(`Incorrect password. ${updatedLimit.attemptsLeft} attempts left.`);
      }
    }
  };

  const handleWorkerLogin = (e) => {
    e.preventDefault();
    
    const limit = checkRateLimit(`worker_login_${selectedWorker.id}`);
    if (!limit.allowed) {
      setLockoutTimer(limit.remainingSecs);
      setError(`Too many attempts. Blocked for ${Math.ceil(limit.remainingSecs / 60)} minutes.`);
      return;
    }

    const isValid = verifyWorkerPin(selectedWorker, pin);
    if (isValid) {
      resetRateLimit(`worker_login_${selectedWorker.id}`);
      setCurrentUser('worker', selectedWorker.id, selectedWorker.name);
      navigate('/worker');
    } else {
      recordFailedAttempt(`worker_login_${selectedWorker.id}`);
      const updatedLimit = checkRateLimit(`worker_login_${selectedWorker.id}`);
      if (!updatedLimit.allowed) {
        setLockoutTimer(updatedLimit.remainingSecs);
        setError(`Locked out for ${Math.ceil(updatedLimit.remainingSecs / 60)} minutes.`);
      } else {
        setError(`Incorrect PIN. ${updatedLimit.attemptsLeft} attempts left.`);
      }
    }
  };

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    setPin('');
    setError('');
    const limit = checkRateLimit(`worker_login_${worker.id}`);
    if (!limit.allowed) {
        setLockoutTimer(limit.remainingSecs);
    } else {
        setLockoutTimer(0);
    }
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
              <strong>Admin Login</strong>
              <span>Manage workers & reports</span>
            </div>
            <span className="login-arrow">&#8250;</span>
          </button>
          <button className="login-btn worker" onClick={() => { setMode('worker'); setSelectedWorker(null); setError(''); setLockoutTimer(0); }}>
            <span className="login-btn-icon">&#128100;</span>
            <div>
              <strong>Worker Login</strong>
              <span>Mark attendance & view stats</span>
            </div>
            <span className="login-arrow">&#8250;</span>
          </button>
        </div>
      )}

      {mode === 'admin' && (
        <form className="login-form" onSubmit={handleAdminLogin}>
          <h3>Admin Login</h3>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter admin password"
            disabled={lockoutTimer > 0}
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          {lockoutTimer > 0 && <p className="lockout-text">Try again in {lockoutTimer}s</p>}
          
          <div className="login-form-actions">
            <button type="submit" className="btn btn-primary" disabled={lockoutTimer > 0}>Login</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setMode(null); setPassword(''); setError(''); }}>
              Back
            </button>
          </div>
        </form>
      )}

      {mode === 'worker' && !selectedWorker && (
        <div className="worker-select">
          <h3>Select Your Name</h3>
          {workers.length === 0 ? (
            <div className="login-empty">
              <span>&#128679;</span>
              <p>No workers added yet.<br/>Contact admin to add workers.</p>
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
          <button className="btn btn-ghost back-btn" onClick={() => setMode(null)}>
            Back
          </button>
        </div>
      )}

      {mode === 'worker' && selectedWorker && (
        <form className="login-form" onSubmit={handleWorkerLogin}>
          <h3>Welcome, {selectedWorker.name}</h3>
          <p className="pin-hint">Enter your 4-digit PIN (default: 0000)</p>
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
          {lockoutTimer > 0 && <p className="lockout-text">Try again in {lockoutTimer}s</p>}

          <div className="login-form-actions">
             <button type="submit" className="btn btn-primary" disabled={lockoutTimer > 0}>Enter</button>
             <button type="button" className="btn btn-ghost" onClick={() => { setSelectedWorker(null); setPin(''); setError(''); }}>
                Back
             </button>
          </div>
        </form>
      )}
    </div>
  );
}

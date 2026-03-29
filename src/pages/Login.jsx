import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAdminPassword, setCurrentUser } from '../utils/auth';
import { getWorkers } from '../utils/storage';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const workers = getWorkers();

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      setCurrentUser('admin');
      navigate('/admin');
    } else {
      setError('Incorrect password');
    }
  };

  const handleWorkerSelect = (worker) => {
    setCurrentUser('worker', worker.id, worker.name);
    navigate('/worker');
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
          <button className="login-btn admin" onClick={() => setMode('admin')}>
            <span className="login-btn-icon">&#128274;</span>
            <div>
              <strong>Admin Login</strong>
              <span>Manage workers & reports</span>
            </div>
            <span className="login-arrow">&#8250;</span>
          </button>
          <button className="login-btn worker" onClick={() => setMode('worker')}>
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
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          <div className="login-form-actions">
            <button type="submit" className="btn btn-primary">Login</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setMode(null); setPassword(''); setError(''); }}>
              Back
            </button>
          </div>
        </form>
      )}

      {mode === 'worker' && (
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
    </div>
  );
}

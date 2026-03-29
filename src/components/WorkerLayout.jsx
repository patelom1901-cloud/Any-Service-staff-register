import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../utils/auth';
import './WorkerLayout.css';

export default function WorkerLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header worker-header">
        <div className="header-left">
          <div className="worker-header-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'W'}
          </div>
          <div>
            <h1>{user?.name || 'Worker'}</h1>
            <span className="header-sub">Any Service</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          &#9211;
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="app-bottom-nav">
        <NavLink to="/worker" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128200;</span>
          <span className="nav-label">My Stats</span>
        </NavLink>
        <NavLink to="/worker/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#9745;</span>
          <span className="nav-label">Attendance</span>
        </NavLink>
        <NavLink to="/worker/advances" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#8377;</span>
          <span className="nav-label">Advances</span>
        </NavLink>
      </nav>
    </div>
  );
}

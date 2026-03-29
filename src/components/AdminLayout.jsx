import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header admin-header">
        <div className="header-left">
          <img src="/favicon.png" alt="" className="header-logo" />
          <div>
            <h1>Admin Panel</h1>
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
        <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128202;</span>
          <span className="nav-label">Dashboard</span>
        </NavLink>
        <NavLink to="/admin/workers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128101;</span>
          <span className="nav-label">Workers</span>
        </NavLink>
        <NavLink to="/admin/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#9745;</span>
          <span className="nav-label">Attendance</span>
        </NavLink>
        <NavLink to="/admin/advances" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#8377;</span>
          <span className="nav-label">Advances</span>
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128196;</span>
          <span className="nav-label">Reports</span>
        </NavLink>
      </nav>
    </div>
  );
}

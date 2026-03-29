import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import { useTranslation } from '../utils/i18n';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { t, cycleLang, LANG_LABELS, lang } = useTranslation();

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
            <h1>{t('adminPanel')}</h1>
            <span className="header-sub">{t('anyService')}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="lang-btn" onClick={cycleLang} title="Change Language">
            {LANG_LABELS[lang]}
          </button>
          <button className="logout-btn" onClick={handleLogout} title={t('logout')}>
            &#9211;
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="app-bottom-nav">
        <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128202;</span>
          <span className="nav-label">{t('dashboard')}</span>
        </NavLink>
        <NavLink to="/admin/workers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128101;</span>
          <span className="nav-label">{t('workers')}</span>
        </NavLink>
        <NavLink to="/admin/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#9745;</span>
          <span className="nav-label">{t('attendance')}</span>
        </NavLink>
        <NavLink to="/admin/advances" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#8377;</span>
          <span className="nav-label">{t('advances')}</span>
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128196;</span>
          <span className="nav-label">{t('reports')}</span>
        </NavLink>
      </nav>
    </div>
  );
}

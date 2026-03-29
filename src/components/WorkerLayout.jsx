import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../utils/auth';
import { useTranslation } from '../utils/i18n';
import './WorkerLayout.css';

export default function WorkerLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { t, cycleLang, LANG_LABELS, lang } = useTranslation();

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
        <NavLink to="/worker" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#128200;</span>
          <span className="nav-label">{t('myStats')}</span>
        </NavLink>
        <NavLink to="/worker/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#9745;</span>
          <span className="nav-label">{t('attendance')}</span>
        </NavLink>
        <NavLink to="/worker/advances" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">&#8377;</span>
          <span className="nav-label">{t('advances')}</span>
        </NavLink>
      </nav>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { useTranslation } from '../utils/i18n';
import './Splash.css';

export default function Splash() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 1000);
    const t3 = setTimeout(() => {
      const user = getCurrentUser();
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'worker') navigate('/worker');
      else navigate('/login');
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate]);

  return (
    <div className="splash">
      <div className={`splash-logo-wrap ${phase >= 1 ? 'visible' : ''}`}>
        <img src="/favicon.png" alt="Logo" className="splash-logo" />
      </div>
      <div className={`splash-text ${phase >= 2 ? 'visible' : ''}`}>
        <h1>Any Service</h1>
        <p>{t('attendanceRegister')}</p>
      </div>
      <div className="splash-loader">
        <div className="splash-loader-bar"></div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useWorkers, useAttendance, useAdvances, useStats } from '../hooks/useData';
import { useTranslation } from '../utils/i18n';
import CalendarModal from '../components/CalendarModal';
import './EveryoneView.css';

export default function EveryoneView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { workers, loading: lw } = useWorkers();
  const { attendance, loading: la } = useAttendance();
  const { advances, loading: lad } = useAdvances();
  const { getBalance } = useStats(workers, attendance, advances);

  const [date] = useState(new Date());
  const [selectedWorker, setSelectedWorker] = useState(null);
  
  const month = date.getMonth();
  const year = date.getFullYear();

  const summaryData = useMemo(() => {
    if (lw || la || lad) return [];
    return workers.map(worker => {
      const balance = getBalance(worker.id, year, month);
      const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      const att = attendance.filter(a => a.workerId === worker.id && a.date.startsWith(monthPrefix));
      
      let p = 0, h = 0, a = 0;
      att.forEach(rec => {
        if (rec.status === 'present') p++;
        else if (rec.status === 'half') h++;
        else if (rec.status === 'absent') a++;
      });

      return {
        id: worker.id,
        name: worker.name,
        present: p,
        half: h,
        absent: a,
        advances: balance.advance,
        balance: balance.balance,
        earned: balance.earned
      };
    });
  }, [workers, attendance, advances, getBalance, month, year, lw, la, lad]);

  if (lw || la || lad) return <div className="loading-state">{t('loading')}</div>;

  return (
    <div className="everyone-view">
      <div className="view-header">
        <button className="back-btn-round" onClick={() => navigate(-1)}>&#8249;</button>
        <div className="header-info">
          <h2>{t('teamSummary')}</h2>
          <div className="header-meta">
            <span className="month-label-small">{format(date, 'MMMM yyyy')}</span>
            <span className="worker-count-tag">{workers.length} {t('workers')}</span>
          </div>
        </div>
      </div>

      <div className="summary-list">
        {summaryData.map(d => (
          <div key={d.id} className="summary-card">
            <button 
              className="card-calendar-btn"
              onClick={() => setSelectedWorker(d)}
              title={t('viewCalendar')}
            >
              📅
            </button>
            <div className="card-top">
              <span className="worker-avatar">{d.name.charAt(0).toUpperCase()}</span>
              <span className="worker-name-text">{d.name}</span>
            </div>
            <div className="card-grid">
              <div className="grid-item">
                <span className="grid-label">{t('attendance')}</span>
                <div className="att-stats-mini">
                  <span className="mini-stat p">P: {d.present}</span>
                  <span className="mini-stat h">H: {d.half}</span>
                  <span className="mini-stat a">A: {d.absent}</span>
                </div>
              </div>
              <div className="grid-item">
                <span className="grid-label">{t('advances')}</span>
                <span className="grid-val advance">₹{d.advances}</span>
              </div>
              <div className="grid-item">
                <span className="grid-label">{t('earned')}</span>
                <span className="grid-val earned">₹{d.earned}</span>
              </div>
              <div className="grid-item highlighted">
                <span className="grid-label">{t('balance')}</span>
                <span className={`grid-val ${d.balance < 0 ? 'neg' : 'pos'}`}>₹{d.balance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedWorker && (
        <CalendarModal 
          workerId={selectedWorker.id}
          workerName={selectedWorker.name}
          attendance={attendance}
          onClose={() => setSelectedWorker(null)}
        />
      )}
    </div>
  );
}

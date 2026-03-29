import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { getCurrentUser } from '../utils/auth';
import { useAttendance } from '../hooks/useData';
import { getAttendanceWindowStatus } from '../utils/db';
import { useTranslation } from '../utils/i18n';
import './WorkerAttendance.css';

export default function WorkerAttendance() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const workerId = user?.workerId;

  const { attendance, markAttendance } = useAttendance(workerId);

  const today = format(new Date(), 'yyyy-MM-dd');
  const windowStatus = getAttendanceWindowStatus();
  
  const todayRecord = useMemo(() => 
    attendance.find(a => a.workerId === workerId && a.date === today),
    [attendance, workerId, today]
  );
  
  const modRemaining = Math.max(0, 2 - (todayRecord?.modCount || 0));

  const todayStatus = todayRecord?.status || null;

  const handleMark = async (status) => {
    if (!windowStatus.open) return;
    if (modRemaining <= 0 && todayStatus !== status) return;
    const result = await markAttendance(workerId, today, status, false);
    if (result && !result.success) {
      alert(result.reason);
    }
  };

  const handleClear = async () => {
    if (!windowStatus.open || modRemaining <= 0) return;
    const result = await markAttendance(workerId, today, null, false);
    if (result && !result.success) {
      alert(result.reason);
    }
  };

  const recentAttendance = useMemo(() =>
    [...attendance]
      .filter(a => a.workerId === workerId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10),
    [attendance, workerId]
  );

  return (
    <div className="worker-attendance">
      <h2>{t('markTodayAttendance')}</h2>
      <p className="date-label">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>

      <div className={`window-status ${windowStatus.open ? 'open' : 'closed'}`}>
        <span className="window-dot"></span>
        <span>{windowStatus.reason}</span>
      </div>

      <div className="mod-counter">
        <span>{t('modificationsRemaining')} </span>
        <strong className={modRemaining > 0 ? 'has-remaining' : 'no-remaining'}>
          {modRemaining} / 2
        </strong>
      </div>

      <div className="mark-buttons">
        <button
          className={`mark-btn present ${todayStatus === 'present' ? 'active' : ''}`}
          onClick={() => handleMark('present')}
          disabled={!windowStatus.open || (modRemaining <= 0 && todayStatus !== 'present')}
        >
          <span className="mark-icon">&#9989;</span>
          <span>{t('present')}</span>
        </button>
        <button
          className={`mark-btn half ${todayStatus === 'half' ? 'active' : ''}`}
          onClick={() => handleMark('half')}
          disabled={!windowStatus.open || (modRemaining <= 0 && todayStatus !== 'half')}
        >
          <span className="mark-icon">&#9728;</span>
          <span>{t('halfDay')}</span>
        </button>
        <button
          className={`mark-btn absent ${todayStatus === 'absent' ? 'active' : ''}`}
          onClick={() => handleMark('absent')}
          disabled={!windowStatus.open || (modRemaining <= 0 && todayStatus !== 'absent')}
        >
          <span className="mark-icon">&#10060;</span>
          <span>{t('absent')}</span>
        </button>
      </div>

      {todayStatus && modRemaining > 0 && (
        <button className="clear-btn" onClick={handleClear}>{t('clearAttendance')}</button>
      )}

      {!windowStatus.open && modRemaining <= 0 && (
        <div className="admin-note">{t('contactAdmin')}</div>
      )}

      <h3>{t('recentAttendance')}</h3>
      <div className="recent-list">
        {recentAttendance.length === 0 ? (
          <div className="empty-state"><p>{t('noAttendanceYet')}</p></div>
        ) : (
          recentAttendance.map(a => (
            <div key={`${a.workerId}_${a.date}`} className={`recent-item ${a.status}`}>
              <span className="recent-date">{format(new Date(a.date + 'T00:00:00'), 'dd MMM yyyy')}</span>
              <span className={`recent-status ${a.status}`}>
                {a.status === 'present' ? t('present') : a.status === 'half' ? t('halfDay') : t('absent')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

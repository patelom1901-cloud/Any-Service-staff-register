import { useMemo } from 'react';
import { format } from 'date-fns';
import { useWorkers, useAttendance, useAdvances, useStats } from '../hooks/useData';
import { getAttendanceWindowStatus } from '../utils/db';
import { useTranslation } from '../utils/i18n';
import './Dashboard.css';

export default function Dashboard() {
  const { t } = useTranslation();
  const { workers } = useWorkers();
  const { attendance } = useAttendance();
  const { advances } = useAdvances();
  const { getBalance } = useStats(workers, attendance, advances);
  const windowStatus = getAttendanceWindowStatus();

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const todayAttendance = useMemo(() =>
    attendance.filter(a => a.date === today),
    [attendance, today]
  );

  const presentToday = todayAttendance.filter(a => a.status === 'present').length;
  const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
  const halfDayToday = todayAttendance.filter(a => a.status === 'half').length;
  const notMarked = workers.length - todayAttendance.length;

  const monthlyTotals = useMemo(() => {
    let totalEarned = 0, totalAdvance = 0, totalPayable = 0;
    workers.forEach(w => {
      const bal = getBalance(w.id, currentYear, currentMonth);
      totalEarned += bal.earned;
      totalAdvance += bal.advance;
      totalPayable += bal.balance;
    });
    return { totalEarned, totalAdvance, totalPayable };
  }, [workers, currentYear, currentMonth, getBalance]);

  return (
    <div className="admin-dashboard">
      <div className={`window-banner ${windowStatus.open ? 'open' : 'closed'}`}>
        <span className="wb-dot"></span>
        <span>{t('attendanceWindow')}: {windowStatus.reason}</span>
      </div>

      {workers.length === 0 ? (
        <div className="empty-state">
          <span>&#128679;</span>
          <p>{t('noWorkers')}</p>
          <p>{t('goToWorkers')}</p>
        </div>
      ) : (
        <>
          <div className="dash-stats">
            <div className="ds-card present">
              <span className="ds-num">{presentToday}</span>
              <span className="ds-label">{t('present')}</span>
            </div>
            <div className="ds-card absent">
              <span className="ds-num">{absentToday}</span>
              <span className="ds-label">{t('absent')}</span>
            </div>
            <div className="ds-card half">
              <span className="ds-num">{halfDayToday}</span>
              <span className="ds-label">{t('halfDay')}</span>
            </div>
            <div className="ds-card pending">
              <span className="ds-num">{notMarked}</span>
              <span className="ds-label">{t('notMarked')}</span>
            </div>
          </div>

          <h3>{t('monthlySummary')}</h3>
          <div className="fin-cards">
            <div className="fin-card">
              <span className="fin-label">{t('totalEarned')}</span>
              <span className="fin-value earned">&#8377;{monthlyTotals.totalEarned}</span>
            </div>
            <div className="fin-card">
              <span className="fin-label">{t('totalAdvance')}</span>
              <span className="fin-value advance">&#8377;{monthlyTotals.totalAdvance}</span>
            </div>
            <div className="fin-card highlight">
              <span className="fin-label">{t('netPayable')}</span>
              <span className={`fin-value ${monthlyTotals.totalPayable >= 0 ? 'positive' : 'negative'}`}>
                &#8377;{monthlyTotals.totalPayable}
              </span>
            </div>
          </div>

          <h3>{t('workerBalances')}</h3>
          <div className="balance-list">
            {workers.map(w => {
              const bal = getBalance(w.id, currentYear, currentMonth);
              return (
                <div key={w.id} className="bal-row">
                  <div className="bal-worker">
                    <span className="bal-avatar">{w.name.charAt(0)}</span>
                    <span className="bal-name">{w.name}</span>
                  </div>
                  <div className="bal-amounts">
                    <span className="bal-earned">+&#8377;{bal.earned}</span>
                    <span className="bal-advance">-&#8377;{bal.advance}</span>
                    <span className={`bal-total ${bal.balance >= 0 ? 'positive' : 'negative'}`}>
                      =&#8377;{bal.balance}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

import { useMemo, useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getCurrentUser } from '../utils/auth';
import {
  isBiometricAvailable, getBiometricCredential,
  enrollBiometric, removeBiometricCredential,
} from '../utils/auth';
import { useWorkers, useAttendance, useAdvances, useStats } from '../hooks/useData';
import { useTranslation } from '../utils/i18n';
import './WorkerDashboard.css';

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const workerId = user?.workerId;

  const { workers } = useWorkers();
  const { attendance } = useAttendance(workerId);
  const { advances } = useAdvances(workerId);
  const { getStats, getBalance } = useStats(workers, attendance, advances);

  // Biometric state
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioMsg, setBioMsg] = useState('');

  useEffect(() => {
    isBiometricAvailable().then(ok => {
      setBioAvailable(ok);
      if (ok && workerId) {
        setBioEnrolled(!!getBiometricCredential(workerId));
      }
    });
  }, [workerId]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const worker = workers.find(w => w.id === workerId);

  const stats = useMemo(() =>
    getStats(workerId, currentYear, currentMonth),
    [getStats, workerId, currentYear, currentMonth]
  );

  const balance = useMemo(() =>
    getBalance(workerId, currentYear, currentMonth),
    [getBalance, workerId, currentYear, currentMonth]
  );

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getStatusColor = (dateStr) => {
    const rec = attendance.find(a => a.date === dateStr);
    return rec?.status || '';
  };

  const handleEnrollBiometric = async () => {
    setBioLoading(true);
    setBioMsg('');
    try {
      const ok = await enrollBiometric(workerId, worker.name);
      if (ok) {
        setBioEnrolled(true);
        setBioMsg(t('fingerprintEnabled'));
      } else {
        setBioMsg(t('fingerprintFailed'));
      }
    } catch {
      setBioMsg(t('fingerprintFailed'));
    }
    setBioLoading(false);
  };

  const handleRemoveBiometric = async () => {
    setBioLoading(true);
    await removeBiometricCredential(workerId);
    setBioEnrolled(false);
    setBioMsg(t('fingerprintRemoved'));
    setBioLoading(false);
  };

  if (!worker) {
    return <div className="empty-state"><p>{t('workerNotFound')}</p></div>;
  }

  return (
    <div className="worker-dashboard">
      <div className="welcome-card">
        <div className="welcome-info">
          <h2>{t('hello')}, {worker.name} &#128075;</h2>
          <p>{t('monthlySummaryTag')}</p>
        </div>
        <div className="welcome-wage">
          <span className="wage-amount">&#8377;{worker.dailyWage}</span>
          <span className="wage-label">{t('perDay')}</span>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-chip present">
          <span className="stat-num">{stats.present}</span>
          <span className="stat-txt">{t('present')}</span>
        </div>
        <div className="stat-chip half">
          <span className="stat-num">{stats.halfDay}</span>
          <span className="stat-txt">{t('halfDay')}</span>
        </div>
        <div className="stat-chip absent">
          <span className="stat-num">{stats.absent}</span>
          <span className="stat-txt">{t('absent')}</span>
        </div>
      </div>

      <div className="finance-cards">
        <div className="finance-card">
          <span className="finance-label">{t('totalEarned')}</span>
          <span className="finance-value earned">&#8377;{balance.earned}</span>
        </div>
        <div className="finance-card">
          <span className="finance-label">{t('advanceTaken')}</span>
          <span className="finance-value advance">&#8377;{balance.advance}</span>
        </div>
        <div className="finance-card highlight">
          <span className="finance-label">{t('netBalance')}</span>
          <span className={`finance-value ${balance.balance >= 0 ? 'positive' : 'negative'}`}>
            &#8377;{balance.balance}
          </span>
        </div>
      </div>

      <h3>{format(now, 'MMMM yyyy')} {t('calendarTitle')}</h3>
      <div className="mini-calendar">
        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const status = getStatusColor(dateStr);
          const isToday = dateStr === format(now, 'yyyy-MM-dd');
          return (
            <div
              key={dateStr}
              className={`mini-cal-day ${status} ${isToday ? 'today' : ''}`}
              title={`${format(day, 'dd MMM')} - ${status || t('notMarkedStatus')}`}
            >
              <span>{format(day, 'd')}</span>
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="legend-item"><i className="legend-dot present"></i>{t('present')}</span>
        <span className="legend-item"><i className="legend-dot half"></i>{t('halfDay')}</span>
        <span className="legend-item"><i className="legend-dot absent"></i>{t('absent')}</span>
      </div>

      {/* ── Fingerprint security section (only shown if device supports it) ── */}
      {bioAvailable && (
        <div className="bio-security-card">
          <div className="bio-security-header">
            <span className="bio-security-icon">&#128274;</span>
            <div>
              <strong>{t('fingerprintSecurity')}</strong>
              <span>{bioEnrolled ? t('fingerprintActive') : t('fingerprintInactive')}</span>
            </div>
            <span className={`bio-status-dot ${bioEnrolled ? 'on' : 'off'}`}></span>
          </div>
          {bioMsg && <p className={`bio-msg ${bioEnrolled ? 'success' : 'error'}`}>{bioMsg}</p>}
          {bioEnrolled ? (
            <button
              className="btn-bio-remove"
              onClick={handleRemoveBiometric}
              disabled={bioLoading}
            >
              &#10005; {t('fingerprintRemoveBtn')}
            </button>
          ) : (
            <button
              className="btn-bio-enable"
              onClick={handleEnrollBiometric}
              disabled={bioLoading}
            >
              {bioLoading ? '...' : `&#128270; ${t('fingerprintEnableBtn')}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getCurrentUser } from '../utils/auth';
import { getWorkers, getAttendance, getAdvances, getMonthlyStats, getWorkerBalance } from '../utils/storage';
import './WorkerDashboard.css';

export default function WorkerDashboard() {
  const user = getCurrentUser();
  const workers = getWorkers();
  const worker = workers.find(w => w.id === user?.workerId);
  const attendance = getAttendance();
  const advances = getAdvances();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = useMemo(() => {
    return getMonthlyStats(user?.workerId, currentYear, currentMonth);
  }, [user?.workerId, currentYear, currentMonth]);

  const balance = useMemo(() => {
    return getWorkerBalance(user?.workerId, currentYear, currentMonth);
  }, [user?.workerId, currentYear, currentMonth]);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const monthAttendance = useMemo(() => {
    return attendance.filter(a => a.workerId === user?.workerId &&
      a.date >= format(monthStart, 'yyyy-MM-dd') &&
      a.date <= format(monthEnd, 'yyyy-MM-dd'));
  }, [attendance, user?.workerId, monthStart, monthEnd]);

  const getStatusColor = (dateStr) => {
    const rec = monthAttendance.find(a => a.date === dateStr);
    if (!rec) return '';
    return rec.status;
  };

  if (!worker) {
    return <div className="empty-state"><p>Worker not found. Contact admin.</p></div>;
  }

  return (
    <div className="worker-dashboard">
      <div className="welcome-card">
        <div className="welcome-info">
          <h2>Hello, {worker.name} &#128075;</h2>
          <p>Here's your monthly summary</p>
        </div>
        <div className="welcome-wage">
          <span className="wage-amount">&#8377;{worker.dailyWage}</span>
          <span className="wage-label">per day</span>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-chip present">
          <span className="stat-num">{stats.present}</span>
          <span className="stat-txt">Present</span>
        </div>
        <div className="stat-chip half">
          <span className="stat-num">{stats.halfDay}</span>
          <span className="stat-txt">Half Day</span>
        </div>
        <div className="stat-chip absent">
          <span className="stat-num">{stats.absent}</span>
          <span className="stat-txt">Absent</span>
        </div>
      </div>

      <div className="finance-cards">
        <div className="finance-card">
          <span className="finance-label">Total Earned</span>
          <span className="finance-value earned">&#8377;{balance.earned}</span>
        </div>
        <div className="finance-card">
          <span className="finance-label">Advance Taken</span>
          <span className="finance-value advance">&#8377;{balance.advance}</span>
        </div>
        <div className="finance-card highlight">
          <span className="finance-label">Net Balance</span>
          <span className={`finance-value ${balance.balance >= 0 ? 'positive' : 'negative'}`}>
            &#8377;{balance.balance}
          </span>
        </div>
      </div>

      <h3>{format(now, 'MMMM yyyy')} Calendar</h3>
      <div className="mini-calendar">
        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const status = getStatusColor(dateStr);
          const isToday = dateStr === format(now, 'yyyy-MM-dd');
          return (
            <div
              key={dateStr}
              className={`mini-cal-day ${status} ${isToday ? 'today' : ''}`}
              title={`${format(day, 'dd MMM')} - ${status || 'Not marked'}`}
            >
              <span>{format(day, 'd')}</span>
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="legend-item"><i className="legend-dot present"></i>Present</span>
        <span className="legend-item"><i className="legend-dot half"></i>Half</span>
        <span className="legend-item"><i className="legend-dot absent"></i>Absent</span>
      </div>
    </div>
  );
}

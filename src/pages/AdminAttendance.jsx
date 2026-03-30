import { useState, useMemo } from 'react';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useWorkers, useAttendance } from '../hooks/useData';
import { useTranslation } from '../utils/i18n';
import './AdminAttendance.css';

export default function AdminAttendance() {
  const { t } = useTranslation();
  const { workers } = useWorkers();
  const { attendance, markAttendance } = useAttendance();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('daily');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const todayAttendance = useMemo(() =>
    attendance.filter(a => a.date === dateStr),
    [attendance, dateStr]
  );

  const getStatus = (workerId) => todayAttendance.find(a => a.workerId === workerId)?.status || null;

  const handleMark = (workerId, newStatus) => {
    const currentStatus = getStatus(workerId);
    markAttendance(workerId, dateStr, currentStatus === newStatus ? null : newStatus, true);
  };

  const markAll = (status) => workers.forEach(w => markAttendance(w.id, dateStr, status, true));

  if (workers.length === 0) {
    return (
      <div className="admin-attendance">
        <h2>{t('attendance')}</h2>
        <div className="empty-state"><p>{t('addWorkersFirstAttendance')}</p></div>
      </div>
    );
  }

  return (
    <div className="admin-attendance">
      <h2>{t('manageAttendance')}</h2>

      <div className="view-toggle">
        <button className={`toggle-btn ${view === 'daily' ? 'active' : ''}`} onClick={() => setView('daily')}>{t('daily')}</button>
        <button className={`toggle-btn ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>{t('calendar')}</button>
      </div>

      {view === 'daily' && (
        <>
          <div className="date-nav">
            <button className="nav-btn" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>&#8249;</button>
            <input type="date" value={dateStr} onChange={e => setSelectedDate(new Date(e.target.value + 'T00:00:00'))} className="date-picker" />
            <button className="nav-btn" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>&#8250;</button>
          </div>
          <p className="date-label">{format(selectedDate, 'EEEE, dd MMMM yyyy')}</p>

          <div className="quick-actions">
            <button className="qa-btn present" onClick={() => markAll('present')}>{t('allPresent')}</button>
            <button className="qa-btn absent" onClick={() => markAll('absent')}>{t('allAbsent')}</button>
          </div>

          <div className="attendance-list">
            {workers.map(w => {
              const status = getStatus(w.id);
              return (
                <div key={w.id} className={`att-row ${status || ''}`}>
                  <div className="att-worker">
                    <span className="att-avatar">{w.name.charAt(0)}</span>
                    <span className="att-name">{w.name}</span>
                  </div>
                  <div className="att-buttons">
                    <button className={`att-btn p ${status === 'present' ? 'active' : ''}`} onClick={() => handleMark(w.id, 'present')}>P</button>
                    <button className={`att-btn h ${status === 'half' ? 'active' : ''}`} onClick={() => handleMark(w.id, 'half')}>H</button>
                    <button className={`att-btn a ${status === 'absent' ? 'active' : ''}`} onClick={() => handleMark(w.id, 'absent')}>A</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'calendar' && (
        <CalendarView workers={workers} attendance={attendance} t={t} />
      )}
    </div>
  );
}

function CalendarView({ workers, attendance, t }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <>
      <div className="date-nav">
        <button className="nav-btn" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>&#8249;</button>
        <span className="month-label">{format(monthDate, 'MMMM yyyy')}</span>
        <button className="nav-btn" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>&#8250;</button>
      </div>

      {workers.map(w => {
        const monthAtt = attendance.filter(a => a.workerId === w.id && a.date >= format(monthStart, 'yyyy-MM-dd') && a.date <= format(monthEnd, 'yyyy-MM-dd'));
        const present = monthAtt.filter(a => a.status === 'present').length;
        const half = monthAtt.filter(a => a.status === 'half').length;
        const absent = monthAtt.filter(a => a.status === 'absent').length;
        return (
          <div key={w.id} className="cal-worker">
            <h4>{w.name}</h4>
            <div className="cal-stats">
              <span className="cs present">P: {present}</span>
              <span className="cs half">H: {half}</span>
              <span className="cs absent">A: {absent}</span>
            </div>
            <div className="cal-grid">
              {days.map(day => {
                const ds = format(day, 'yyyy-MM-dd');
                const rec = monthAtt.find(a => a.date === ds);
                return (
                  <div key={ds} className={`cal-day ${rec?.status || ''}`} title={`${format(day, 'dd MMM')} - ${rec?.status || t('notMarkedStatus')}`}>
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

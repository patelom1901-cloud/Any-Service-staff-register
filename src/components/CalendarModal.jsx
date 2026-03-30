import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { useTranslation } from '../utils/i18n';
import './CalendarModal.css';

export default function CalendarModal({ workerName, workerId, attendance, onClose }) {
  const { t, lang } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getStatus = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const record = attendance.find(a => a.workerId === workerId && a.date === dateStr);
    return record ? record.status : null;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={e => e.stopPropagation()}>
        <div className="calendar-header">
          <div className="worker-info-mini">
            <span className="mini-avatar">{workerName.charAt(0).toUpperCase()}</span>
            <h3>{workerName}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="month-nav">
          <button className="nav-btn" onClick={prevMonth}>&#8249;</button>
          <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
          <button className="nav-btn" onClick={nextMonth}>&#8250;</button>
        </div>

        <div className="calendar-grid">
          {weekDays.map(d => (
            <div key={d} className="weekday-header">
              {d.charAt(0)}
            </div>
          ))}
          {days.map((day, idx) => {
            const status = getStatus(day);
            const isSelectedMonth = isSameMonth(day, startOfMonth(currentMonth));
            
            return (
              <div 
                key={idx} 
                className={`calendar-day 
                  ${!isSelectedMonth ? 'other-month' : ''} 
                  ${isToday(day) ? 'is-today' : ''}
                  ${status ? `status-${status}` : ''}
                `}
              >
                <span className="day-number">{format(day, 'd')}</span>
                {status === 'present' && <div className="status-dot present"></div>}
                {status === 'half' && <div className="status-dot half"></div>}
                {status === 'absent' && <div className="status-dot absent"></div>}
              </div>
            );
          })}
        </div>

        <div className="calendar-legend">
          <div className="legend-item">
            <span className="dot present"></span>
            <span>{t('present')}</span>
          </div>
          <div className="legend-item">
            <span className="dot half"></span>
            <span>{t('halfDay')}</span>
          </div>
          <div className="legend-item">
            <span className="dot absent"></span>
            <span>{t('absent')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

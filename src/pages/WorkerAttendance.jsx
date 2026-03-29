import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { getCurrentUser } from '../utils/auth';
import { getAttendance, markAttendance, getModificationCount, getAttendanceWindowStatus } from '../utils/storage';
import './WorkerAttendance.css';

export default function WorkerAttendance() {
  const user = getCurrentUser();
  const workerId = user?.workerId;
  const [refresh, setRefresh] = useState(0);

  const today = format(new Date(), 'yyyy-MM-dd');
  const windowStatus = getAttendanceWindowStatus();
  const modCount = getModificationCount(workerId, today);
  const modRemaining = Math.max(0, 2 - modCount);

  const allAttendance = useMemo(() => {
    refresh;
    return getAttendance();
  }, [refresh]);

  const todayStatus = useMemo(() => {
    const rec = allAttendance.find(a => a.workerId === workerId && a.date === today);
    return rec?.status || null;
  }, [allAttendance, workerId, today, refresh]);

  const handleMark = (status) => {
    if (!windowStatus.open) return;
    if (modRemaining <= 0 && todayStatus !== status) return;

    const result = markAttendance(workerId, today, status, false);
    if (!result.success) {
      alert(result.reason);
    }
    setRefresh(r => r + 1);
  };

  const handleClear = () => {
    if (!windowStatus.open) return;
    if (modRemaining <= 0) return;
    const result = markAttendance(workerId, today, null, false);
    if (!result.success) {
      alert(result.reason);
    }
    setRefresh(r => r + 1);
  };

  const recentAttendance = useMemo(() => {
    return allAttendance
      .filter(a => a.workerId === workerId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [allAttendance, workerId, refresh]);

  return (
    <div className="worker-attendance">
      <h2>Mark Today's Attendance</h2>
      <p className="date-label">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>

      <div className={`window-status ${windowStatus.open ? 'open' : 'closed'}`}>
        <span className="window-dot"></span>
        <span>{windowStatus.reason}</span>
      </div>

      <div className="mod-counter">
        <span>Modifications remaining today: </span>
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
          <span>Present</span>
        </button>
        <button
          className={`mark-btn half ${todayStatus === 'half' ? 'active' : ''}`}
          onClick={() => handleMark('half')}
          disabled={!windowStatus.open || (modRemaining <= 0 && todayStatus !== 'half')}
        >
          <span className="mark-icon">&#9728;</span>
          <span>Half Day</span>
        </button>
        <button
          className={`mark-btn absent ${todayStatus === 'absent' ? 'active' : ''}`}
          onClick={() => handleMark('absent')}
          disabled={!windowStatus.open || (modRemaining <= 0 && todayStatus !== 'absent')}
        >
          <span className="mark-icon">&#10060;</span>
          <span>Absent</span>
        </button>
      </div>

      {todayStatus && modRemaining > 0 && (
        <button className="clear-btn" onClick={handleClear}>
          Clear my attendance
        </button>
      )}

      {!windowStatus.open && modRemaining <= 0 && (
        <div className="admin-note">
          Contact admin to modify your attendance.
        </div>
      )}

      <h3>Recent Attendance</h3>
      <div className="recent-list">
        {recentAttendance.length === 0 ? (
          <div className="empty-state"><p>No attendance records yet.</p></div>
        ) : (
          recentAttendance.map(a => (
            <div key={`${a.workerId}_${a.date}`} className={`recent-item ${a.status}`}>
              <span className="recent-date">{format(new Date(a.date + 'T00:00:00'), 'dd MMM yyyy')}</span>
              <span className={`recent-status ${a.status}`}>
                {a.status === 'present' ? 'Present' : a.status === 'half' ? 'Half Day' : 'Absent'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { format } from 'date-fns';
import { getCurrentUser } from '../utils/auth';
import { getAdvancesByWorker } from '../utils/storage';
import './WorkerAdvances.css';

export default function WorkerAdvances() {
  const user = getCurrentUser();
  const workerId = user?.workerId;

  const advances = useMemo(() => {
    return getAdvancesByWorker(workerId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [workerId]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const monthlyTotal = useMemo(() => {
    return advances
      .filter(a => a.date.startsWith(prefix))
      .reduce((sum, a) => sum + a.amount, 0);
  }, [advances, prefix]);

  const yearlyTotal = useMemo(() => {
    return advances
      .filter(a => a.date.startsWith(String(currentYear)))
      .reduce((sum, a) => sum + a.amount, 0);
  }, [advances, currentYear]);

  return (
    <div className="worker-advances">
      <h2>My Advances</h2>

      <div className="advance-summary-cards">
        <div className="adv-summary-card">
          <span className="adv-sum-label">This Month</span>
          <span className="adv-sum-value">&#8377;{monthlyTotal}</span>
        </div>
        <div className="adv-summary-card">
          <span className="adv-sum-label">This Year</span>
          <span className="adv-sum-value">&#8377;{yearlyTotal}</span>
        </div>
      </div>

      <h3>All Records</h3>
      {advances.length === 0 ? (
        <div className="empty-state">
          <span>&#128176;</span>
          <p>No advance records yet.</p>
        </div>
      ) : (
        <div className="adv-list">
          {advances.map(a => (
            <div key={a.id} className="adv-card">
              <div className="adv-info">
                <span className="adv-date">{format(new Date(a.date), 'dd MMM yyyy')}</span>
                {a.reason && <span className="adv-reason">{a.reason}</span>}
              </div>
              <span className="adv-amount">&#8377;{a.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

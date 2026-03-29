import { useMemo } from 'react';
import { format } from 'date-fns';
import { getCurrentUser } from '../utils/auth';
import { useAdvances } from '../hooks/useData';
import { useTranslation } from '../utils/i18n';
import './WorkerAdvances.css';

export default function WorkerAdvances() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const workerId = user?.workerId;

  // Real-time: only this worker's advances, auto-updates when admin adds/removes
  const { advances } = useAdvances(workerId);

  const sortedAdvances = useMemo(() =>
    [...advances].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [advances]
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const monthlyTotal = useMemo(() =>
    advances.filter(a => a.date.startsWith(prefix)).reduce((s, a) => s + a.amount, 0),
    [advances, prefix]
  );

  const yearlyTotal = useMemo(() =>
    advances.filter(a => a.date.startsWith(String(currentYear))).reduce((s, a) => s + a.amount, 0),
    [advances, currentYear]
  );

  return (
    <div className="worker-advances">
      <h2>{t('myAdvances')}</h2>

      <div className="advance-summary-cards">
        <div className="adv-summary-card">
          <span className="adv-sum-label">{t('thisMonth')}</span>
          <span className="adv-sum-value">&#8377;{monthlyTotal}</span>
        </div>
        <div className="adv-summary-card">
          <span className="adv-sum-label">{t('thisYear')}</span>
          <span className="adv-sum-value">&#8377;{yearlyTotal}</span>
        </div>
      </div>

      <h3>{t('allRecords')}</h3>
      {sortedAdvances.length === 0 ? (
        <div className="empty-state">
          <span>&#128176;</span>
          <p>{t('noAdvancesYet')}</p>
        </div>
      ) : (
        <div className="adv-list">
          {sortedAdvances.map(a => (
            <div key={a.id} className="adv-card">
              <div className="adv-info">
                <span className="adv-date">{format(new Date(a.date + 'T00:00:00'), 'dd MMM yyyy')}</span>
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

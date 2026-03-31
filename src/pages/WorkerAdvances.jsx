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

  const isRepayment = (a) => a.amount < 0 || a.addedBy === 'repayment';

  const sortedAdvances = useMemo(() =>
    [...advances].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [advances]
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Only count actual advances (positive amounts) for the "taken" summary
  const monthlyTaken = useMemo(() =>
    advances
      .filter(a => a.date.startsWith(prefix) && !isRepayment(a))
      .reduce((s, a) => s + a.amount, 0),
    [advances, prefix]
  );

  const monthlyRepaid = useMemo(() =>
    advances
      .filter(a => a.date.startsWith(prefix) && isRepayment(a))
      .reduce((s, a) => s + Math.abs(a.amount), 0),
    [advances, prefix]
  );

  // Net = taken - repaid (same as sum of all amounts since repayments are negative)
  const monthlyNet = monthlyTaken - monthlyRepaid;

  const yearlyNet = useMemo(() =>
    advances
      .filter(a => a.date.startsWith(String(currentYear)))
      .reduce((s, a) => s + a.amount, 0),
    [advances, currentYear]
  );

  return (
    <div className="worker-advances">
      <h2>{t('myAdvances')}</h2>

      <div className="advance-summary-cards">
        <div className="adv-summary-card">
          <span className="adv-sum-label">{t('thisMonthTaken')}</span>
          <span className="adv-sum-value taken">&#8377;{monthlyTaken}</span>
        </div>
        <div className="adv-summary-card">
          <span className="adv-sum-label">{t('thisMonthRepaid')}</span>
          <span className="adv-sum-value repaid">&#8377;{monthlyRepaid}</span>
        </div>
        <div className="adv-summary-card highlight-card">
          <span className="adv-sum-label">{t('thisMonthNet')}</span>
          <span className={`adv-sum-value ${monthlyNet <= 0 ? 'repaid' : 'taken'}`}>
            &#8377;{monthlyNet}
          </span>
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
          {sortedAdvances.map(a => {
            const repay = isRepayment(a);
            return (
              <div key={a.id} className={`adv-card ${repay ? 'repayment-card' : ''}`}>
                <div className="adv-info">
                  <div className={`adv-type-dot ${repay ? 'repay-dot' : 'advance-dot'}`}></div>
                  <div>
                    <span className="adv-date">
                      {format(new Date(a.date + 'T00:00:00'), 'dd MMM yyyy')}
                    </span>
                    {a.reason && <span className="adv-reason">{a.reason}</span>}
                    {repay && <span className="repay-badge">{t('repaymentLabel')}</span>}
                  </div>
                </div>
                <span className={`adv-amount ${repay ? 'repay-amount' : ''}`}>
                  {repay ? '+' : '-'}&#8377;{Math.abs(a.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

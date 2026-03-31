import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useWorkers, useAdvances, useStats } from '../hooks/useData';
import { useAttendance } from '../hooks/useData';
import AdvanceForm from '../components/AdvanceForm';
import { useTranslation } from '../utils/i18n';
import './Advances.css';

export default function Advances() {
  const { t } = useTranslation();
  const { workers } = useWorkers();
  const { advances, addAdvance, deleteAdvance, addRepayment } = useAdvances();
  const { attendance } = useAttendance();
  const { getBalance } = useStats(workers, attendance, advances);

  const [showForm, setShowForm] = useState(false);
  const [showRepayForm, setShowRepayForm] = useState(false);
  const [filterWorker, setFilterWorker] = useState('all');

  // Repayment form state
  const [repayWorker, setRepayWorker] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayNote, setRepayNote] = useState('');
  const [repayError, setRepayError] = useState('');
  const [repayLoading, setRepayLoading] = useState(false);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filteredAdvances = useMemo(() => {
    let filtered = [...advances].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterWorker !== 'all') filtered = filtered.filter(a => a.workerId === filterWorker);
    return filtered;
  }, [advances, filterWorker]);

  const handleAdd = async (data) => {
    await addAdvance(data);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('deleteAdvanceConfirm'))) await deleteAdvance(id);
  };

  const handleRepaySubmit = async (e) => {
    e.preventDefault();
    if (!repayWorker) { setRepayError(t('selectWorkerPlaceholder')); return; }
    const amt = Number(repayAmount);
    if (!amt || amt <= 0) { setRepayError(t('repayAmountError')); return; }
    setRepayLoading(true);
    const result = await addRepayment({
      workerId: repayWorker,
      amount: amt,
      date: repayDate,
      reason: repayNote || t('repaymentLabel'),
    });
    setRepayLoading(false);
    if (result.success) {
      setShowRepayForm(false);
      setRepayWorker('');
      setRepayAmount('');
      setRepayNote('');
      setRepayError('');
    } else {
      setRepayError(result.error || t('repayAmountError'));
    }
  };

  const getWorkerName = (id) => workers.find(w => w.id === id)?.name || 'Unknown';

  const isRepayment = (a) => a.amount < 0 || a.addedBy === 'repayment';

  if (workers.length === 0) {
    return (
      <div className="advances-page">
        <h2>{t('advances')}</h2>
        <div className="empty-state"><p>{t('addWorkersFirstAdvance')}</p></div>
      </div>
    );
  }

  return (
    <div className="advances-page">
      <h2>{t('advances')}</h2>

      {/* ── Per-worker summary ─────────────────────────────────── */}
      <div className="adv-summary">
        <h4>{t('thisMonthByWorker')}</h4>
        {workers.map(w => {
          const bal = getBalance(w.id, currentYear, currentMonth);
          return (
            <div key={w.id} className="adv-summary-row">
              <span>{w.name}</span>
              <span className={`adv-sum-val ${bal.advance <= 0 ? 'repaid' : ''}`}>
                &#8377;{bal.advance}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Action buttons ─────────────────────────────────────── */}
      {!showForm && !showRepayForm && (
        <div className="adv-action-row">
          <button className="add-worker-btn" onClick={() => setShowForm(true)}>
            {t('addAdvance')}
          </button>
          <button className="repay-btn" onClick={() => setShowRepayForm(true)}>
            &#8617; {t('recordRepayment')}
          </button>
        </div>
      )}

      {showForm && (
        <AdvanceForm workers={workers} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {/* ── Repayment form ─────────────────────────────────────── */}
      {showRepayForm && (
        <form className="repay-form" onSubmit={handleRepaySubmit}>
          <h4>{t('recordRepayment')}</h4>

          <label>{t('selectWorker')}</label>
          <select value={repayWorker} onChange={e => { setRepayWorker(e.target.value); setRepayError(''); }} required>
            <option value="">{t('selectWorkerPlaceholder')}</option>
            {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          <label>{t('repayAmount')}</label>
          <input
            type="number"
            min="1"
            value={repayAmount}
            onChange={e => { setRepayAmount(e.target.value); setRepayError(''); }}
            placeholder="e.g. 5000"
            required
          />

          <label>{t('date')}</label>
          <input
            type="date"
            value={repayDate}
            onChange={e => setRepayDate(e.target.value)}
            required
          />

          <label>{t('repayNote')}</label>
          <input
            type="text"
            value={repayNote}
            onChange={e => setRepayNote(e.target.value)}
            placeholder={t('repayNotePlaceholder')}
          />

          {repayError && <p className="repay-error">{repayError}</p>}

          <div className="repay-form-actions">
            <button type="submit" className="btn btn-primary" disabled={repayLoading}>
              {repayLoading ? '...' : t('recordRepaymentBtn')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setShowRepayForm(false); setRepayError(''); }}
              disabled={repayLoading}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {/* ── Filter ─────────────────────────────────────────────── */}
      <div className="filter-bar">
        <label>{t('filter')}</label>
        <select value={filterWorker} onChange={e => setFilterWorker(e.target.value)}>
          <option value="all">{t('allWorkers')}</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {/* ── Advance / Repayment list ───────────────────────────── */}
      <div className="adv-list">
        {filteredAdvances.length === 0 ? (
          <div className="empty-state"><p>{t('noAdvanceRecords')}</p></div>
        ) : (
          filteredAdvances.map(a => {
            const repay = isRepayment(a);
            return (
              <div key={a.id} className={`adv-card ${repay ? 'repayment-card' : ''}`}>
                <div className="adv-info">
                  <div className={`adv-avatar ${repay ? 'repay-avatar' : ''}`}>
                    {repay ? '↩' : getWorkerName(a.workerId).charAt(0)}
                  </div>
                  <div>
                    <span className="adv-name">{getWorkerName(a.workerId)}</span>
                    <span className="adv-date">{format(new Date(a.date + 'T00:00:00'), 'dd MMM yyyy')}</span>
                    {a.reason && <span className="adv-reason">{a.reason}</span>}
                    {repay && <span className="repay-badge">{t('repaymentLabel')}</span>}
                  </div>
                </div>
                <div className="adv-right">
                  <span className={`adv-amount ${repay ? 'repay-amount' : ''}`}>
                    {repay ? '+' : '-'}&#8377;{Math.abs(a.amount)}
                  </span>
                  <button className="adv-del" onClick={() => handleDelete(a.id)}>&#10005;</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

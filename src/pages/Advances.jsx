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
  const { advances, addAdvance, deleteAdvance } = useAdvances();
  const { attendance } = useAttendance();
  const { getBalance } = useStats(workers, attendance, advances);
  const [showForm, setShowForm] = useState(false);
  const [filterWorker, setFilterWorker] = useState('all');

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

  const getWorkerName = (id) => workers.find(w => w.id === id)?.name || 'Unknown';

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

      <div className="adv-summary">
        <h4>{t('thisMonthByWorker')}</h4>
        {workers.map(w => {
          const bal = getBalance(w.id, currentYear, currentMonth);
          return (
            <div key={w.id} className="adv-summary-row">
              <span>{w.name}</span>
              <span className="adv-sum-val">&#8377;{bal.advance}</span>
            </div>
          );
        })}
      </div>

      {!showForm && (
        <button className="add-worker-btn" onClick={() => setShowForm(true)}>
          {t('addAdvance')}
        </button>
      )}

      {showForm && <AdvanceForm workers={workers} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />}

      <div className="filter-bar">
        <label>{t('filter')}</label>
        <select value={filterWorker} onChange={e => setFilterWorker(e.target.value)}>
          <option value="all">{t('allWorkers')}</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div className="adv-list">
        {filteredAdvances.length === 0 ? (
          <div className="empty-state"><p>{t('noAdvanceRecords')}</p></div>
        ) : (
          filteredAdvances.map(a => (
            <div key={a.id} className="adv-card">
              <div className="adv-info">
                <div className="adv-avatar">{getWorkerName(a.workerId).charAt(0)}</div>
                <div>
                  <span className="adv-name">{getWorkerName(a.workerId)}</span>
                  <span className="adv-date">{format(new Date(a.date + 'T00:00:00'), 'dd MMM yyyy')}</span>
                  {a.reason && <span className="adv-reason">{a.reason}</span>}
                </div>
              </div>
              <div className="adv-right">
                <span className="adv-amount">&#8377;{a.amount}</span>
                <button className="adv-del" onClick={() => handleDelete(a.id)}>&#10005;</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

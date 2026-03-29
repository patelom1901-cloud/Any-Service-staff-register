import { useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from '../utils/i18n';

export default function AdvanceForm({ workers, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [workerId, setWorkerId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!workerId || !amount) return;
    onSubmit({ workerId, amount: Number(amount), date, reason: reason.trim() });
    setWorkerId(''); setAmount(''); setDate(format(new Date(), 'yyyy-MM-dd')); setReason('');
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3>{t('addAdvance')}</h3>
      <div className="form-group">
        <label>{t('selectWorker')} *</label>
        <select value={workerId} onChange={e => setWorkerId(e.target.value)} required>
          <option value="">{t('selectWorkerPlaceholder')}</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>{t('amount')} *</label>
        <input
          type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="e.g. 1000" min="1" required
        />
      </div>
      <div className="form-group">
        <label>{t('date')} *</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>{t('reason')}</label>
        <input
          type="text" value={reason} onChange={e => setReason(e.target.value)}
          placeholder={t('reasonPlaceholder')}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">{t('addAdvanceBtn')}</button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t('cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

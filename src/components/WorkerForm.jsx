import { useState } from 'react';
import { useTranslation } from '../utils/i18n';

export default function WorkerForm({ worker, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState(worker?.name || '');
  const [phone, setPhone] = useState(worker?.phone || '');
  const [pin, setPin] = useState(worker?.pin || '');
  const [dailyWage, setDailyWage] = useState(worker?.dailyWage || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !dailyWage) return;
    let finalPin = pin.trim();
    if (!/^\d{4}$/.test(finalPin)) finalPin = '0000';
    onSubmit({ name: name.trim(), phone: phone.trim(), dailyWage: Number(dailyWage), pin: finalPin });
    setName(''); setPhone(''); setDailyWage(''); setPin('0000');
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3>{worker ? t('editWorker') : t('addWorker')}</h3>
      <div className="form-group">
        <label>{t('name')}</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder={t('workerNamePlaceholder')} maxLength="50" required
        />
      </div>
      <div className="form-group">
        <label>{t('phone')}</label>
        <input
          type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder={t('phonePlaceholder')} maxLength="15"
        />
      </div>
      <div className="form-group">
        <label>{t('loginPin')}</label>
        <input
          type="text" pattern="\d{4}" maxLength="4" value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="0000" title="4-digit PIN for worker login"
        />
        <small style={{ display: 'block', color: 'var(--gray-500)', marginTop: '4px' }}>
          {t('pinDefault')}
        </small>
      </div>
      <div className="form-group">
        <label>{t('dailyWage')}</label>
        <input
          type="number" value={dailyWage} onChange={e => setDailyWage(e.target.value)}
          placeholder={t('wagePlaceholder')} min="1" max="10000" required
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {worker ? t('updateWorker') : t('addWorker')}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t('cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
